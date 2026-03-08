import { useState, useRef } from "react";
import InputBar from "./components/InputBar";
import Board from "./components/Board";
import EvalBar from "./components/EvalBar";
import CoachPanel from "./components/CoachPanel";
import { StockfishEngine } from "./engine/stockfish";
import { getCoachingHint } from "./services/claude";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function App() {
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Chess Coach</h1>

        <InputBar 
          onAnalyze={handleAnalyze} 
          onFenChange={(f) => setFen(f ?? STARTING_FEN)}
          disabled={isAnalyzing} 
        />

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-6 items-start">
          <div className="flex gap-2 items-start flex-shrink-0">
            <EvalBar
              evaluation={analysis?.evaluation}
              mate={analysis?.mate}
              height={400}
            />
            <Board fen={fen} width={400} />
          </div>
          <CoachPanel
            analysis={analysis}
            coachHint={coachHint}
            isAnalyzing={isAnalyzing}
            isLoadingHint={isLoadingHint}
          />
        </div>
      </div>
    </div>
  );
}
