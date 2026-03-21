import { useCallback, useEffect, useRef, useState } from "react";
import { StockfishEngine } from "../engine/stockfish";
import { getCoachingHint } from "../services/claude";

export function useChessAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [coachHint, setCoachHint] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [error, setError] = useState("");
  const engineRef = useRef(null);
  const requestIdRef = useRef(0);

  const resetAnalysis = useCallback(() => {
    requestIdRef.current += 1;
    setAnalysis(null);
    setCoachHint("");
    setError("");
    setIsLoadingHint(false);
    setIsAnalyzing(false);
  }, []);

  const handleAnalyze = useCallback(async (fen, playerColor) => {
    if (!fen) {
      return;
    }

    const requestId = ++requestIdRef.current;

    setAnalysis(null);
    setCoachHint("");
    setError("");
    setIsAnalyzing(true);
    setIsLoadingHint(false);

    try {
      if (!engineRef.current) {
        engineRef.current = new StockfishEngine();
        await engineRef.current.init();
      }

      const result = await engineRef.current.analyze(fen, 20);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setAnalysis(result);
      setIsAnalyzing(false);

      setIsLoadingHint(true);

      try {
        const hint = await getCoachingHint(fen, result, playerColor);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setCoachHint(hint);
      } catch (e) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError("Coach hint failed: " + e.message);
      }

      if (requestId !== requestIdRef.current) {
        return;
      }

      setIsLoadingHint(false);
    } catch (e) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError("Analysis failed: " + e.message);
      setIsAnalyzing(false);
      setIsLoadingHint(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  return {
    analysis,
    coachHint,
    isAnalyzing,
    isLoadingHint,
    error,
    handleAnalyze,
    resetAnalysis,
  };
}
