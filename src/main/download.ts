// Streams a file to disk with progress, and computes SHA-256 checksums.

import { createHash } from "node:crypto";
import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";

export async function downloadFile(
  url: string,
  dest: string,
  signal: AbortSignal,
  onProgress: (received: number) => void,
): Promise<void> {
  const res = await fetch(url, { signal, headers: { "User-Agent": "BatoX-Installer" } });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed (HTTP ${res.status}): ${path.basename(dest)}`);
  }

  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  const tmp = dest + ".part";
  const file = fs.createWriteStream(tmp);
  let received = 0;
  try {
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      received += chunk.length;
      if (!file.write(chunk)) {
        await once(file, "drain");
      }
      onProgress(received);
    }
    file.end();
    await once(file, "finish");
  } catch (err) {
    file.destroy();
    await fs.promises.rm(tmp, { force: true });
    throw err;
  }
  await fs.promises.rename(tmp, dest);
}

export async function sha256(file: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of fs.createReadStream(file)) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

/** Parses a SHA256SUMS file ("<hash>  <name>" per line) into name -> hash. */
export function parseChecksums(text: string): Map<string, string> {
  const sums = new Map<string, string>();
  for (const line of text.split("\n")) {
    const m = /^([a-f0-9]{64})\s+\*?(.+)$/i.exec(line.trim());
    if (m) {
      sums.set(m[2].trim(), m[1].toLowerCase());
    }
  }
  return sums;
}
