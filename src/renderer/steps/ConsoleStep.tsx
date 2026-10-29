// Step 2: the console's address and SSH login. "Check" connects, confirms it is
// Batocera v38+ on a supported processor, and shows what is installed.

import { useState, type ChangeEvent } from "react";
import type { ConsoleInfo, Target } from "../../shared/types";
import { api, errorMessage } from "../api";
import { ConsoleIcon, Spinner } from "../components/Icons";
import { StepCard } from "../components/StepCard";

interface Props {
  info: ConsoleInfo | null;
  onChange: (target: Target | null, info: ConsoleInfo | null) => void;
  disabled: boolean;
}

const saved = (key: string, fallback: string) => localStorage.getItem("installer." + key) || fallback;

export function ConsoleStep({ info, onChange, disabled }: Props) {
  const [host, setHost] = useState(() => saved("host", "batocera.local"));
  const [username, setUsername] = useState(() => saved("username", "root"));
  const [password, setPassword] = useState("linux");
  const [port, setPort] = useState(() => saved("port", "22"));
  const [advanced, setAdvanced] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Any change to the connection data invalidates the previous check.
  function edit(setter: (v: string) => void) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setError(null);
      if (info) onChange(null, null);
    };
  }

  async function check() {
    const target: Target = {
      host: host.trim(),
      port: Number(port) || 22,
      username: username.trim() || "root",
      password,
    };
    if (!target.host) {
      setError("Enter the console's address.");
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const found = await api.inspect(target);
      localStorage.setItem("installer.host", target.host);
      localStorage.setItem("installer.username", target.username);
      localStorage.setItem("installer.port", String(target.port));
      onChange(target, found);
    } catch (err) {
      setError(errorMessage(err));
      onChange(null, null);
    } finally {
      setChecking(false);
    }
  }

  const busy = disabled || checking;

  return (
    <StepCard number={2} title="Console" icon={<ConsoleIcon size={28} />} complete={!!info}>
      <label className="field">
        <span>Batocera address</span>
        <input
          value={host}
          onChange={edit(setHost)}
          onKeyDown={e => { if (e.key === "Enter") void check(); }}
          placeholder="batocera.local or 192.168.1.50"
          disabled={busy}
          spellCheck={false}
          autoComplete="off"
        />
        <small className="muted">Find the IP on the console in Main menu &gt; Network settings.</small>
      </label>

      <button className="link" onClick={() => setAdvanced(a => !a)} aria-expanded={advanced} disabled={busy}>
        {advanced ? "Hide SSH login" : "SSH login (root / linux)"}
      </button>
      {advanced && (
        <div className="grid-2">
          <label className="field">
            <span>User</span>
            <input value={username} onChange={edit(setUsername)} disabled={busy} spellCheck={false} />
          </label>
          <label className="field">
            <span>Port</span>
            <input value={port} onChange={edit(setPort)} disabled={busy} inputMode="numeric" />
          </label>
          <label className="field span-2">
            <span>Password</span>
            <input type="password" value={password} onChange={edit(setPassword)} disabled={busy} />
            <small className="muted">Batocera's default is "linux". It is never saved.</small>
          </label>
        </div>
      )}

      <button className="btn" onClick={() => void check()} disabled={busy}>
        {checking ? <><Spinner /> Checking…</> : info ? "Check again" : "Check console"}
      </button>

      {error && <div className="notice error">{error}</div>}
      {info && (
        <div className="selection">
          <strong className="selection-title">{info.model || info.host}</strong>
          <span className="muted">
            Batocera {info.batoceraVersion.split(" ")[0]}, {info.arch === "arm64" ? "ARM 64-bit" : "x86_64"}
          </span>
          <span className={info.installedVersion ? "tag" : "tag tag-muted"}>
            {info.installedVersion ? `BatoX ${info.installedVersion} installed` : "BatoX not installed yet"}
          </span>
          {info.hasMyMine && <span className="tag">MyMine found: it will be migrated</span>}
        </div>
      )}
    </StepCard>
  );
}
