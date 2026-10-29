// Types shared by the main process, the preload script and the interface.
// They describe the small API the interface uses to talk to the system.

/** GitHub repository the BatoX releases come from. */
export const REPO = "monteirohat/BatoX";

export interface ReleaseAsset {
  name: string;
  size: number;
  url: string;
}

export interface Release {
  tag: string;
  name: string;
  publishedAt: string;
  prerelease: boolean;
  url: string;
  notes: string;
  assets: ReleaseAsset[];
}

/** How to reach the console over SSH. */
export interface Target {
  host: string;
  port: number;
  username: string;
  password: string;
}

/** What the installer found on the console. */
export interface ConsoleInfo {
  host: string;
  batoceraVersion: string;
  model: string;
  arch: "arm64" | "amd64";
  installedVersion: string | null;
  hasMyMine: boolean;
}

export type StepId = "connect" | "inspect" | "download" | "verify" | "migrate" | "upload" | "start" | "check";
export type StepState = "pending" | "active" | "done" | "skipped" | "error";

export interface InstallProgress {
  step: StepId;
  state: StepState;
  detail?: string;
  /** 0-100, only for the download step. */
  percent?: number;
}

export interface InstallOptions {
  target: Target;
  tag: string;
}

export interface InstallResult {
  url: string;
  token: string | null;
  version: string;
  console: ConsoleInfo;
  updatedFrom: string | null;
}

export interface AppInfo {
  version: string;
  repo: string;
}

/** Exposed to the interface as window.batox by the preload script. */
export interface BatoxApi {
  listReleases(): Promise<Release[]>;
  getRelease(tag: string): Promise<Release>;
  inspect(target: Target): Promise<ConsoleInfo>;
  install(options: InstallOptions): Promise<InstallResult>;
  cancelInstall(): Promise<void>;
  /** Subscribes to install progress; returns a function that unsubscribes. */
  onProgress(callback: (progress: InstallProgress) => void): () => void;
  openExternal(url: string): Promise<void>;
  copy(text: string): Promise<void>;
  appInfo(): Promise<AppInfo>;
}
