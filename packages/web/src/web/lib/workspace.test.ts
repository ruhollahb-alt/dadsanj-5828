import { describe, expect, test } from "bun:test";
import { emptyData } from "./calculator";
import { initializeData } from "./default-indices";
import {
  activeCase,
  addCase,
  createWorkspace,
  deleteCase,
  duplicateCase,
  normalizeWorkspace,
  withCaseData,
  withCaseName,
} from "./workspace";

describe("multi-case workspace", () => {
  test("creates a valid workspace and normalizes malformed JSON", () => {
    const workspace = createWorkspace(initializeData(), "پروندهٔ نمونه");
    expect(workspace.cases).toHaveLength(1);
    expect(activeCase(workspace).name).toBe("پروندهٔ نمونه");
    expect(activeCase(workspace).data.indices.length).toBe(367);

    expect(normalizeWorkspace(null)).toBeNull();
    expect(normalizeWorkspace({ cases: [] })).toBeNull();

    const repaired = normalizeWorkspace({
      cases: [
        { id: "a", data: { standard: { principal: "100" } } },
        { id: "a", name: "تکراری", data: null },
      ],
      activeId: "missing",
    });
    expect(repaired).not.toBeNull();
    expect(repaired!.cases).toHaveLength(2);
    expect(new Set(repaired!.cases.map((item) => item.id)).size).toBe(2);
    expect(repaired!.activeId).toBe(repaired!.cases[0].id);
    expect(repaired!.cases[0].data.standard.principal).toBe("100");
    expect(repaired!.cases[0].data.partial.payments).toEqual([]);
    expect(repaired!.cases[0].data.installment.mode).toBe("count");
  });

  test("adds, renames and deletes cases without losing the active one", () => {
    let workspace = createWorkspace(initializeData());
    workspace = addCase(workspace, initializeData());
    expect(workspace.cases).toHaveLength(2);
    expect(activeCase(workspace).name).toBe("پروندهٔ ۲");

    workspace = withCaseName(workspace, workspace.activeId, "  پروندهٔ الف  ");
    expect(activeCase(workspace).name).toBe("پروندهٔ الف");

    const firstId = workspace.cases[0].id;
    workspace = { ...workspace, activeId: firstId };
    workspace = deleteCase(workspace, firstId);
    expect(workspace.cases).toHaveLength(1);
    expect(workspace.activeId).toBe(workspace.cases[0].id);

    expect(deleteCase(workspace, workspace.activeId).cases).toHaveLength(1);
  });

  test("duplicates deep-copy data and writes case data independently", () => {
    let workspace = createWorkspace(initializeData(), "اصل");
    workspace = withCaseData(workspace, workspace.activeId, {
      ...workspace.cases[0].data,
      standard: { principal: "123", start: "1403/01/01", end: "1403/12/01" },
    });
    workspace = duplicateCase(workspace, workspace.activeId);
    const copy = activeCase(workspace);
    expect(copy.name).toBe("اصل (کپی)");
    expect(copy.data.standard.principal).toBe("123");

    const original = workspace.cases.find((item) => item.id !== copy.id)!;
    workspace = withCaseData(workspace, original.id, {
      ...original.data,
      standard: { ...original.data.standard, principal: "999" },
    });
    expect(activeCase(workspace).data.standard.principal).toBe("123");
    expect(workspace.cases.find((item) => item.id === original.id)!.data.standard.principal).toBe("999");
  });

  test("accepts an empty case and keeps legacy forms intact", () => {
    const record = normalizeWorkspace({
      cases: [{ id: "x", name: "قدیمی", data: { ...emptyData, defaultsRevision: "v1" } }],
      activeId: "x",
    })!;
    expect(activeCase(record).data.defaultsRevision).toBe("v1");
    expect(activeCase(record).data.indices).toEqual([]);
  });
});
