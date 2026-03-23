import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { StockfishEngine } from "../engine/stockfish";
import {
  applyPlayerMove,
  applyUciMove,
  createSavedGameData,
  restoreSavedGameData,
  snapshotGame,
  shouldBotMove,
} from "../utils/game";

const BOT_DEPTH = 6;
const BOT_MOVE_DELAY_MS = 450;
const DEFAULT_PLAYER_COLOR = "w";
const SAVED_GAME_STORAGE_KEY = "chess-coach.saved-game";

function readSavedGameData() {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = window.localStorage.getItem(SAVED_GAME_STORAGE_KEY);

  if (!saved) {
    return null;
  }

  return JSON.parse(saved);
}

function getSavedGameMeta() {
  try {
    const savedGame = readSavedGameData();

    return {
      hasSavedGame: Boolean(savedGame),
      lastSavedAt: savedGame?.savedAt ?? null,
    };
  } catch {
    return {
      hasSavedGame: false,
      lastSavedAt: null,
    };
  }
}

export function useChessGame() {
  const chessRef = useRef(new Chess());
  const botEngineRef = useRef(null);
  const gameTokenRef = useRef(0);
  const [playerColor, setPlayerColor] = useState(DEFAULT_PLAYER_COLOR);
  const [gameId, setGameId] = useState(0);
  const [game, setGame] = useState(() =>
    snapshotGame(chessRef.current, DEFAULT_PLAYER_COLOR)
  );
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [error, setError] = useState("");
  const [savedGameMeta, setSavedGameMeta] = useState(() => getSavedGameMeta());

  const syncGame = useCallback((nextPlayerColor) => {
    setGame(snapshotGame(chessRef.current, nextPlayerColor));
  }, []);

  const startNewGame = useCallback(
    (nextPlayerColor = DEFAULT_PLAYER_COLOR) => {
      gameTokenRef.current += 1;
      chessRef.current = new Chess();
      setPlayerColor(nextPlayerColor);
      setGameId((currentGameId) => currentGameId + 1);
      setIsBotThinking(false);
      setError("");
      syncGame(nextPlayerColor);
    },
    [syncGame]
  );

  const saveGame = useCallback(() => {
    try {
      if (typeof window === "undefined") {
        throw new Error("Local storage is unavailable in this environment.");
      }

      const savedGame = createSavedGameData(chessRef.current, playerColor);
      window.localStorage.setItem(
        SAVED_GAME_STORAGE_KEY,
        JSON.stringify(savedGame)
      );

      setSavedGameMeta({
        hasSavedGame: true,
        lastSavedAt: savedGame.savedAt,
      });
      setError("");
      return true;
    } catch (e) {
      setError("Saving game failed: " + e.message);
      return false;
    }
  }, [playerColor]);

  const loadSavedGame = useCallback(() => {
    try {
      const savedGame = readSavedGameData();

      if (!savedGame) {
        throw new Error("No saved game found.");
      }

      const restoredGame = restoreSavedGameData(savedGame);

      gameTokenRef.current += 1;
      chessRef.current = restoredGame.chess;
      setPlayerColor(restoredGame.playerColor);
      setGameId((currentGameId) => currentGameId + 1);
      setIsBotThinking(false);
      setSavedGameMeta({
        hasSavedGame: true,
        lastSavedAt: restoredGame.savedAt,
      });
      setError("");
      syncGame(restoredGame.playerColor);
      return true;
    } catch (e) {
      setError("Loading saved game failed: " + e.message);
      return false;
    }
  }, [syncGame]);

  const handlePieceDrop = useCallback(
    (sourceSquare, targetSquare) => {
      if (!targetSquare || isBotThinking || chessRef.current.isGameOver()) {
        return false;
      }

      if (chessRef.current.turn() !== playerColor) {
        return false;
      }

      const move = applyPlayerMove(chessRef.current, sourceSquare, targetSquare);

      if (!move) {
        return false;
      }

      setError("");
      syncGame(playerColor);
      return true;
    },
    [isBotThinking, playerColor, syncGame]
  );

  useEffect(() => {
    if (!shouldBotMove(chessRef.current, playerColor, false)) {
      return;
    }

    const gameToken = gameTokenRef.current;
    const fenBeforeMove = chessRef.current.fen();
    let cancelled = false;
    let timeoutId = null;

    setIsBotThinking(true);

    const runBotMove = async () => {
      try {
        if (!botEngineRef.current) {
          botEngineRef.current = new StockfishEngine({ multiPv: 1 });
          await botEngineRef.current.init();
        }

        const bestMove = await botEngineRef.current.getBestMove(
          fenBeforeMove,
          BOT_DEPTH
        );

        if (
          cancelled ||
          gameToken !== gameTokenRef.current ||
          chessRef.current.fen() !== fenBeforeMove
        ) {
          return;
        }

        const move = applyUciMove(chessRef.current, bestMove);

        if (!move) {
          throw new Error("Engine returned an invalid move.");
        }

        setError("");
        syncGame(playerColor);
      } catch (e) {
        if (!cancelled) {
          setError("Computer move failed: " + e.message);
        }
      } finally {
        if (!cancelled && gameToken === gameTokenRef.current) {
          setIsBotThinking(false);
        }
      }
    };

    timeoutId = window.setTimeout(runBotMove, BOT_MOVE_DELAY_MS);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [game.fen, gameId, playerColor, syncGame]);

  useEffect(() => {
    return () => {
      if (botEngineRef.current) {
        botEngineRef.current.destroy();
      }
    };
  }, []);

  return {
    ...game,
    playerColor,
    isBotThinking,
    error,
    hasSavedGame: savedGameMeta.hasSavedGame,
    lastSavedAt: savedGameMeta.lastSavedAt,
    startNewGame,
    saveGame,
    loadSavedGame,
    handlePieceDrop,
  };
}
