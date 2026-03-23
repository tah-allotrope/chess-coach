import { useEffect, useMemo, useState } from "react";
import Board from "./components/Board";
import EvalBar from "./components/EvalBar";
import CoachPanel from "./components/CoachPanel";
import GameControls from "./components/GameControls";
import PgnPanel from "./components/PgnPanel";
import { useChessAnalysis } from "./hooks/useChessAnalysis";
import { useChessGame } from "./hooks/useChessGame";
import { useImportedGame } from "./hooks/useImportedGame";
import { colorToLabel } from "./utils/game";

const MODES = {
  play: "play",
  coach: "coach",
};

function ModeTab({ isActive, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
          : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function ImportControls({
  draftPgn,
  onDraftChange,
  playerColor,
  onPlayerColorChange,
  onLoad,
  onClear,
  hasLoadedGame,
  isAnalyzing,
  onAnalyze,
}) {
  return (
    <div className="rounded-[28px] border border-slate-800 bg-slate-900/75 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onPlayerColorChange("w")}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              playerColor === "w"
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                : "border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500 hover:bg-slate-800"
            }`}
          >
            Coach Me as White
          </button>
          <button
            type="button"
            onClick={() => onPlayerColorChange("b")}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              playerColor === "b"
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                : "border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500 hover:bg-slate-800"
            }`}
          >
            Coach Me as Black
          </button>
          <button
            type="button"
            onClick={onLoad}
            className="rounded-full border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/25"
          >
            Load PGN
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!hasLoadedGame || isAnalyzing}
            className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Imported Position"}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800"
          >
            Clear
          </button>
        </div>

        <div>
          <label
            htmlFor="lichess-pgn"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Paste PGN from lichess
          </label>
          <textarea
            id="lichess-pgn"
            value={draftPgn}
            onChange={(event) => onDraftChange(event.target.value)}
            spellCheck={false}
            placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"
            className="min-h-36 w-full rounded-[20px] border border-slate-800 bg-slate-950/70 px-4 py-3 font-mono text-sm leading-6 text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-emerald-400/40"
          />
        </div>

        <p className="text-sm text-slate-400">
          Use this mode when you want to play elsewhere and bring the current PGN here for engine and coach feedback.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState(MODES.play);
  const [draftPgn, setDraftPgn] = useState("");
  const game = useChessGame();
  const importedGame = useImportedGame();
  const {
    analysis,
    coachHint,
    isAnalyzing,
    isLoadingHint,
    error: analysisError,
    handleAnalyze,
    resetAnalysis,
  } = useChessAnalysis();

  const currentGame = useMemo(
    () => (mode === MODES.play ? game : importedGame),
    [game, importedGame, mode]
  );

  useEffect(() => {
    resetAnalysis();
  }, [currentGame.fen, currentGame.playerColor, mode, resetAnalysis]);

  const handleStartNewGame = (color) => {
    resetAnalysis();
    game.startNewGame(color);
  };

  const handleAnalyzeCurrentPosition = () => {
    if (!currentGame.fen) {
      return;
    }

    handleAnalyze(currentGame.fen, currentGame.playerColor);
  };

  const handleLoadImportedGame = () => {
    if (importedGame.loadImportedGame(draftPgn)) {
      resetAnalysis();
    }
  };

  const handleClearImportedGame = () => {
    resetAnalysis();
    setDraftPgn("");
    importedGame.clearImportedGame();
  };

  const heroCopy =
    mode === MODES.play
      ? {
          title: "Play inside the app. Analyze only when you want to.",
          body: "The board is live, the computer opponent runs locally, and the PGN stays visible while you play.",
        }
      : {
          title: "Bring in your lichess PGN and use the app as a coach.",
          body: "Paste the game score, load the current position, and get engine plus coaching feedback without using the local bot board.",
        };

  const combinedError = currentGame.error || analysisError;
  const boardCaption =
    mode === MODES.play
      ? "Drag your own pieces on your turn. The analyze button always reads the current board."
      : currentGame.fen
        ? `Imported board loaded. Coaching is framed for ${colorToLabel(
            currentGame.playerColor
          )}.`
        : "Load a PGN to render the imported position and analyze it here.";

  return (
    <div className="min-h-screen bg-[#0b1118] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-300/75">
            Chess Coach
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {heroCopy.title}
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
                {heroCopy.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ModeTab
                isActive={mode === MODES.play}
                onClick={() => setMode(MODES.play)}
              >
                Play Mode
              </ModeTab>
              <ModeTab
                isActive={mode === MODES.coach}
                onClick={() => setMode(MODES.coach)}
              >
                Lichess Coach Mode
              </ModeTab>
            </div>
          </div>
        </div>

        {mode === MODES.play ? (
          <GameControls
            playerColor={game.playerColor}
            turn={game.turn}
            status={game.status}
            lastMove={game.lastMove}
            isBotThinking={game.isBotThinking}
            isAnalyzing={isAnalyzing}
            hasSavedGame={game.hasSavedGame}
            lastSavedAt={game.lastSavedAt}
            onStartNewGame={handleStartNewGame}
            onAnalyze={handleAnalyzeCurrentPosition}
            onSaveGame={game.saveGame}
            onLoadSavedGame={() => {
              if (game.loadSavedGame()) {
                resetAnalysis();
              }
            }}
          />
        ) : (
          <ImportControls
            draftPgn={draftPgn}
            onDraftChange={setDraftPgn}
            playerColor={importedGame.playerColor}
            onPlayerColorChange={importedGame.setPlayerColor}
            onLoad={handleLoadImportedGame}
            onClear={handleClearImportedGame}
            hasLoadedGame={importedGame.hasLoadedGame}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyzeCurrentPosition}
          />
        )}

        {combinedError && (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {combinedError}
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)] xl:items-start">
          <div className="rounded-[28px] border border-slate-800 bg-slate-900/75 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
            <div className="mx-auto grid w-full max-w-[520px] grid-cols-[2.5rem_minmax(0,1fr)] gap-3 items-stretch">
              <EvalBar
                evaluation={analysis?.evaluation}
                mate={analysis?.mate}
              />
              <Board
                fen={currentGame.fen ?? undefined}
                boardOrientation={currentGame.boardOrientation}
                allowDragging={
                  mode === MODES.play &&
                  !game.isBotThinking &&
                  !game.status.isGameOver &&
                  game.turn === game.playerColor
                }
                onPieceDrop={mode === MODES.play ? game.handlePieceDrop : undefined}
                playerColor={currentGame.playerColor}
                lastMoveSquares={currentGame.lastMoveSquares}
              />
            </div>
            <p className="mt-4 text-sm text-slate-500">{boardCaption}</p>
          </div>

          <div className="grid gap-4">
            <PgnPanel
              title={mode === MODES.play ? "Live PGN" : "Imported PGN"}
              description={
                mode === MODES.play
                  ? "Moves update as soon as either side plays."
                  : "Load a lichess PGN to inspect the current position and ask for coaching."
              }
              emptyMessage={
                mode === MODES.play
                  ? "Make the first move to start building the PGN."
                  : "Paste a lichess PGN above, then click Load PGN."
              }
              pgn={currentGame.pgn}
              moveCount={currentGame.moveCount}
            />
            <CoachPanel
              analysis={analysis}
              coachHint={coachHint}
              isAnalyzing={isAnalyzing}
              isLoadingHint={isLoadingHint}
              fen={currentGame.fen}
              playerColor={currentGame.playerColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
