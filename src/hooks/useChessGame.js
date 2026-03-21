import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { StockfishEngine } from "../engine/stockfish";
import {
  applyPlayerMove,
  applyUciMove,
  snapshotGame,
  shouldBotMove,
} from "../utils/game";

const BOT_DEPTH = 6;
const BOT_MOVE_DELAY_MS = 450;
const DEFAULT_PLAYER_COLOR = "w";

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
    startNewGame,
    handlePieceDrop,
  };
}
