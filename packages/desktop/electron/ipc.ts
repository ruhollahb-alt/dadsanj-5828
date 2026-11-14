import { ipcMain, dialog, Notification, app, type BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";

// Starter IPC handlers backing window.electronAPI (see preload.ts and
// packages/web/src/web/lib/desktop.ts). Fully editable — change, remove, or add
// handlers to fit the app; keep the preload methods and web types in sync.
// openExternal and onDeepLink come from @runablehq/managed-auth (wired in
// preload.ts), not from here.

export function registerIpcHandlers(getWindow: () => BrowserWindow | null) {
  const dataPath = () => path.join(app.getPath("userData"), "damages-data.ini");
  const workspacePath = () => path.join(app.getPath("userData"), "dadsanj-workspace.json");
  const backupPath = (n: number) => `${workspacePath()}.bak${n}`;
  ipcMain.handle("data:readIni", async () => {
    try { return await fs.readFile(dataPath(), "utf-8"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  });
  ipcMain.handle("data:writeIni", async (_, content: string) => {
    await fs.mkdir(path.dirname(dataPath()), { recursive: true });
    await fs.writeFile(dataPath(), content, "utf-8");
  });
  ipcMain.handle("calculation:print", async () => {
    const win = getWindow();
    if (!win || win.isDestroyed()) throw new Error("پنجرهٔ برنامه در دسترس نیست.");
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      win.webContents.print({ silent: false, printBackground: false, pageSize: "A4" },
        (success, failureReason) => resolve({ success, error: success ? undefined : failureReason }));
    });
  });
  // Multi-case workspace: atomic replace with rotating backups. A failed write
  // leaves the previous file untouched, and the last three saves remain
  // restorable from the UI.
  ipcMain.handle("workspace:read", async () => {
    try { return await fs.readFile(workspacePath(), "utf-8"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  });
  ipcMain.handle("workspace:write", async (_, content: string) => {
    if (typeof content !== "string") throw new Error("محتوای فضای کار نامعتبر است.");
    await fs.mkdir(path.dirname(workspacePath()), { recursive: true });
    for (let i = 2; i >= 1; i--) {
      try { await fs.copyFile(backupPath(i), backupPath(i + 1)); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    try { await fs.copyFile(workspacePath(), backupPath(1)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const temp = `${workspacePath()}.tmp`;
    await fs.writeFile(temp, content, "utf-8");
    await fs.rename(temp, workspacePath());
  });
  ipcMain.handle("workspace:restore", async () => {
    for (let i = 1; i <= 3; i++) {
      try { return await fs.readFile(backupPath(i), "utf-8"); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    return null;
  });

  // Dialog
  ipcMain.handle("dialog:open", async (_, opts) => {
    const result = await dialog.showOpenDialog(opts);
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle("dialog:save", async (_, opts) => {
    const result = await dialog.showSaveDialog(opts);
    return result.canceled ? null : result.filePath;
  });

  // File system
  ipcMain.handle("fs:read", async (_, filePath: string) => {
    return fs.readFile(filePath, "utf-8");
  });

  ipcMain.handle("fs:write", async (_, filePath: string, data: string) => {
    await fs.writeFile(filePath, data, "utf-8");
  });

  ipcMain.handle("fs:writeBase64", async (_, filePath: string, data: string) => {
    if (typeof data !== "string") throw new Error("دادهٔ فایل نامعتبر است.");
    await fs.writeFile(filePath, Buffer.from(data, "base64"));
  });

  // Notifications
  ipcMain.handle("notification:show", (_, title: string, body: string) => {
    new Notification({ title, body }).show();
  });

  // Window controls
  ipcMain.handle("window:minimize", () => getWindow()?.minimize());
  ipcMain.handle("window:maximize", () => {
    const win = getWindow();
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });
  ipcMain.handle("window:close", () => getWindow()?.close());
}
