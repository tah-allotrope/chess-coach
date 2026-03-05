import { useState } from "react";
import { isValidFen } from "../utils/chess";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function InputBar({ onAnalyze, disabled }) {
  const [fen, setFen] = useState(STARTING_FEN);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = fen.trim();
    if (!isValidFen(trimmed)) {
      setError("Invalid FEN string");
      return;
    }
    setError("");
    onAnalyze(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-start">
      <div className="flex-1">
        <input
          type="text"
          value={fen}
          onChange={(e) => { setFen(e.target.value); setError(""); }}
          placeholder="Paste FEN string..."
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 font-mono text-sm focus:outline-none focus:border-blue-500"
          disabled={disabled}
        />
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
      >
        {disabled ? "Analyzing..." : "Analyze"}
      </button>
    </form>
  );
}
