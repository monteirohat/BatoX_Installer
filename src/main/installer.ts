// Inspects a Batocera console and installs BatoX on it over SSH. The steps
// mirror scripts/deploy.sh in the BatoX repository.

import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { downloadFile, parseChecksums, sha256 } from "./download";
import { getRelease } from "./github";
import { Remote, describeError } from "./ssh";
import type {
  ConsoleInfo,
  InstallOptions,
  InstallProgress,
  InstallResult,
  Release,
  ReleaseAsset,
  StepId,
  Target,
} from "../shared/types";

const APP_DIR = "/userdata/system/batox";
const SERVICE_DIR = "/userdata/system/services";
const SERVICE = `${SERVICE_DIR}/batox`;
const LEGACY_DIR = "/userdata/system/mymine";
const LEGACY_SERVICE = `${SERVICE_DIR}/mymine`;
const DEFAULT_PORT = 8080;

// Prints key=value lines describing the console.
const INSPECT_SCRIPT = [
  'echo "batocera=$(test -d /userdata/system && echo yes || echo no)"',
  'echo "version=$(head -n 1 /usr/share/batocera/batocera.version 2>/dev/null)"',
  'echo "arch=$(uname -m)"',
  'echo "services=$(command -v batocera-services >/dev/null 2>&1 && echo yes || echo no)"',
  `echo "installed=$([ -x ${APP_DIR}/batox ] && ${APP_DIR}/batox -version 2>/dev/null)"`,
  `echo "legacy=$([ -d ${LEGACY_DIR} ] || [ -e ${LEGACY_SERVICE} ] && echo yes || echo no)"`,
  `echo "model=$(tr -d '\\0' 2>/dev/null < /proc/device-tree/model)"`,
].join("\n");

// Moves a MyMine install (BatoX's former name) to BatoX, keeping its data.
const MIGRATE_SCRIPT = `
batocera-services stop mymine >/dev/null 2>&1 || true
batocera-services disable mymine >/dev/null 2>&1 || true
rm -f ${LEGACY_SERVICE}
if [ -d ${LEGACY_DIR} ] && [ ! -e ${APP_DIR} ]; then
  mv ${LEGACY_DIR} ${APP_DIR}
  [ -f ${APP_DIR}/mymine.db ] && mv ${APP_DIR}/mymine.db ${APP_DIR}/batox.db
  rm -f ${APP_DIR}/mymine
fi
exit 0
`;

type Report = (progress: InstallProgress) => void;

