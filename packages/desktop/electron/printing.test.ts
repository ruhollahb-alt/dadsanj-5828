import { beforeEach, describe, expect, mock, test } from "bun:test";

const handlers = new Map<string, (...args: unknown[]) => unknown>();
mock.module("electron", () => ({
  ipcMain: { handle: (name: string, fn: (...args: unknown[]) => unknown) => handlers.set(name, fn) },
  dialog: {}, Notification: class {}, app: { getPath: () => "/unused-test-path" },
}));
const { registerIpcHandlers } = await import("./ipc");

describe("native calculation print bridge", () => {
  beforeEach(() => handlers.clear());
  test("opens a non-silent A4 print job and reports submission", async () => {
    let options: unknown;
    const win = { isDestroyed: () => false, webContents: {
      print: (opts: unknown, callback: (success: boolean) => void) => { options = opts; callback(true); },
    } };
    registerIpcHandlers(() => win as never);
    expect(await handlers.get("calculation:print")!()).toEqual({ success: true, error: undefined });
    expect(options).toEqual({ silent: false, printBackground: false, pageSize: "A4" });
  });
  test("preserves cancellation or printer failure without reporting success", async () => {
    const win = { isDestroyed: () => false, webContents: {
      print: (_: unknown, callback: (success: boolean, reason: string) => void) => callback(false, "Print job canceled"),
    } };
    registerIpcHandlers(() => win as never);
    expect(await handlers.get("calculation:print")!()).toEqual({ success: false, error: "Print job canceled" });
  });
  test("rejects printing when the app window is missing", async () => {
    registerIpcHandlers(() => null);
    expect(handlers.get("calculation:print")!()).rejects.toThrow("پنجرهٔ برنامه در دسترس نیست");
  });
});