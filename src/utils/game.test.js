import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import {
  applyPlayerMove,
  applyUciMove,
  createSavedGameData,
  getGameStatus,
  parseImportedGame,
  restoreSavedGameData,
  shouldBotMove,
  snapshotGame,
} from "./game";

describe("snapshotGame", () => {
  it("captures live PGN and board orientation", () => {
    const chess = new Chess();
    chess.move("e4");
    chess.move("e5");

    expect(snapshotGame(chess, "b")).toMatchObject({
      fen: chess.fen(),
      pgn: "1. e4 e5",
      boardOrientation: "black",
      turn: "w",
      lastMove: "e5",
    });
  });
});

describe("saved game persistence", () => {
  it("serializes the current game to a resumable payload", () => {
    const chess = new Chess();
    chess.move("e4");
    chess.move("c5");

    expect(createSavedGameData(chess, "b", "2026-03-23T12:00:00.000Z")).toEqual({
      playerColor: "b",
      pgn: "1. e4 c5",
      savedAt: "2026-03-23T12:00:00.000Z",
    });
  });

  it("restores a saved payload back into a live chess position", () => {
    const restored = restoreSavedGameData({
      playerColor: "b",
      pgn: "1. e4 c5 2. Nf3 d6",
      savedAt: "2026-03-23T12:00:00.000Z",
    });

    expect(restored.playerColor).toBe("b");
    expect(restored.savedAt).toBe("2026-03-23T12:00:00.000Z");
    expect(restored.chess.fen()).toBe(
      "rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3"
    );
  });
});

describe("parseImportedGame", () => {
  it("loads a pasted PGN into a read-only coaching snapshot", () => {
    const imported = parseImportedGame("1. d4 Nf6 2. c4 e6 3. Nc3 Bb4", "w");

    expect(imported).toMatchObject({
      pgn: "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4",
      moveCount: 6,
      turn: "w",
      boardOrientation: "white",
      lastMove: "Bb4",
    });
  });

  it("rejects empty PGN input", () => {
    expect(() => parseImportedGame("   ", "w")).toThrow(
      "Paste a PGN from lichess to load a game."
    );
  });
});

describe("applyPlayerMove", () => {
  it("applies a legal move and updates the game", () => {
    const chess = new Chess();

    const move = applyPlayerMove(chess, "e2", "e4");

    expect(move).toMatchObject({
      from: "e2",
      to: "e4",
      san: "e4",
    });
    expect(chess.fen()).toBe(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
    );
  });

  it("rejects an illegal move without changing the board", () => {
    const chess = new Chess();
    const originalFen = chess.fen();

    expect(applyPlayerMove(chess, "e2", "e5")).toBeNull();
    expect(chess.fen()).toBe(originalFen);
  });
});

describe("applyUciMove", () => {
  it("parses and applies a UCI move from the engine", () => {
    const chess = new Chess();

    const move = applyUciMove(chess, "g1f3");

    expect(move).toMatchObject({
      from: "g1",
      to: "f3",
      san: "Nf3",
    });
  });
});

describe("shouldBotMove", () => {
  it("waits when it is the player's turn", () => {
    const chess = new Chess();

    expect(shouldBotMove(chess, "w", false)).toBe(false);
  });

  it("requests a bot move when the chosen player is Black at game start", () => {
    const chess = new Chess();

    expect(shouldBotMove(chess, "b", false)).toBe(true);
  });

  it("stops requesting moves after the game is over", () => {
    const chess = new Chess();
    chess.loadPgn("1. f3 e5 2. g4 Qh4#");

    expect(shouldBotMove(chess, "w", false)).toBe(false);
  });
});

describe("getGameStatus", () => {
  it("reports checkmate winners", () => {
    const chess = new Chess();
    chess.loadPgn("1. f3 e5 2. g4 Qh4#");

    expect(getGameStatus(chess)).toMatchObject({
      isGameOver: true,
      outcome: "checkmate",
      winner: "b",
      message: "Black wins by checkmate",
    });
  });

  it("reports stalemate as a draw", () => {
    const chess = new Chess("4k3/4P3/4K3/8/8/8/8/8 b - - 0 78");

    expect(getGameStatus(chess)).toMatchObject({
      isGameOver: true,
      outcome: "stalemate",
      winner: null,
      message: "Draw by stalemate",
    });
  });
});
