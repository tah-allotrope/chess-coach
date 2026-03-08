import { useState } from "react";
import { parseInputToFen } from "../utils/chess";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function InputBar({ onAnalyze, onFenChange, disabled }) {
  const [inputValue, setInputValue] = useState(STARTING_FEN);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const resultFen = parseInputToFen(inputValue);
    
    if (!resultFen) {
      setError("Invalid FEN or PGN string");
      return;
    }
    
    setError("");
    onAnalyze(resultFen);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-start">
      <div className="flex-1">
        <textarea
          value={inputValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            setError("");
            
            const resultFen = parseInputToFen(newValue);
            if (resultFen) {
              onFenChange(resultFen);
            } else if (newValue.trim() === "") {
              onFenChange(null);
            }
          }}
          placeholder="Paste FEN or PGN string..."
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 font-mono text-sm focus:outline-none focus:border-blue-500 resize-y min-h-[46px] max-h-32"
          rows={1}
          disabled={disabled}
        />
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors mt-1"
      >
        {disabled ? "Analyzing..." : "Analyze"}
      </button>
    </form>
  );
}
