import { beforeEach, describe, expect, mock, test } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let userData = "";

const handlers = new Map<string, (...args: unknown[]) => unknown>();
mock.module("electron", () => ({
  ipcMain: { handle: (name: string, fn: (...args: unknown[]) => unknown) => handlers.set(name, fn) },
  dialog: {},
  Notification: class {},
  app: { getPath: () => userData },
}));

const { registerIpcHandlers } = await import("./ipc");

describe("workspace persistence bridge", () => {
  beforeEach(async () => {
    handlers.clear();
    userData = await fs.mkdtemp(path.join(os.tmpdir(), "dadsanj-workspace-"));
    registerIpcHandlers(() => null);
  });

  test("reads, writes and rotates three backups", async () => {
    const read = handlers.get("workspace:read")!;
    const write = handlers.get("workspace:write")!;
    const restore = handlers.get("workspace:restore")!;

    expect(await read()).toBeNull();
    await write({}, "A");
    expect(await read()).toBe("A");
    await write({}, "B");
    await write({}, "C");
    await write({}, "D");
    expect(await read()).toBe("D");
    expect(await restore()).toBe("C");
    expect(await fs.readFile(path.join(userData, "dadsanj-workspace.json.bak2"), "utf-8")).toBe("B");
    expect(await fs.readFile(path.join(userData, "dadsanj-workspace.json.bak3"), "utf-8")).toBe("A");
  });

  test("rejects a non-string workspace payload", () => {
    expect(handlers.get("workspace:write")!({}, 42)).rejects.toThrow("محتوای فضای کار نامعتبر است");
  });

  test("writes base64 files without text corruption", async () => {
    const target = path.join(userData, "report.xlsx");
    const payload = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0xff]).toString("base64");
    await handlers.get("fs:writeBase64")!({}, target, payload);
    expect([...await fs.readFile(target)]).toEqual([0x50, 0x4b, 0x03, 0x04, 0x00, 0xff]);
  });
});
