import { describe, expect, it } from "vitest";
import { StockfishEngine } from "./stockfish";

describe("StockfishEngine._parseInfo", () => {
  it("negates cp score when black is to move", () => {
    const engine = new StockfishEngine();
    const line =
      "info depth 20 seldepth 30 multipv 1 score cp 263 nodes 1000000 nps 500000 time 2000 pv d8d7 g5e3 b7b6";

    expect(engine._parseInfo(line, true)).toEqual({
      depth: 20,
      multipv: 1,
      score: -263,
      mate: null,
      pv: "d8d7 g5e3 b7b6",
    });
  });

  it("keeps cp score sign when white is to move", () => {
    const engine = new StockfishEngine();
    const line =
      "info depth 20 seldepth 30 multipv 1 score cp 263 nodes 1000000 nps 500000 time 2000 pv d8d7 g5e3 b7b6";

    expect(engine._parseInfo(line, false)).toEqual({
      depth: 20,
      multipv: 1,
      score: 263,
      mate: null,
      pv: "d8d7 g5e3 b7b6",
    });
  });

  it("negates mate score and computes mate cp equivalent for black to move", () => {
    const engine = new StockfishEngine();
    const line =
      "info depth 20 seldepth 10 multipv 1 score mate 3 nodes 500000 nps 250000 time 2000 pv d8h4 g2g3 h4e1";

    expect(engine._parseInfo(line, true)).toEqual({
      depth: 20,
      multipv: 1,
      score: -99997,
      mate: -3,
      pv: "d8h4 g2g3 h4e1",
    });
  });
});
