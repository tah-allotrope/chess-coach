import { evalToPercent, evalToText } from "../utils/chess";

export default function EvalBar({ evaluation, mate, height = 560 }) {
  const whitePercent = evalToPercent(evaluation ?? 0);

  return (
    <div
      className="relative w-8 rounded overflow-hidden border border-gray-700 flex-shrink-0"
      style={{ height }}
    >
      {/* Black portion (top) */}
      <div
        className="absolute top-0 left-0 w-full bg-gray-800 transition-all duration-500"
        style={{ height: `${100 - whitePercent}%` }}
      />
      {/* White portion (bottom) */}
      <div
        className="absolute bottom-0 left-0 w-full bg-gray-100 transition-all duration-500"
        style={{ height: `${whitePercent}%` }}
      />
      {/* Eval text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-xs font-bold writing-mode-vertical ${
            whitePercent > 50 ? "text-gray-800" : "text-gray-100"
          }`}
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          {evalToText(evaluation ?? 0, mate)}
        </span>
      </div>
    </div>
  );
}
