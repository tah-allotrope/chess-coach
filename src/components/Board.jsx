import { Chessboard } from "react-chessboard";

export default function Board({ fen, width = 400 }) {
  return (
    <div style={{ width: width, height: width }}>
      <Chessboard
        position={fen}
        arePiecesDraggable={false}
        boardWidth={width}
        customDarkSquareStyle={{ backgroundColor: "#779952" }}
        customLightSquareStyle={{ backgroundColor: "#edeed1" }}
      />
    </div>
  );
}
