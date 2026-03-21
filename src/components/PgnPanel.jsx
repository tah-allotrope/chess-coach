export default function PgnPanel({ pgn, moveCount }) {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            Live PGN
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Moves update as soon as either side plays.
          </p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
          {moveCount} ply
        </span>
      </div>

      <div className="mt-4 max-h-[220px] overflow-y-auto rounded-[20px] border border-slate-800 bg-slate-950/70 px-4 py-3 font-mono text-sm leading-7 text-slate-200 whitespace-pre-wrap">
        {pgn || "Make the first move to start building the PGN."}
      </div>
    </div>
  );
}
