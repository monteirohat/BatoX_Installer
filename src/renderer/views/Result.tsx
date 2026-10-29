// Screens shown after an installation: success (address and token) or failure.

import { useState } from "react";
import type { InstallResult } from "../../shared/types";
import { api } from "../api";
import { AlertIcon, CheckIcon, CopyIcon, ExternalIcon } from "../components/Icons";
import { ProgressList, type StepMap } from "./Progress";

export function Success({ result, onAgain }: { result: InstallResult; onAgain: () => void }) {
  const [copied, setCopied] = useState(false);
  const updated = result.updatedFrom && result.updatedFrom !== result.version;

  async function copyToken() {
    if (!result.token) return;
    await api.copy(result.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="result">
      <div className="result-icon ok"><CheckIcon size={40} /></div>
      <h1>{updated ? `BatoX was updated to ${result.version}` : `BatoX ${result.version} is installed`}</h1>
      <p className="muted">
        {result.console.model || result.console.host} is ready. Open BatoX from any browser on your network.
      </p>

      <div className="result-cards">
        <div className="result-card">
          <span className="muted small">Address</span>
          <code>{result.url}</code>
          <button className="btn btn-primary" onClick={() => void api.openExternal(result.url)}>
            Open BatoX <ExternalIcon size={16} />
          </button>
        </div>
        <div className="result-card">
          <span className="muted small">API token</span>
          <code>{result.token ?? "Set in config.json on the console"}</code>
          <button className="btn" onClick={() => void copyToken()} disabled={!result.token}>
            <CopyIcon size={16} /> {copied ? "Copied" : "Copy token"}
          </button>
        </div>
      </div>
      <p className="muted small">
        In BatoX, open the Access screen, paste the token and choose Save and test.
      </p>
      <button className="btn" onClick={onAgain}>Install on another console</button>
    </section>
  );
}

export function Failure({ message, steps, onBack }: { message: string; steps: StepMap; onBack: () => void }) {
  return (
    <section className="result">
      <div className="result-icon error"><AlertIcon size={36} /></div>
      <h1>The installation didn't finish</h1>
      <div className="notice error result-message">{message}</div>
      <ProgressList steps={steps} />
      <button className="btn btn-primary" onClick={onBack}>Back</button>
    </section>
  );
}
