import { useState, useRef } from "react";
import { StockfishEngine } from "../engine/stockfish";
import { getCoachingHint } from "../services/claude";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function useChessAnalysis() {
  const [fen, setFen] = useState(STARTING_FEN);
  const [analysis, setAnalysis] = useState(null);
  const [coachHint, setCoachHint] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [error, setError] = useState("");
  const engineRef = useRef(null);

  const handleAnalyze = async (newFen) => {
    setFen(newFen);
    setAnalysis(null);
    setCoachHint("");
    setError("");
    setIsAnalyzing(true);
    setIsLoadingHint(false);

    try {
      // Init engine if needed
      if (!engineRef.current) {
        engineRef.current = new StockfishEngine();
        await engineRef.current.init();
      }

      const result = await engineRef.current.analyze(newFen, 20);
      setAnalysis(result);
      setIsAnalyzing(false);

      // Now get coaching hint
      setIsLoadingHint(true);
      try {
        const hint = await getCoachingHint(newFen, result);
        setCoachHint(hint);
      } catch (e) {
        setError("Coach hint failed: " + e.message);
      }
      setIsLoadingHint(false);
    } catch (e) {
      setError("Analysis failed: " + e.message);
      setIsAnalyzing(false);
      setIsLoadingHint(false);
    }
  };

  const resetFen = (newFen) => {
    setFen(newFen ?? STARTING_FEN);
  };

  return {
    fen,
    analysis,
    coachHint,
    isAnalyzing,
    isLoadingHint,
    error,
    handleAnalyze,
    resetFen,
    STARTING_FEN,
  };
}
