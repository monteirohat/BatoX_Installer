// The API exposed by the preload script (see src/preload/preload.ts).

import type { BatoxApi } from "../shared/types";

declare global {
  interface Window {
    batox: BatoxApi;
  }
}

export const api: BatoxApi = window.batox;

/** Electron prefixes errors from the main process; keep only the message. */
export function errorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${i === 0 ? n : n.toFixed(1)} ${units[i]}`;
}
