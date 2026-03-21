import { colorToLabel } from "../utils/game";

function Chip({ children, tone = "default" }) {
  const tones = {
    default: "border-slate-700 bg-slate-950/70 text-slate-300",
    accent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  };

  return (
    <span className={`rounded-full border px-3 py-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default function GameControls({
  playerColor,
  turn,
  status,
  lastMove,
  isBotThinking,
  isAnalyzing,
  onStartNewGame,
  onAnalyze,
}) {
  const analyzeLabel = isAnalyzing
    ? "Analyzing..."
    : status.isGameOver
      ? "Analyze Final Position"
      : "Analyze Current Position";

  return (
    <div className="rounded-[28px] border border-slate-800 bg-slate-900/75 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onStartNewGame("w")}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                playerColor === "w"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                  : "border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500 hover:bg-slate-800"
              }`}
            >
              New Game as White
            </button>
            <button
              type="button"
              onClick={() => onStartNewGame("b")}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                playerColor === "b"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                  : "border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500 hover:bg-slate-800"
              }`}
            >
              New Game as Black
            </button>
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing || isBotThinking}
              className="rounded-full border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
            >
              {analyzeLabel}
            </button>
          </div>
          <p className="text-sm text-slate-400">
            Play directly on the board, let the local engine reply, and analyze only when you want feedback.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Chip tone="accent">You: {colorToLabel(playerColor)}</Chip>
          <Chip>Turn: {colorToLabel(turn)}</Chip>
          {lastMove && <Chip>Last move: {lastMove}</Chip>}
          <Chip tone={isBotThinking ? "warning" : "default"}>
            {isBotThinking ? "Computer is thinking" : status.message}
          </Chip>
        </div>
      </div>
    </div>
  );
}
