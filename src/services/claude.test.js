import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    constructor() {
      this.messages = {
        create: createMock,
      };
    }
  },
}));

import { getCoachingHint } from "./claude";

describe("getCoachingHint prompt perspective", () => {
  beforeEach(() => {
    createMock.mockReset();
    createMock.mockResolvedValue({
      content: [{ text: "mock coaching hint" }],
    });
  });

  it("includes Black perspective with positive score when black to move", async () => {
    const fen = "1r1qr1k1/1pp2pbp/p1n3p1/2Pp2B1/3P2b1/2Q2N2/PP2BPPP/2KR3R b - - 6 16";
    const analysis = {
      bestMove: "d8d7",
      evaluation: -263,
      mate: null,
      lines: [
        {
          depth: 20,
          multipv: 1,
          score: -263,
          mate: null,
          pv: "d8d7 g5e3 b7b6",
        },
      ],
    };

    await getCoachingHint(fen, analysis);

    expect(createMock).toHaveBeenCalledTimes(1);
    const request = createMock.mock.calls[0][0];
    const userMessage = request.messages[0].content;
    expect(userMessage).toContain("Player to move: Black");
    expect(userMessage).toContain("+2.63 pawns");
    expect(userMessage).not.toContain("-2.63 pawns");
  });

  it("keeps White perspective score when white to move", async () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const analysis = {
      bestMove: "e2e4",
      evaluation: 30,
      mate: null,
      lines: [
        {
          depth: 20,
          multipv: 1,
          score: 30,
          mate: null,
          pv: "e2e4 e7e5",
        },
      ],
    };

    await getCoachingHint(fen, analysis);

    const request = createMock.mock.calls[0][0];
    const userMessage = request.messages[0].content;
    expect(userMessage).toContain("Player to move: White");
    expect(userMessage).toContain("+0.30 pawns");
  });

  it("inverts line-level scores for black-to-move prompts", async () => {
    const fen = "1r1qr1k1/1pp2pbp/p1n3p1/2Pp2B1/3P2b1/2Q2N2/PP2BPPP/2KR3R b - - 6 16";
    const analysis = {
      bestMove: "d8d7",
      evaluation: -263,
      mate: null,
      lines: [
        {
          depth: 20,
          multipv: 1,
          score: -263,
          mate: null,
          pv: "d8d7 g5e3",
        },
        {
          depth: 20,
          multipv: 2,
          score: -186,
          mate: null,
          pv: "d8c8 g5e3",
        },
      ],
    };

    await getCoachingHint(fen, analysis);

    const request = createMock.mock.calls[0][0];
    const userMessage = request.messages[0].content;
    expect(userMessage).toContain("Line 1 (eval +2.63)");
    expect(userMessage).toContain("Line 2 (eval +1.86)");
  });

  it("inverts mate score in prompt for black-to-move", async () => {
    const fen = "6k1/8/8/8/8/8/8/6K1 b - - 0 1";
    const analysis = {
      bestMove: "d8h4",
      evaluation: -99997,
      mate: -3,
      lines: [
        {
          depth: 20,
          multipv: 1,
          score: -99997,
          mate: -3,
          pv: "d8h4 g2g3 h4e1",
        },
      ],
    };

    await getCoachingHint(fen, analysis);

    const request = createMock.mock.calls[0][0];
    const userMessage = request.messages[0].content;
    expect(userMessage).toContain("Mate in 3");
    expect(userMessage).toContain("Line 1 (eval mate in 3)");
  });

  it("uses the selected player color when it differs from side to move", async () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const analysis = {
      bestMove: "e2e4",
      evaluation: 30,
      mate: null,
      lines: [
        {
          depth: 20,
          multipv: 1,
          score: 30,
          mate: null,
          pv: "e2e4 e7e5",
        },
      ],
    };

    await getCoachingHint(fen, analysis, "b");

    const request = createMock.mock.calls[0][0];
    const userMessage = request.messages[0].content;
    expect(userMessage).toContain("Player color: Black");
    expect(userMessage).toContain("Player to move: White");
    expect(userMessage).toContain("-0.30 pawns");
    expect(userMessage).toContain("Line 1 (eval -0.30)");
  });
});
