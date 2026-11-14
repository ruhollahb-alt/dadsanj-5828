import { describe, expect, test } from "bun:test";
import { initializeData } from "./default-indices";
import { coverageBetween } from "./coverage";

describe("index coverage", () => {
  const data = initializeData();

  test("reports a fully covered range", () => {
    const info = coverageBetween(data.indices, "1403/10/01", "1405/07/01")!;
    expect(info.totalMonths).toBe(22);
    expect(info.missing).toEqual([]);
  });

  test("lists missing months inside the range only", () => {
    const rows = data.indices.filter((row) => row.month !== "1404/03" && row.month !== "1405/01");
    const info = coverageBetween(rows, "1403/10/01", "1405/07/01")!;
    expect(info.missing).toEqual(["1404/03", "1405/01"]);
  });

  test("stays quiet for invalid or reversed dates", () => {
    expect(coverageBetween(data.indices, "", "1405/07/01")).toBeNull();
    expect(coverageBetween(data.indices, "1405/07/01", "1403/10/01")).toBeNull();
    expect(coverageBetween(data.indices, "۱۴۰۳/۱۰/۰۱", "۱۴۰۵/۰۷/۰۱")!.missing).toEqual([]);
  });
});
