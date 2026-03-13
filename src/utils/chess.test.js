import { describe, expect, it } from "vitest";
import { evalToPercent, evalToText } from "./chess";

describe("evalToText", () => {
  it("formats centipawn scores", () => {
    expect(evalToText(47, null)).toBe("+0.47");
    expect(evalToText(-263, null)).toBe("-2.63");
    expect(evalToText(0, null)).toBe("+0.00");
    expect(evalToText(100, null)).toBe("+1.00");
    expect(evalToText(-100, null)).toBe("-1.00");
  });

  it("formats mate scores with sign", () => {
    expect(evalToText(0, 3)).toBe("+M3");
    expect(evalToText(0, -3)).toBe("-M3");
    expect(evalToText(0, 1)).toBe("+M1");
    expect(evalToText(0, -1)).toBe("-M1");
  });

  it("falls back to centipawns when mate is nullish", () => {
    expect(evalToText(50, null)).toBe("+0.50");
    expect(evalToText(50, undefined)).toBe("+0.50");
  });
});

describe("evalToPercent", () => {
  it("maps 0 cp to 50 percent", () => {
    expect(evalToPercent(0)).toBe(50);
  });

  it("maps positive and negative scores symmetrically", () => {
    expect(evalToPercent(500)).toBeCloseTo(88.08, 1);
    expect(evalToPercent(-500)).toBeCloseTo(11.92, 1);
  });

  it("clamps at 2 and 98", () => {
    expect(evalToPercent(10000)).toBe(98);
    expect(evalToPercent(-10000)).toBe(2);
  });
});
