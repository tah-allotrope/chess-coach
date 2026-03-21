import { evalToText, formatPv } from "../utils/chess";
import { colorToLabel } from "../utils/game";

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <div className="w-4 h-4 border-2 border-slate-500 border-t-emerald-400 rounded-full animate-spin" />
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
  playerColor,
}) {
  const sideToMove = colorToLabel(fen?.split(" ")[1]);
  const playerLabel = colorToLabel(playerColor);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
        <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1">
            You: {playerLabel}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1">
            {sideToMove} to move
          </span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-slate-500">
          Engine scores stay in White&apos;s perspective. Coach hints are phrased for your side.
        </p>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Engine Analysis
        </h2>
        {isAnalyzing ? (
          <Spinner />
        ) : analysis ? (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-slate-400">Eval: </span>
                <span className="text-white font-mono font-bold">
                  {evalToText(analysis.evaluation, analysis.mate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Best: </span>
                <span className="text-emerald-300 font-mono font-bold">
                  {analysis.bestMove}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              {analysis.lines.map((line, i) => (
                <div key={i} className="text-sm font-mono">
                  <span className="text-slate-500 mr-2">{i + 1}.</span>
                  <span className="text-amber-300 mr-2">
                    ({evalToText(line.score, line.mate)})
                  </span>
                  <span className="text-slate-300">{formatPv(line.pv)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            Click Analyze to evaluate the current board position.
          </p>
        )}
      </div>

      <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Coach's Hint
        </h2>
        {isLoadingHint ? (
          <Spinner />
        ) : coachHint ? (
          <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {coachHint}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            Analyze the current position to get a coaching hint.
          </p>
        )}
      </div>
    </div>
  );
}
