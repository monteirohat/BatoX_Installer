// Electron main process: creates the window and answers the interface's
// requests (releases, console inspection, installation).

import { app, BrowserWindow, clipboard, ipcMain, shell } from "electron";
import path from "node:path";
import { getRelease, listReleases } from "./github";
import { inspectConsole, install } from "./installer";
import { REPO, type InstallOptions, type Target } from "../shared/types";

let win: BrowserWindow | null = null;
let installing: AbortController | null = null;

function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1040,
    height: 700,
    minWidth: 900,
    minHeight: 620,
    show: false,
    title: "BatoX Installer",
    backgroundColor: "#0B1120",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.once("ready-to-show", () => win?.show());
  win.on("closed", () => { win = null; });

  // Links open in the system browser, never inside the installer window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isWebUrl(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", event => event.preventDefault());

  const devServer = process.env.VITE_DEV_SERVER_URL;
  if (devServer) {
    void win.loadURL(devServer);
  } else {
    void win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

function registerIpc(): void {
  ipcMain.handle("releases:list", () => listReleases());
  ipcMain.handle("releases:get", (_event, tag: string) => getRelease(tag));
  ipcMain.handle("console:inspect", (_event, target: Target) => inspectConsole(target));

  ipcMain.handle("install:start", async (event, options: InstallOptions) => {
    if (installing) {
      throw new Error("An installation is already running.");
    }
    installing = new AbortController();
    try {
      return await install(options, installing.signal, progress => {
        if (!event.sender.isDestroyed()) event.sender.send("install:progress", progress);
      });
    } finally {
      installing = null;
    }
  });
  ipcMain.handle("install:cancel", () => installing?.abort());

  ipcMain.handle("app:open-external", (_event, url: string) => {
    if (isWebUrl(url)) return shell.openExternal(url);
  });
  ipcMain.handle("app:copy", (_event, text: string) => clipboard.writeText(String(text)));
  ipcMain.handle("app:info", () => ({ version: app.getVersion(), repo: REPO }));
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
