import { evalToPercent, evalToText } from "../utils/chess";

export default function EvalBar({ evaluation, mate, height = null }) {
  const hasAnalysis = evaluation !== null && evaluation !== undefined;
  const hasMate = mate !== null && mate !== undefined;
  const whitePercent = hasAnalysis ? evalToPercent(evaluation) : 50;
  const label = hasAnalysis || hasMate ? evalToText(evaluation ?? 0, mate) : "--";

  return (
    <div
      className="relative h-full min-h-0 w-10 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 flex-shrink-0"
      style={height ? { height } : undefined}
    >
      <div
        className="absolute top-0 left-0 w-full bg-slate-800 transition-all duration-500"
        style={{ height: `${100 - whitePercent}%` }}
      />
      <div
        className="absolute bottom-0 left-0 w-full bg-slate-100 transition-all duration-500"
        style={{ height: `${whitePercent}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-xs font-bold writing-mode-vertical ${
            whitePercent > 50 ? "text-slate-900" : "text-slate-100"
          }`}
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
