# Active Context

## Current Branch

- `feature/in-app-play-mode`

## Progress

- Recorded the feature plan in `plans/FEATURE-1-in-app-play-with-pgn.md`.
- Started a follow-up pass for two scoped additions: browser-local save/load for the live game, and a separate coaching-only PGN import mode for lichess play.
- Added a single browser-local resume slot for live play, plus a new lichess coaching mode that loads pasted PGN into a read-only analysis board.
- Added utility coverage for save payload creation/restoration and imported PGN parsing.
- Verified the follow-up work with `npm test` and `npm run build`.
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
- No difficulty selector, takeback flow, clocks, multiple save slots, or move-by-move imported-PGN navigation has been added.

## Current Plan

- Add utility coverage first for browser-local save payloads and imported PGN parsing so the feature lands test-first.
- Extend the live game hook with simple save/load actions backed by `localStorage` for a single resume slot.
- Add a top-level mode switch so the app can toggle between live play mode and a read-only PGN coaching mode.
- Reuse the existing board, PGN, and analysis panels where possible so both modes share the same coaching surface.
- Verify with `npm test` and `npm run build`, then capture any remaining manual browser checks.

## Working Notes

- The bot uses a separate Stockfish worker instance from the analysis flow to avoid command collisions.
- Analysis is reset whenever the board position changes so stale engine output is not shown for a new position.
- Engine displays remain White-perspective, while coaching is phrased for the chosen player color.
- Browser automation confirmed the live move loop and current-position analysis, but the stale-analysis-after-next-move check was not cleanly re-verified through Playwright because later drag interactions became unreliable on the rendered board.
- The simple save feature should restore a single in-progress local game from PGN plus player-color metadata rather than trying to serialize the whole `Chess` instance.
- The lichess companion flow should stay read-only for now: paste PGN, load the current position, and analyze without starting the local bot loop.

## Review / Results

- `src/hooks/useChessGame.js` now persists one local save slot with `localStorage` and can restore the saved PGN into the live board state.
- `src/hooks/useImportedGame.js` owns the coaching-only imported PGN flow so the local bot loop remains isolated to live play mode.
- `src/App.jsx` now offers `Play Mode` and `Lichess Coach Mode`, routing analysis through the active board state in either mode.
- `src/components/GameControls.jsx` exposes `Save Game` and `Load Saved Game`, while `src/components/PgnPanel.jsx` now supports both live and imported PGN copy.
- `src/utils/game.js` and `src/utils/game.test.js` cover saved-game serialization/restoration and imported-PGN parsing.
- Verification: `npm test`, `npm run build`.
