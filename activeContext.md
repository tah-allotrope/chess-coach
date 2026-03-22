# Active Context

## Current Branch

- `feature/in-app-play-mode`

## Progress

- Recorded the feature plan in `plans/FEATURE-1-in-app-play-with-pgn.md`.
- Replaced the old paste-first workflow with a live in-app game loop.
- Added `src/hooks/useChessGame.js` to manage the `Chess` instance, player color, board orientation, PGN, game status, last move highlighting, and bot turns.
- Reworked `src/hooks/useChessAnalysis.js` so analysis is on-demand for the current live position instead of controlling the board state.
- Updated `src/services/claude.js` so coaching can be framed from the selected player's perspective.
- Added helper utilities in `src/utils/game.js`.
- Added tests in `src/utils/game.test.js` and extended `src/services/claude.test.js`.
- Updated the UI in `src/App.jsx`, `src/components/Board.jsx`, `src/components/CoachPanel.jsx`, and `src/components/EvalBar.jsx`.
- Added new UI components `src/components/GameControls.jsx` and `src/components/PgnPanel.jsx`.
- Extended `src/engine/stockfish.js` with configurable `MultiPV` and a lightweight `getBestMove()` helper for bot play.
- Verified the implementation with `npm test` and `npm run build`.
- Removed the unused legacy `src/components/InputBar.jsx` component from the old paste-first workflow.
- Re-ran `npm test` and `npm run build` after the cleanup; both still pass.
- Performed browser verification for the live flow, including starting as White, starting as Black, bot first move as Black, live PGN updates, and `Analyze` on the current position.

## Outstanding

- One manual browser check is still worth doing directly in the app: analyze a position, make another legal move, and confirm the prior engine/coaching output clears immediately for the new board state.
- No commit has been created yet.
- No difficulty selector, takeback flow, clocks, or persistence has been added.

## Working Notes

- The bot uses a separate Stockfish worker instance from the analysis flow to avoid command collisions.
- Analysis is reset whenever the board position changes so stale engine output is not shown for a new position.
- Engine displays remain White-perspective, while coaching is phrased for the chosen player color.
- Browser automation confirmed the live move loop and current-position analysis, but the stale-analysis-after-next-move check was not cleanly re-verified through Playwright because later drag interactions became unreliable on the rendered board.
