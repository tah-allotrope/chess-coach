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

## Outstanding

- Manual browser verification is still worth doing for the live drag-and-drop flow, especially:
  - starting as White
  - starting as Black and waiting for the bot's first move
  - confirming the PGN updates after each move
  - confirming `Analyze` runs on the current position only
- `src/components/InputBar.jsx` appears to be leftover from the old workflow and is currently unused.
- No commit has been created yet.
- No difficulty selector, takeback flow, clocks, or persistence has been added.

## Working Notes

- The bot uses a separate Stockfish worker instance from the analysis flow to avoid command collisions.
- Analysis is reset whenever the board position changes so stale engine output is not shown for a new position.
- Engine displays remain White-perspective, while coaching is phrased for the chosen player color.
