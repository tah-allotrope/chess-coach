import { Chessboard } from "react-chessboard";

export default function Board({ fen, width = 400 }) {
  return (
    <div style={{ width: width, height: width }}>
      <Chessboard
        options={{
          position: fen,
          allowDragging: false,
          boardStyle: { width: "100%" },
          darkSquareStyle: { backgroundColor: "#779952" },
          lightSquareStyle: { backgroundColor: "#edeed1" }
        }}
      />
    </div>
  );
}
