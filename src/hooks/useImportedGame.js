import { useCallback, useState } from "react";
import { parseImportedGame } from "../utils/game";

const DEFAULT_PLAYER_COLOR = "w";

function createEmptyImportedState(playerColor = DEFAULT_PLAYER_COLOR) {
  return {
    fen: null,
    pgn: "",
    moveCount: 0,
    turn: playerColor,
    playerColor,
    boardOrientation: playerColor === "b" ? "black" : "white",
    lastMove: null,
    lastMoveSquares: null,
    status: null,
  };
}

export function useImportedGame() {
  const [playerColor, setPlayerColor] = useState(DEFAULT_PLAYER_COLOR);
  const [game, setGame] = useState(() => createEmptyImportedState());
  const [error, setError] = useState("");

  const handlePlayerColorChange = useCallback((nextColor) => {
    const normalizedColor = nextColor === "b" ? "b" : "w";

    setPlayerColor(normalizedColor);
    setGame((currentGame) => ({
      ...currentGame,
      playerColor: normalizedColor,
      boardOrientation: normalizedColor === "b" ? "black" : "white",
    }));
  }, []);

  const loadImportedGame = useCallback(
    (input) => {
      try {
        const imported = parseImportedGame(input, playerColor);
        setGame(imported);
        setError("");
        return true;
      } catch (e) {
        setError(e.message);
        return false;
      }
    },
    [playerColor]
  );

  const clearImportedGame = useCallback(() => {
    setGame(createEmptyImportedState(playerColor));
    setError("");
  }, [playerColor]);

  return {
    ...game,
    playerColor,
    error,
    hasLoadedGame: Boolean(game.fen),
    loadImportedGame,
    clearImportedGame,
    setPlayerColor: handlePlayerColorChange,
  };
}
