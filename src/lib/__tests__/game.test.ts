import { describe, expect, it } from "vitest";
import { calcTotalsForTest, clampInt, possibleWinnings } from "@/lib/game";

describe("clampInt", () => {
  it("clamps and coerces numeric input", () => {
    expect(clampInt("5", 1, 10)).toBe(5);
    expect(clampInt(99, 1, 10)).toBe(10);
    expect(clampInt(-3, 0, 5)).toBe(0);
  });

  it("falls back to the minimum for invalid values", () => {
    expect(clampInt("abc", 2, 4)).toBe(2);
  });
});

describe("possibleWinnings", () => {
  it("returns $100 per full group", () => {
    expect(possibleWinnings(0)).toBe(0);
    expect(possibleWinnings(3)).toBe(300);
  });

  it("guards against negative numbers", () => {
    expect(possibleWinnings(-2)).toBe(0);
  });
});

describe("calcTotalsForTest", () => {
  it("calculates totals when using stick counts", () => {
    const totals = calcTotalsForTest({ groups: 3, sticks: 27, pot: 10 });
    expect(totals).toMatchObject({ groups: 3, totalCharged: 270, possibleW: 300 });
  });

  it("calculates totals when given explicit prices", () => {
    const totals = calcTotalsForTest({ groups: 1, prices: [10, 10] });
    expect(totals).toMatchObject({ groups: 1, totalCharged: 20, possibleW: 100 });
  });

  it("handles empty groups gracefully", () => {
    const totals = calcTotalsForTest({ groups: 0, prices: [] });
    expect(totals).toMatchObject({ groups: 0, totalCharged: 0, possibleW: 0 });
  });
});
