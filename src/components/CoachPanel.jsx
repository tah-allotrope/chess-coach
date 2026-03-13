import { evalToText, formatPv } from "../utils/chess";

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-gray-400">
      <div className="w-4 h-4 border-2 border-gray-500 border-t-blue-400 rounded-full animate-spin" />
      <span className="text-sm">Thinking...</span>
    </div>
  );
}

export default function CoachPanel({
  analysis,
  coachHint,
  isAnalyzing,
  isLoadingHint,
  fen,
}) {
  const sideToMove = fen?.split(" ")[1] === "w" ? "White" : "Black";

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-[300px] max-h-[400px] overflow-y-auto">
      {/* Engine Analysis */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Engine Analysis
        </h2>
        <div className="text-xs text-gray-500 mb-3">{sideToMove} to move</div>
        {isAnalyzing ? (
          <Spinner />
        ) : analysis ? (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-400">Eval: </span>
                <span className="text-white font-mono font-bold">
                  {evalToText(analysis.evaluation, analysis.mate)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Best: </span>
                <span className="text-green-400 font-mono font-bold">
                  {analysis.bestMove}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              {analysis.lines.map((line, i) => (
                <div key={i} className="text-sm font-mono">
                  <span className="text-gray-500 mr-2">{i + 1}.</span>
                  <span className="text-yellow-300 mr-2">
                    ({evalToText(line.score, line.mate)})
                  </span>
                  <span className="text-gray-300">{formatPv(line.pv)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Enter a FEN and click Analyze to see engine evaluation.
          </p>
        )}
      </div>

      {/* Coach Hint */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Coach's Hint
        </h2>
        {isLoadingHint ? (
          <Spinner />
        ) : coachHint ? (
          <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {coachHint}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Coach's hint will appear after analysis.
          </p>
        )}
      </div>
    </div>
  );
}
