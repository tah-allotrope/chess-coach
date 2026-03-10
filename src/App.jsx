import InputBar from "./components/InputBar";
import Board from "./components/Board";
import EvalBar from "./components/EvalBar";
import CoachPanel from "./components/CoachPanel";
import { useChessAnalysis } from "./hooks/useChessAnalysis";

export default function App() {
  const {
    fen,
    analysis,
    coachHint,
    isAnalyzing,
    isLoadingHint,
    error,
    handleAnalyze,
    resetFen,
  } = useChessAnalysis();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Chess Coach</h1>

        <InputBar 
          onAnalyze={handleAnalyze} 
          onFenChange={resetFen}
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
