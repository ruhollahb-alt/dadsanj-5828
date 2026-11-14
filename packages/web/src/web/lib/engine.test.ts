import { describe, expect, test } from "bun:test";
import { calculateDamages, type IndexSource } from "./cpi";
import { calculateInstallment, calculateLateInstallment, calculateStandard, emptyData } from "./calculator";
import { initializeData } from "./default-indices";

function sourceWith(month: string, level: number): IndexSource {
  return {
    hasIndex: () => true,
    getIndex: (m) => {
      const key = `${m.year}/${String(m.month).padStart(2, "0")}`;
      return key === month ? { level, inflation: null } : { level: 1000, inflation: null };
    },
  };
}

describe("calculation engine", () => {
  test("index source is per-call and never leaks between calculations", () => {
    const input = {
      debt: 1_000_000,
      from: { year: 1403, month: 10 },
      to: { year: 1404, month: 10 },
    };
    const low = calculateDamages({ ...input, indices: sourceWith("1403/10", 500) });
    const high = calculateDamages({ ...input, indices: sourceWith("1403/10", 2000) });
    expect(low.total).toBe(2_000_000);
    expect(high.total).toBe(500_000);
    const again = calculateDamages({ ...input, indices: sourceWith("1403/10", 500) });
    expect(again.total).toBe(low.total);
  });

  test("standard calculation exposes yearly segments", () => {
    const data = initializeData();
    data.standard = { principal: "500000000", start: "1403/10/01", end: "1405/07/01" };
    const result = calculateStandard(data);
    expect(result.total).toBe(1_259_451_730);
    expect(result.segments?.length).toBe(2);
    expect(result.segments?.[0].from).toBe("1403/10");
    expect(result.segments?.at(-1)?.to).toBe("1405/07");
    expect(result.segments?.[0].indexFrom).toBe(1433.6);
    expect(result.segments?.at(-1)?.indexTo).toBe(3611.1);
  });

  test("late installment damages use due and payment months", () => {
    const data = initializeData();
    const damages = calculateLateInstallment(data, {
      amount: "100000000",
      due: "1403/10/01",
      paid: "1405/07/01",
    });
    expect(damages).toBe(Math.round(100_000_000 * (3611.1 / 1433.6) - 100_000_000));
    expect(calculateLateInstallment(data, {
      amount: "100000000",
      due: "1405/07/01",
      paid: "1405/07/01",
    })).toBe(0);
  });

  test("manual index rows change the result without mutating defaults", () => {
    const data = initializeData();
    data.standard = { principal: "500000000", start: "1403/10/01", end: "1405/07/01" };
    const base = calculateStandard(data).total;
    data.indices = data.indices.map((row) => row.month === "1403/10" ? { ...row, value: "1500" } : row);
    const changed = calculateStandard(data).total;
    expect(changed).toBe(Math.round(500_000_000 * (3611.1 / 1500)));
    expect(changed).not.toBe(base);
  });

  test("installment plan keeps working through the refactored source", () => {
    const data = initializeData();
    data.installment = {
      principal: "500000000",
      start: "1403/10/01",
      ruling: "1405/07/01",
      initial: "50000000",
      mode: "count",
      value: "6",
    };
    const result = calculateInstallment(data);
    expect(result.total).toBe(1_259_451_730);
    expect(result.plan).toHaveLength(7);
    expect(result.plan?.reduce((sum, row) => sum + row.total, 0)).toBe(result.total);
  });

  test("empty data points the user at the missing inputs", () => {
    expect(() => calculateStandard(emptyData)).toThrow("مبلغ اصل دین");
  });
});
