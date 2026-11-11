import { describe, expect, test } from "bun:test";
import { calculateStandard, calculatePartial, calculateInstallment, emptyData } from "./calculator";
import { addMissingDefaults, defaultIndices, initializeData, matchesReference } from "./default-indices";
import { fromIni, toIni } from "./ini";

describe("documented CBI defaults", () => {
  test("144 unique positive monthly values, one bounded series", () => {
    expect(defaultIndices.length).toBe(144);
    expect(new Set(defaultIndices.map(r => r.month)).size).toBe(144);
    expect(defaultIndices[0]).toEqual({ month: "1390/01", value: "37.5" });
    expect(defaultIndices.at(-1)).toEqual({ month: "1401/12", value: "794.3" });
    expect(defaultIndices.every(r => Number(r.value) > 0)).toBe(true);
    expect(defaultIndices.find(r => r.month === "1395/07")?.value).toBe("100");
  });
  test("fresh initialization and INI round trip", () => {
    const fresh = initializeData();
    expect(fromIni(toIni(fresh))).toEqual(fresh);
    fresh.indices[0].value = "99";
    expect(initializeData().indices[0].value).toBe("37.5");
  });
  test("migration preserves custom values, forms and payments", () => {
    const old = structuredClone(emptyData);
    old.indices = [{ month: "۱۴۰۰/۱", value: "400" }, { month: "1403/01", value: "1125.8" }];
    old.standard.principal = "12345";
    old.partial.payments = [{ id: "keep", date: "1400/02/01", amount: "200" }];
    const merged = initializeData(old);
    expect(merged.indices.length).toBe(145);
    expect(merged.indices[0].value).toBe("400");
    expect(merged.standard).toEqual(old.standard);
    expect(merged.partial).toEqual(old.partial);
    expect(addMissingDefaults(merged).indices.length).toBe(145);
    expect(matchesReference(merged.indices[0])).toBe(false);
  });
  test("deletions persist across restart, restore only fills missing months", () => {
    const fresh = initializeData();
    fresh.indices = fresh.indices.slice(1);
    const loaded = initializeData(fromIni(toIni(fresh)));
    expect(loaded.indices.length).toBe(143);
    expect(addMissingDefaults(loaded).indices.length).toBe(144);
  });
  test("three calculators use defaults and reject unsupported months", () => {
    const data = initializeData();
    data.standard = { principal: "1000000000", start: "1400/01/01", end: "1401/12/01" };
    const standard = calculateStandard(data);
    expect(standard.total).toBe(Math.round(1000000000 * 794.3 / 378.3));
    expect(standard.startIndex).toBe(378.3);
    data.partial = { ...data.standard, payments: [] };
    expect(calculatePartial(data).total).toBe(standard.total);
    data.installment = { principal: "1000000000", start: "1400/01/01", ruling: "1401/12/01", initial: "200000000", mode: "count", value: "3" };
    expect(calculateInstallment(data).total).toBe(standard.total);
    data.standard.end = "1402/01/01";
    expect(() => calculateStandard(data)).toThrow("شاخص ماه 1402/01 موجود نیست");
  });
});