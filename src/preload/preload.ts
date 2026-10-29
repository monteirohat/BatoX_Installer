// Runs in an isolated, sandboxed context and exposes a small typed API to the
// interface as window.batox. The interface has no direct access to Node or SSH.

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { BatoxApi, InstallProgress } from "../shared/types";

const api: BatoxApi = {
  listReleases: () => ipcRenderer.invoke("releases:list"),
  getRelease: tag => ipcRenderer.invoke("releases:get", tag),
  inspect: target => ipcRenderer.invoke("console:inspect", target),
  install: options => ipcRenderer.invoke("install:start", options),
  cancelInstall: () => ipcRenderer.invoke("install:cancel"),
  onProgress: callback => {
    const listener = (_event: IpcRendererEvent, progress: InstallProgress) => callback(progress);
    ipcRenderer.on("install:progress", listener);
    return () => { ipcRenderer.removeListener("install:progress", listener); };
  },
  openExternal: url => ipcRenderer.invoke("app:open-external", url),
  copy: text => ipcRenderer.invoke("app:copy", text),
  appInfo: () => ipcRenderer.invoke("app:info"),
};

contextBridge.exposeInMainWorld("batox", api);
