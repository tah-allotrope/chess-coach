import { useEffect } from "react";
import Board from "./components/Board";
import EvalBar from "./components/EvalBar";
import CoachPanel from "./components/CoachPanel";
import GameControls from "./components/GameControls";
import PgnPanel from "./components/PgnPanel";
import { useChessAnalysis } from "./hooks/useChessAnalysis";
import { useChessGame } from "./hooks/useChessGame";

export default function App() {
  const game = useChessGame();
  const {
    analysis,
    coachHint,
    isAnalyzing,
    isLoadingHint,
    error: analysisError,
    handleAnalyze,
    resetAnalysis,
  } = useChessAnalysis();

  useEffect(() => {
    resetAnalysis();
  }, [game.fen, resetAnalysis]);

  const handleStartNewGame = (color) => {
    resetAnalysis();
    game.startNewGame(color);
  };

  const handleAnalyzeCurrentPosition = () => {
    handleAnalyze(game.fen, game.playerColor);
  };

  return (
    <div className="min-h-screen bg-[#0b1118] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-300/75">
            Chess Coach
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Play inside the app. Analyze only when you want to.
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
              The board is live, the computer opponent runs locally, and the PGN stays visible while you play.
            </p>
          </div>
        </div>

        <GameControls
          playerColor={game.playerColor}
          turn={game.turn}
          status={game.status}
          lastMove={game.lastMove}
          isBotThinking={game.isBotThinking}
          isAnalyzing={isAnalyzing}
          onStartNewGame={handleStartNewGame}
          onAnalyze={handleAnalyzeCurrentPosition}
        />

        {(game.error || analysisError) && (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {game.error || analysisError}
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
                fen={game.fen}
                boardOrientation={game.boardOrientation}
                allowDragging={
                  !game.isBotThinking &&
                  !game.status.isGameOver &&
                  game.turn === game.playerColor
                }
                onPieceDrop={game.handlePieceDrop}
                playerColor={game.playerColor}
                lastMoveSquares={game.lastMoveSquares}
              />
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Drag your own pieces on your turn. The analyze button always reads the current board.
            </p>
          </div>

          <div className="grid gap-4">
            <PgnPanel pgn={game.pgn} moveCount={game.moveCount} />
            <CoachPanel
              analysis={analysis}
              coachHint={coachHint}
              isAnalyzing={isAnalyzing}
              isLoadingHint={isLoadingHint}
              fen={game.fen}
              playerColor={game.playerColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
