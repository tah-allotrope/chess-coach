import { Chessboard } from "react-chessboard";

export default function Board({
  fen,
  className = "",
  boardOrientation = "white",
  allowDragging = false,
  onPieceDrop,
  playerColor = "w",
  lastMoveSquares = null,
}) {
  const squareStyles = {};

  if (lastMoveSquares?.from) {
    squareStyles[lastMoveSquares.from] = {
      backgroundColor: "rgba(251, 191, 36, 0.35)",
    };
  }

  if (lastMoveSquares?.to) {
    squareStyles[lastMoveSquares.to] = {
      backgroundColor: "rgba(251, 191, 36, 0.45)",
    };
  }

  return (
    <div className={`aspect-square w-full ${className}`.trim()}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation,
          allowDragging,
          canDragPiece: ({ piece }) =>
            allowDragging && piece.pieceType.startsWith(playerColor),
          onPieceDrop: ({ sourceSquare, targetSquare }) =>
            onPieceDrop?.(sourceSquare, targetSquare) ?? false,
          boardStyle: { width: "100%", borderRadius: "1.25rem" },
          darkSquareStyle: { backgroundColor: "#779952" },
          lightSquareStyle: { backgroundColor: "#edeed1" },
          dropSquareStyle: {
            boxShadow: "inset 0 0 0 4px rgba(52, 211, 153, 0.55)",
          },
          squareStyles,
        }}
      />
    </div>
  );
}
