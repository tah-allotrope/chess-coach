export function colorToLabel(color) {
  return color === "b" ? "Black" : "White";
}

export function opponentColor(color) {
  return color === "b" ? "w" : "b";
}

export function getBoardOrientation(playerColor) {
  return playerColor === "b" ? "black" : "white";
}

export function formatMoveList(chess) {
  const moves = chess.history();

  if (moves.length === 0) {
    return "";
  }

  const formatted = [];

  for (let index = 0; index < moves.length; index += 2) {
    const moveNumber = index / 2 + 1;
    const whiteMove = moves[index];
    const blackMove = moves[index + 1];

    formatted.push(
      blackMove
        ? `${moveNumber}. ${whiteMove} ${blackMove}`
        : `${moveNumber}. ${whiteMove}`
    );
  }

  return formatted.join(" ");
}

export function applyPlayerMove(chess, sourceSquare, targetSquare) {
  try {
    return chess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });
  } catch {
    return null;
  }
}

export function applyUciMove(chess, uciMove) {
  if (!uciMove || uciMove.length < 4 || uciMove === "(none)") {
    return null;
  }

  try {
    const move = {
      from: uciMove.slice(0, 2),
      to: uciMove.slice(2, 4),
    };

    if (uciMove.length > 4) {
      move.promotion = uciMove[4];
    }

    return chess.move(move);
  } catch {
    return null;
  }
}

export function shouldBotMove(chess, playerColor, isBotThinking) {
  if (isBotThinking || chess.isGameOver()) {
    return false;
  }

  return chess.turn() !== playerColor;
}

export function getGameStatus(chess) {
  if (chess.isCheckmate()) {
    const winner = opponentColor(chess.turn());

    return {
      isGameOver: true,
      inCheck: true,
      outcome: "checkmate",
      winner,
      result: winner === "w" ? "1-0" : "0-1",
      message: `${colorToLabel(winner)} wins by checkmate`,
    };
  }

  if (chess.isStalemate()) {
    return {
      isGameOver: true,
      inCheck: false,
      outcome: "stalemate",
      winner: null,
      result: "1/2-1/2",
      message: "Draw by stalemate",
    };
  }

  if (chess.isInsufficientMaterial()) {
    return {
      isGameOver: true,
      inCheck: false,
      outcome: "insufficient-material",
      winner: null,
      result: "1/2-1/2",
      message: "Draw by insufficient material",
    };
  }

  if (chess.isThreefoldRepetition()) {
    return {
      isGameOver: true,
      inCheck: false,
      outcome: "threefold-repetition",
      winner: null,
      result: "1/2-1/2",
      message: "Draw by repetition",
    };
  }

  if (chess.isDrawByFiftyMoves()) {
    return {
      isGameOver: true,
      inCheck: false,
      outcome: "fifty-move-rule",
      winner: null,
      result: "1/2-1/2",
      message: "Draw by fifty-move rule",
    };
  }

  if (chess.isDraw()) {
    return {
      isGameOver: true,
      inCheck: false,
      outcome: "draw",
      winner: null,
      result: "1/2-1/2",
      message: "Draw",
    };
  }

  const turn = chess.turn();
  const inCheck = chess.isCheck();

  return {
    isGameOver: false,
    inCheck,
    outcome: null,
    winner: null,
    result: null,
    message: inCheck
      ? `${colorToLabel(turn)} to move - in check`
      : `${colorToLabel(turn)} to move`,
  };
}

export function snapshotGame(chess, playerColor) {
  const history = chess.history({ verbose: true });
  const lastMove = history[history.length - 1] ?? null;

  return {
    fen: chess.fen(),
    pgn: formatMoveList(chess),
    moveCount: history.length,
    turn: chess.turn(),
    playerColor,
    boardOrientation: getBoardOrientation(playerColor),
    lastMove: lastMove?.san ?? null,
    lastMoveSquares: lastMove
      ? { from: lastMove.from, to: lastMove.to }
      : null,
    status: getGameStatus(chess),
  };
}