function parseKeyValues(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const i = line.indexOf("=");
    if (i > 0) {
      out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return out;
}

async function inspectWith(remote: Remote, host: string): Promise<ConsoleInfo> {
  const { stdout } = await remote.exec(INSPECT_SCRIPT);
  const kv = parseKeyValues(stdout);
  if (kv.batocera !== "yes") {
    throw new Error("This machine doesn't look like Batocera: the /userdata/system folder was not found.");
  }
  if (kv.services !== "yes") {
    throw new Error("BatoX needs Batocera v38 or newer (the batocera-services command was not found).");
  }
  const arch = kv.arch === "aarch64" || kv.arch === "arm64" ? "arm64" : kv.arch === "x86_64" ? "amd64" : null;
  if (!arch) {
    throw new Error(`Unsupported processor (${kv.arch || "unknown"}). BatoX runs on 64-bit ARM boards, such as the Raspberry Pi 4 and 5, and on x86_64 PCs.`);
  }
  return {
    host,
    batoceraVersion: kv.version || "unknown",
    model: kv.model || "",
    arch,
    installedVersion: kv.installed || null,
    hasMyMine: kv.legacy === "yes",
  };
}

/** Connects, checks that the machine can run BatoX, and disconnects. */
export async function inspectConsole(target: Target): Promise<ConsoleInfo> {
  const remote = new Remote();
  try {
    await remote.connect(target);
    return await inspectWith(remote, target.host);
  } catch (err) {
    throw new Error(describeError(err, target.host));
  } finally {
    remote.close();
  }
}

interface LocalFiles {
  binary: string;
  service: string;
  config?: string;
  sums?: string;
}

async function hasSize(file: string, size: number): Promise<boolean> {
  try {
    return (await fs.promises.stat(file)).size === size;
  } catch {
    return false;
  }
}

/** Downloads the release files for the console's architecture, reusing cached copies. */
async function downloadRelease(
  release: Release,
  arch: ConsoleInfo["arch"],
  signal: AbortSignal,
  onPercent: (percent: number) => void,
): Promise<LocalFiles> {
  const names = { binary: `batox-linux-${arch}`, service: "batox", config: "config.example.json", sums: "SHA256SUMS" };
  const find = (name: string) => release.assets.find(a => a.name === name);
  const binary = find(names.binary);
  const service = find(names.service);
  if (!binary || !service) {
    throw new Error(`Release ${release.tag} doesn't include the files for this console (${names.binary} and ${names.service}).`);
  }
  const assets = [binary, service, find(names.config), find(names.sums)].filter((a): a is ReleaseAsset => !!a);

  const dir = path.join(app.getPath("userData"), "releases", release.tag.replace(/[^\w.-]/g, "_"));
  const total = assets.reduce((n, a) => n + a.size, 0) || 1;
  let finished = 0;
  const local: Record<string, string> = {};

  for (const asset of assets) {
    const dest = path.join(dir, asset.name);
    if (!(await hasSize(dest, asset.size))) {
      await downloadFile(asset.url, dest, signal, received => {
        onPercent(Math.min(100, Math.round(((finished + received) / total) * 100)));
      });
    }
    finished += asset.size;
    onPercent(Math.round((finished / total) * 100));
    local[asset.name] = dest;
  }
  return { binary: local[names.binary], service: local[names.service], config: local[names.config], sums: local[names.sums] };
}

/** Checks the downloaded files against SHA256SUMS; deletes them if they don't match. */
async function verify(files: LocalFiles): Promise<void> {
  if (!files.sums) {
    return;
  }
  const sums = parseChecksums(await fs.promises.readFile(files.sums, "utf8"));
  for (const file of [files.binary, files.service, files.config]) {
    if (!file) continue;
    const expected = sums.get(path.basename(file));
    if (expected && (await sha256(file)) !== expected) {
      await fs.promises.rm(file, { force: true });
      throw new Error(`${path.basename(file)} is corrupted (checksum mismatch). Try again to download it again.`);
    }
  }
}

/** Reads the port BatoX listens on from its config.json (":8080" by default). */
async function readPort(remote: Remote): Promise<number> {
  const { stdout } = await remote.exec(`cat ${APP_DIR}/config.json 2>/dev/null`);
  try {
    const listen = String(JSON.parse(stdout).listen ?? "");
    const m = /:(\d+)$/.exec(listen);
    if (m) return Number(m[1]);
  } catch {
    // No config or no "listen": the default applies.
  }
  return DEFAULT_PORT;
}

function urlHost(host: string): string {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

function shortVersion(v: string): string {
  return v.split(" ")[0];
}

/** Installs or updates BatoX on the console, reporting each step. */
export async function install(options: InstallOptions, signal: AbortSignal, report: Report): Promise<InstallResult> {
  const { target, tag } = options;
  const remote = new Remote();
  let current: StepId = "connect";

  const begin = (step: StepId, detail?: string) => {
    current = step;
    report({ step, state: "active", detail });
  };
  const done = (step: StepId, detail?: string) => report({ step, state: "done", detail });
  const skip = (step: StepId, detail?: string) => report({ step, state: "skipped", detail });
  const checkCancel = () => {
    if (signal.aborted) throw new Error("Installation cancelled.");
  };
  const onAbort = () => remote.close();
  signal.addEventListener("abort", onAbort);

  try {
    begin("connect", target.host);
    await remote.connect(target);
    checkCancel();
    done("connect", target.host);

    begin("inspect");
    const info = await inspectWith(remote, target.host);
    checkCancel();
    done("inspect", `Batocera ${shortVersion(info.batoceraVersion)}, ${info.arch}`);

    begin("download", tag);
    const release = await getRelease(tag);
    const files = await downloadRelease(release, info.arch, signal, percent => {
      report({ step: "download", state: "active", detail: release.tag, percent });
    });
    checkCancel();
    done("download", release.tag);

    if (files.sums) {
      begin("verify");
      await verify(files);
      done("verify");
    } else {
      skip("verify", "This release has no checksums");
    }

    if (info.hasMyMine) {
      begin("migrate");
      await remote.exec(MIGRATE_SCRIPT);
      done("migrate");
    } else {
      skip("migrate");
    }
    checkCancel();

    begin("upload");
    await remote.exec(`batocera-services stop batox >/dev/null 2>&1 || true; mkdir -p ${APP_DIR} ${SERVICE_DIR}`);
    await remote.upload(files.binary, `${APP_DIR}/batox.new`, 0o755);
    await remote.upload(files.service, SERVICE, 0o755);
    const hasConfig = (await remote.exec(`test -f ${APP_DIR}/config.json && echo yes || echo no`)).stdout.trim() === "yes";
    if (!hasConfig && files.config) {
      await remote.upload(files.config, `${APP_DIR}/config.json`, 0o644);
    }
    checkCancel();
    done("upload");

    begin("start");
    const started = await remote.exec(
      `mv ${APP_DIR}/batox.new ${APP_DIR}/batox && chmod +x ${APP_DIR}/batox ${SERVICE} && ` +
        `sed -i 's/\\r$//' ${SERVICE} && batocera-services enable batox && batocera-services start batox`,
    );
    if (started.code !== 0) {
      throw new Error(`The BatoX service did not start: ${(started.stderr || started.stdout).trim() || `exit code ${started.code}`}`);
    }
    done("start");

    begin("check");
    const port = await readPort(remote);
    const ping = await remote.exec(
      `for i in $(seq 1 15); do curl -fsS http://127.0.0.1:${port}/api/v1/ping >/dev/null 2>&1 && exit 0; sleep 1; done; exit 1`,
    );
    if (ping.code !== 0) {
      throw new Error(`BatoX was installed but is not answering on port ${port}. Its logs are in ${APP_DIR}/logs on the console.`);
    }
    const token = (await remote.exec(`cat ${APP_DIR}/token 2>/dev/null`)).stdout.trim() || null;
    done("check");

    return {
      url: `http://${urlHost(target.host)}:${port}/`,
      token,
      version: release.tag,
      console: info,
      updatedFrom: info.installedVersion,
    };
  } catch (err) {
    const message = signal.aborted ? "Installation cancelled." : describeError(err, target.host);
    report({ step: current, state: "error", detail: message });
    throw new Error(message);
  } finally {
    signal.removeEventListener("abort", onAbort);
    remote.close();
  }
}
