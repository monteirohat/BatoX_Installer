// The installation steps, with their state and the download progress.

import type { InstallProgress, StepId } from "../../shared/types";
import { AlertIcon, CheckIcon, MinusIcon, Spinner } from "../components/Icons";

export const STEPS: { id: StepId; label: string }[] = [
  { id: "connect", label: "Connect to the console" },
  { id: "inspect", label: "Check Batocera" },
  { id: "download", label: "Download BatoX" },
  { id: "verify", label: "Verify the download" },
  { id: "migrate", label: "Migrate MyMine" },
  { id: "upload", label: "Copy files to the console" },
  { id: "start", label: "Start the BatoX service" },
  { id: "check", label: "Test the API" },
];

export type StepMap = Partial<Record<StepId, InstallProgress>>;

function StateIcon({ state }: { state: InstallProgress["state"] | undefined }) {
  switch (state) {
    case "active": return <Spinner size={16} />;
    case "done": return <CheckIcon size={16} />;
    case "skipped": return <MinusIcon size={16} />;
    case "error": return <AlertIcon size={16} />;
    default: return <span className="dot" />;
  }
}

export function ProgressList({ steps }: { steps: StepMap }) {
  // The MyMine migration only matters to people upgrading from MyMine: show it once it runs.
  const migrate = steps.migrate?.state;
  const visible = STEPS.filter(s => s.id !== "migrate" || migrate === "active" || migrate === "done" || migrate === "error");
  return (
    <ol className="progress-list">
      {visible.map(({ id, label }) => {
        const p = steps[id];
        const state = p?.state ?? "pending";
        return (
          <li key={id} data-state={state}>
            <span className="progress-icon"><StateIcon state={p?.state} /></span>
            <span className="progress-label">
              {label}
              {p?.detail && state !== "error" && <small> {p.detail}</small>}
              {id === "download" && state === "active" && p?.percent !== undefined && (
                <span className="bar" role="progressbar" aria-valuenow={p.percent} aria-valuemin={0} aria-valuemax={100}>
                  <i style={{ width: `${p.percent}%` }} />
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Overall progress: finished steps, with the download counting by its percentage. */
export function overallPercent(steps: StepMap): number {
  let total = 0;
  for (const { id } of STEPS) {
    const p = steps[id];
    if (p?.state === "done" || p?.state === "skipped") total += 1;
    else if (id === "download" && p?.state === "active") total += (p.percent ?? 0) / 100;
  }
  return Math.round((total / STEPS.length) * 100);
}
