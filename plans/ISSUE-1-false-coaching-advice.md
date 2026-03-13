# ISSUE-1: False Coaching Advice — Engine Gives Inverted Perspective for Black

## Objective

Fix a critical bug where the coaching hint (Claude AI) gives Black the **opposite** advice — telling Black they are "down 2.6 pawns" when Black is actually **up** 2.6 pawns — because the system never tells Claude which side is to move, and all evaluation scores are normalized to White's perspective without re-normalizing for the player.

---

## Evidence

**Reproduction PGN:**

```
1. e4 e6 2. d4 d5 3. exd5 exd5 4. c4 Be6 5. c5 g6 6. Nc3 Bg7 7. Qb3 Nc6
8. Nf3 Nf6 9. Qb5 O-O 10. Be3 Ne4 11. Bd3 a6 12. Qb3 Nxc3 13. Qxc3 Bg4
14. Be2 Re8 15. O-O-O Rb8 16. Bg5
```

**Resulting FEN:** `1r1qr1k1/1pp2pbp/p1n3p1/2Pp2B1/3P2b1/2Q2N2/PP2BPPP/2KR3R b - - 6 16`

**Side to move:** Black (`b` in the FEN).

**Screenshot:** See `plans/move16-analysis.png` — the app shows Eval: **-2.63**, Best: **d8d7**, and the Coach says: *"You're in a tough spot (down about 2.6 pawns)"*. This is wrong. Black is **winning** by 2.63 pawns. The coach should be telling Black to press their advantage.

---

## Mathematical Formulation / Logic

### Current (buggy) evaluation data flow

1. **Stockfish UCI output**: Reports centipawn score (`cp`) from the **side-to-move's perspective**. When Black is to move, a positive `cp` means Black is better.

2. **`_parseInfo()` in `src/engine/stockfish.js` line 95–97**: Normalizes score to **always be from White's perspective**:
   ```
   if (blackToMove) score = -score
   ```
   So Stockfish's `cp +263` (Black better) becomes `score = -263` (White is losing).

3. **`analysis.evaluation`**: Stored as `-263` (centipawns, White's perspective). This is numerically correct from White's point of view.

4. **`evalToText(cp, mate)` in `src/utils/chess.js` line 32–38**: Formats as `"-2.63"`. This is correct for White's perspective but ambiguous — there is no label saying "from White's perspective."

5. **`getCoachingHint()` in `src/services/claude.js` line 25**: Sends to Claude:
   ```
   Stockfish evaluation: -2.63 pawns
   ```
   **Problem A:** Does NOT tell Claude which side is to move.
   **Problem B:** Does NOT tell Claude the score is from White's perspective.
   **Result:** Claude interprets `-2.63` as "the player is losing by 2.63 pawns" and advises defensively. But the player (Black) is actually **winning** by 2.63 pawns.

6. **Per-line evals in `claude.js` line 19**: Each line eval is also sent as White-perspective centipawns divided by 100. Same inversion problem.

### Correct logic (what should happen)

The coaching hint must serve **the side to move** (the "player"). This requires two changes:

**Change 1 — Tell Claude who is playing:**

The Claude prompt must include the side to move. Derive it from the FEN:

```
sideToMove = fen.split(" ")[1]     // "w" or "b"
sideLabel  = sideToMove === "w" ? "White" : "Black"
```

**Change 2 — Send a player-relative evaluation:**

Convert the White-perspective score to the player's perspective before sending to Claude:

```
playerEval = (sideToMove === "b") ? -whiteEval : whiteEval
```

Where `whiteEval` is `analysis.evaluation` (centipawns, always from White's POV as currently computed).

So for our example:
- `whiteEval = -263` (White is losing)
- `sideToMove = "b"` → `playerEval = -(-263) = +263`
- Claude receives: **"Black to move. Evaluation: +2.63 pawns (from Black's perspective)"**
- Claude correctly advises Black to press their advantage.

**The same inversion applies to each line's score and the mate score:**

```
playerLineScore = (sideToMove === "b") ? -line.score : line.score
playerMate      = (sideToMove === "b") ? -line.mate  : line.mate
```

For mate values: a positive mate-in-N from White's perspective means White is mating. Negating gives a negative value for Black's perspective (i.e., the opponent is mating Black). A negative White-perspective mate means Black is mating — negating gives positive (i.e., Black is mating, good for Black).

### Secondary bug: `evalToText` mate display

In `src/utils/chess.js` line 34:
```js
return mate > 0 ? `M${mate}` : `M${mate}`;
```
Both branches are identical. A negative mate (e.g., `-3`) renders as `M-3`, which is confusing to users. The intended logic should be:
- `mate > 0` → `M${mate}` (e.g., `M3` meaning White mates in 3)
- `mate < 0` → `M${Math.abs(mate)}` with some indication that the opponent is mating

However: since the eval bar and display are always from White's perspective, the sign conveys meaningful information (positive = White mating, negative = Black mating). The display should differentiate, for example:
- `mate > 0` → `+M${mate}` (White delivers mate)
- `mate < 0` → `-M${Math.abs(mate)}` (Black delivers mate)

### Secondary bug: Coach prompt does not provide game context

The Claude prompt only receives the current FEN and Stockfish lines. It has no knowledge of:
- The move history (PGN) leading to this position
- Which side the user is analyzing for
- Whether the evaluation is trending better or worse

For the "getting worse each move" concern, the app only analyzes a single static position. It has no mechanism to compare evaluations across moves. This is a feature gap, not a bug, but it contributes to the user's confusion.

---

## File Changes

### 1. `src/services/claude.js` — MODIFY

**What to change:**
- Modify the `getCoachingHint` function signature to accept a third parameter: `fen` is already passed, but we need to **extract the side to move from it** and use it in the prompt.
- Actually, `fen` is already the first parameter. Extract `sideToMove` from it inside the function.
- **Compute player-relative scores** before building the prompt string.
- **Update the system prompt** to instruct Claude to always address the side-to-move as "you."
- **Update the user message** to include the side to move and use player-perspective evaluation.

**What to leave alone:**
- The Anthropic client instantiation (lines 1–6).
- The model name and max_tokens.
- The try/catch error handling structure.
- The function export and return pattern.

**Specific changes:**

**(a) Inside `getCoachingHint`, after the function opens, add side-to-move extraction:**
```js
const sideToMove = fen.split(" ")[1]; // "w" or "b"
const sideLabel = sideToMove === "w" ? "White" : "Black";
const perspectiveMultiplier = sideToMove === "b" ? -1 : 1;
```

**(b) Compute player-relative evaluation for the top-level score:**
```js
const playerEval = analysis.evaluation * perspectiveMultiplier;
const playerMate = analysis.mate !== null ? analysis.mate * perspectiveMultiplier : null;
```

**(c) Compute player-relative evaluation for each line (in the `linesText` map):**
Replace the current line eval computation:
```js
// CURRENT (buggy): l.score / 100 — this is White's perspective
// NEW: (l.score * perspectiveMultiplier) / 100 — this is the player's perspective
```
And for mate per line:
```js
// CURRENT: l.mate
// NEW: l.mate !== null ? l.mate * perspectiveMultiplier : null
```

**(d) Update the `SYSTEM_PROMPT` constant** to add this sentence at the end:
```
You will be told which color the player is. Always address the player as "you" and frame evaluations from their perspective.
A positive evaluation means the player is better; a negative evaluation means the player is worse.
```

**(e) Update the `userMessage` template** to include side-to-move and use player-relative scores:
```
Position (FEN): ${fen}
Player to move: ${sideLabel}

Evaluation from ${sideLabel}'s perspective: ${playerMate !== null ? `Mate in ${playerMate}` : `${(playerEval / 100).toFixed(2)} pawns`}
(Positive means ${sideLabel} is better, negative means ${sideLabel} is worse)

Best move: ${analysis.bestMove}

Top lines:
${linesText}   <-- each line also uses player-relative scores

What should ${sideLabel} focus on in this position? Give a coaching hint.
```

### 2. `src/utils/chess.js` — MODIFY

**What to change:**
- Fix `evalToText` function (line 32–38) to properly format mate scores with sign indication.

**Specific change to `evalToText`:**
Replace:
```js
if (mate !== null && mate !== undefined) {
    return mate > 0 ? `M${mate}` : `M${mate}`;
}
```
With:
```js
if (mate !== null && mate !== undefined) {
    return mate > 0 ? `+M${mate}` : `-M${Math.abs(mate)}`;
}
```

This ensures:
- White delivering mate in 3: `+M3`
- Black delivering mate in 3: `-M3`

**What to leave alone:**
- `isValidFen`, `parseInputToFen`, `evalToPercent`, `formatPv` — do not modify these.
- The centipawn formatting logic (sign + division by 100) — this is already correct for White-perspective display.

### 3. `src/components/CoachPanel.jsx` — MODIFY

**What to change:**
- Add a visual indicator showing which side is to move, so the user knows the context of the evaluation.
- The `CoachPanel` component does not currently receive the `fen` prop. It must be passed through.

**Specific changes:**

**(a) Add `fen` to the destructured props:**
```js
export default function CoachPanel({
  analysis,
  coachHint,
  isAnalyzing,
  isLoadingHint,
  fen,           // <-- ADD THIS
})
```

**(b) Derive and display the side to move:**
Add above the Engine Analysis section, a small label:
```jsx
{fen && (
  <div className="text-xs text-gray-400 mb-2">
    {fen.split(" ")[1] === "w" ? "White" : "Black"} to move
  </div>
)}
```

**What to leave alone:**
- The Spinner component.
- The overall two-section layout (Engine Analysis + Coach's Hint).
- The line rendering logic (the lines still display White-perspective scores, which is standard for engine analysis panels; only the coaching hint needs player-perspective scores).

### 4. `src/App.jsx` — MODIFY

**What to change:**
- Pass the `fen` prop to `CoachPanel`.

**Specific change:**
```jsx
<CoachPanel
  analysis={analysis}
  coachHint={coachHint}
  isAnalyzing={isAnalyzing}
  isLoadingHint={isLoadingHint}
  fen={fen}           // <-- ADD THIS
/>
```

**What to leave alone:**
- All other component props and the layout structure.

### 5. `src/engine/stockfish.js` — NO CHANGES

The engine's score normalization to White's perspective is correct and standard. The bug is in how the Claude prompt consumes this data, not in how it's produced.

### 6. `src/hooks/useChessAnalysis.js` — NO CHANGES

The hook correctly passes `fen` and `analysis` to `getCoachingHint`. No changes needed.

---

## Function Signatures

### Modified Functions

#### `getCoachingHint(fen, analysis)` — `src/services/claude.js`

```
Parameters:
  fen: string        — Full FEN string of the position (e.g., "1r1qr1k1/1pp2pbp/p1n3p1/2Pp2B1/3P2b1/2Q2N2/PP2BPPP/2KR3R b - - 6 16")
  analysis: object   — Stockfish analysis result with shape:
    {
      bestMove: string,          // UCI move, e.g. "d8d7"
      evaluation: number,        // centipawns from White's perspective, e.g. -263
      mate: number | null,       // mate-in-N from White's perspective, or null
      lines: Array<{
        depth: number,
        multipv: number,
        score: number,           // centipawns from White's perspective
        mate: number | null,     // mate-in-N from White's perspective, or null
        pv: string               // space-separated UCI moves
      }>
    }

Returns: Promise<string> — Natural language coaching hint from Claude, addressed to the side-to-move,
                            with evaluations correctly framed from that side's perspective.
                            Returns a fallback error string on API failure.

Internal logic change:
  - Extracts sideToMove from fen.split(" ")[1]
  - Computes perspectiveMultiplier: 1 if White to move, -1 if Black to move
  - Multiplies all evaluation scores by perspectiveMultiplier before inserting into prompt
  - Includes side-to-move label in the prompt text
```

#### `evalToText(cp, mate)` — `src/utils/chess.js`

```
Parameters:
  cp: number         — Centipawn score from White's perspective (e.g., -263 means Black is ahead)
  mate: number|null  — Mate-in-N from White's perspective (positive = White mates, negative = Black mates), or null/undefined

Returns: string — Human-readable evaluation string.
  - For centipawns: "+0.47" or "-2.63" (sign prefix, divided by 100, 2 decimal places)
  - For mate (White mating): "+M3"
  - For mate (Black mating): "-M3"
  - No change to centipawn branch, only the mate branch is fixed
```

#### `CoachPanel({ analysis, coachHint, isAnalyzing, isLoadingHint, fen })` — `src/components/CoachPanel.jsx`

```
Props:
  analysis: object|null   — Stockfish analysis result (same shape as above), or null before analysis
  coachHint: string       — Claude's coaching hint text, or empty string
  isAnalyzing: boolean    — True while Stockfish is computing
  isLoadingHint: boolean  — True while Claude API call is in flight
  fen: string             — Current FEN string, used to derive and display side-to-move indicator

Returns: JSX element — The coach panel UI with a "White/Black to move" indicator above the engine analysis section.
```

---

## Test Specifications

> **Test infrastructure note:** This project has NO existing tests and NO test runner. The implementer must first install Vitest (the natural choice for a Vite project) and configure it. Add `vitest` as a devDependency, add a `"test"` script to `package.json`, and create a `vitest.config.js` if needed (or Vitest will use `vite.config.js` by default).

### Test File 1: `src/utils/chess.test.js`

**Test: `evalToText` formats centipawn scores correctly**
- Input: `evalToText(47, null)` → Expected: `"+0.47"`
- Input: `evalToText(-263, null)` → Expected: `"-2.63"`
- Input: `evalToText(0, null)` → Expected: `"+0.00"`
- Input: `evalToText(100, null)` → Expected: `"+1.00"`
- Input: `evalToText(-100, null)` → Expected: `"-1.00"`

**Test: `evalToText` formats mate scores with correct sign**
- Input: `evalToText(0, 3)` → Expected: `"+M3"` (White mates in 3)
- Input: `evalToText(0, -3)` → Expected: `"-M3"` (Black mates in 3)
- Input: `evalToText(0, 1)` → Expected: `"+M1"` (White mates in 1)
- Input: `evalToText(0, -1)` → Expected: `"-M1"` (Black mates in 1)

**Test: `evalToText` handles null/undefined mate**
- Input: `evalToText(50, null)` → Expected: `"+0.50"`
- Input: `evalToText(50, undefined)` → Expected: `"+0.50"`

**Test: `evalToPercent` sigmoid mapping**
- Input: `evalToPercent(0)` → Expected: `50` (exactly equal)
- Input: `evalToPercent(500)` → Expected: approximately `86.5` (within ±1)
- Input: `evalToPercent(-500)` → Expected: approximately `13.5` (within ±1)
- Input: `evalToPercent(10000)` → Expected: `98` (clamped max)
- Input: `evalToPercent(-10000)` → Expected: `2` (clamped min)

### Test File 2: `src/services/claude.test.js`

**These tests must mock the Anthropic client.** Use `vi.mock("@anthropic-ai/sdk")` to avoid real API calls.

**Test: Claude prompt includes side-to-move for Black position**
- Input FEN: `"1r1qr1k1/1pp2pbp/p1n3p1/2Pp2B1/3P2b1/2Q2N2/PP2BPPP/2KR3R b - - 6 16"`
- Input analysis: `{ bestMove: "d8d7", evaluation: -263, mate: null, lines: [{ score: -263, mate: null, pv: "d8d7 g5e3 b7b6", depth: 20, multipv: 1 }] }`
- Assert: The user message sent to Claude contains the string `"Black"`
- Assert: The user message sent to Claude contains `"2.63 pawns"` with a positive sign (because from Black's perspective, Black is winning)
- Assert: The user message does NOT contain `"-2.63"` (that's White's perspective, should not appear in the prompt)

**Test: Claude prompt includes side-to-move for White position**
- Input FEN: `"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"` — wait, this is Black to move. Use instead: `"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"`
- Input analysis: `{ bestMove: "e2e4", evaluation: 30, mate: null, lines: [{ score: 30, mate: null, pv: "e2e4 e7e5", depth: 20, multipv: 1 }] }`
- Assert: The user message contains `"White"`
- Assert: The user message contains `"0.30 pawns"` with a positive sign

**Test: Claude prompt correctly inverts line-level scores for Black**
- Input FEN: `"... b ..."` (Black to move — use the move-16 FEN above)
- Input analysis with lines:
  - Line 1: `{ score: -263, mate: null, pv: "d8d7 g5e3" }`
  - Line 2: `{ score: -186, mate: null, pv: "d8c8 g5e3" }`
- Assert: Line 1 in the prompt shows eval `2.63` (positive, Black's perspective)
- Assert: Line 2 in the prompt shows eval `1.86` (positive, Black's perspective)

**Test: Claude prompt correctly inverts mate scores for Black**
- Input FEN: any FEN with `b` as side to move
- Input analysis: `{ bestMove: "d8h4", evaluation: 99997, mate: -3, lines: [{ score: -99997, mate: -3, pv: "d8h4 g2g3 h4e1", depth: 20, multipv: 1 }] }`
- Note: `mate: -3` from White's perspective means Black mates in 3
- Assert: The prompt says `"Mate in 3"` (positive for Black, since Black is the one mating)
- Assert: The per-line mate is also positive 3

### Test File 3: `src/engine/stockfish.test.js`

**Test: `_parseInfo` correctly negates score when Black to move**
- Create a `StockfishEngine` instance (no need to call `init`; `_parseInfo` is a pure method).
- Input line: `"info depth 20 seldepth 30 multipv 1 score cp 263 nodes 1000000 nps 500000 time 2000 pv d8d7 g5e3 b7b6"`
- Input `blackToMove`: `true`
- Expected result: `{ depth: 20, multipv: 1, score: -263, mate: null, pv: "d8d7 g5e3 b7b6" }`

**Test: `_parseInfo` does NOT negate score when White to move**
- Input line: same as above
- Input `blackToMove`: `false`
- Expected result: `{ depth: 20, multipv: 1, score: 263, mate: null, pv: "d8d7 g5e3 b7b6" }`

**Test: `_parseInfo` correctly handles mate scores for Black to move**
- Input line: `"info depth 20 seldepth 10 multipv 1 score mate 3 nodes 500000 nps 250000 time 2000 pv d8h4 g2g3 h4e1"`
- Input `blackToMove`: `true`
- Expected: `{ depth: 20, multipv: 1, score: -99997, mate: -3, pv: "d8h4 g2g3 h4e1" }`
  - Explanation: Stockfish says `mate 3` from Black's perspective (Black mates in 3). The code negates: `mate = -3` and `score = -100000 - (-3) = -99997`. Actually wait — let me re-trace:
  - `mate = parseInt("3") = 3`
  - `if (blackToMove) mate = -mate` → `mate = -3`
  - `mate > 0`? No. → `score = -100000 - mate = -100000 - (-3) = -99997`
  - This means: from White's perspective, White is getting mated in 3 (very bad for White, hence large negative score). `mate = -3` means Black delivers mate in 3. This is correct.

---

## Implementation Order

1. **Install Vitest and configure test infrastructure.**
   - Run `npm install --save-dev vitest` in the project root.
   - Add `"test": "vitest run"` and `"test:watch": "vitest"` to the `scripts` section of `package.json`.
   - Verify: `npm test` runs and reports "no test files found" (not an error about missing test runner).

2. **Write tests for `evalToText` in `src/utils/chess.test.js`.**
   - Write the centipawn and mate formatting tests listed above.
   - Run `npm test`. The mate tests should **fail** (current code produces `M-3` instead of `-M3`).
   - Verify: centipawn tests pass; mate tests fail.

3. **Fix `evalToText` in `src/utils/chess.js`.**
   - Change line 34 from `return mate > 0 ? 'M${mate}' : 'M${mate}'` to `return mate > 0 ? '+M${mate}' : '-M${Math.abs(mate)}'`.
   - Run `npm test`. All `evalToText` tests should now pass.

4. **Write tests for `_parseInfo` in `src/engine/stockfish.test.js`.**
   - Write the score-negation and mate-negation tests listed above.
   - Run `npm test`. These should all pass (the engine logic is already correct).
   - Verify: confirms the engine layer is not the source of the bug.

5. **Write tests for `getCoachingHint` prompt construction in `src/services/claude.test.js`.**
   - Mock the Anthropic SDK. Capture the arguments passed to `anthropic.messages.create`.
   - Write tests for Black-to-move and White-to-move scenarios.
   - Run `npm test`. The Black-to-move tests should **fail** (prompt currently sends White-perspective scores without side context).

6. **Fix `getCoachingHint` in `src/services/claude.js`.**
   - Add side-to-move extraction from FEN.
   - Add perspective multiplier.
   - Update system prompt to include perspective instructions.
   - Update user message to include side label and player-relative scores.
   - Run `npm test`. All Claude prompt tests should now pass.

7. **Update `CoachPanel.jsx` to accept and display `fen` prop.**
   - Add the `fen` prop and the "White/Black to move" label.
   - This is a visual-only change. No automated test needed, but verify manually.

8. **Update `App.jsx` to pass `fen` to `CoachPanel`.**
   - Add `fen={fen}` to the `CoachPanel` JSX.

9. **Manual end-to-end verification.**
   - Start the dev server (`npm run dev`).
   - Paste the reproduction PGN: `1. e4 e6 2. d4 d5 3. exd5 exd5 4. c4 Be6 5. c5 g6 6. Nc3 Bg7 7. Qb3 Nc6 8. Nf3 Nf6 9. Qb5 O-O 10. Be3 Ne4 11. Bd3 a6 12. Qb3 Nxc3 13. Qxc3 Bg4 14. Be2 Re8 15. O-O-O Rb8 16. Bg5`
   - Click Analyze.
   - Verify: The "Black to move" label appears.
   - Verify: The Coach's Hint acknowledges Black is **winning** (not losing).
   - Verify: The eval display shows `-2.63` (White perspective, standard for engine displays).
   - Verify: The coaching text says something like "you have a strong advantage" rather than "you're in a tough spot."
   - Also test a White-to-move position (e.g., the starting position after 1. e4) to ensure White-perspective coaching still works correctly.

10. **Build verification.**
    - Run `npm run build`. Ensure no build errors.

---

## Gotchas

### 1. Score perspective confusion — the core trap

The engine stores scores from **White's perspective** everywhere. This is correct and standard for chess engines. **Do NOT change the engine or the UI display of engine lines to use player-perspective scores.** Only the Claude prompt needs player-perspective scores. If you accidentally flip the engine analysis display, all White-to-move positions will break.

Specifically:
- `analysis.evaluation` → White's perspective. Keep it that way in the `CoachPanel` "Eval" display and `EvalBar`.
- Only in `src/services/claude.js`, multiply by the perspective multiplier before inserting into the prompt text.

### 2. The perspective multiplier is `-1` for Black, `+1` for White

```js
const perspectiveMultiplier = sideToMove === "b" ? -1 : 1;
```

Do NOT reverse this. When Black is to move and `analysis.evaluation` is `-263` (White is losing):
- `playerEval = -263 * -1 = +263` → "Black is winning by 2.63 pawns" ✓

If you accidentally use `sideToMove === "w" ? -1 : 1`, you'll flip the bug in the opposite direction.

### 3. Mate score inversion follows the same pattern

`analysis.mate` is stored from White's perspective:
- `mate = 3` → White mates in 3
- `mate = -3` → Black mates in 3

For the Claude prompt when Black is to move:
- `playerMate = -3 * -1 = 3` → "Black delivers mate in 3" (good for Black) ✓
- `playerMate = 3 * -1 = -3` → "Black gets mated in 3" (bad for Black) ✓

### 4. The `linesText` map in `claude.js` must also be inverted

It's easy to fix only the top-level `analysis.evaluation` and forget the per-line scores in the `linesText` mapping. Each `line.score` and `line.mate` must also be multiplied by `perspectiveMultiplier` before formatting.

### 5. `evalToText` mate display — both branches were identical

The current code on line 34 of `src/utils/chess.js`:
```js
return mate > 0 ? `M${mate}` : `M${mate}`;
```
Both the `true` and `false` branches return the exact same string. This is clearly a copy-paste bug. The fix to `+M${mate}` / `-M${Math.abs(mate)}` changes the displayed format in the `CoachPanel` engine lines and the `EvalBar`. Make sure the `Math.abs()` is on the negative branch only — otherwise a positive mate like `3` would show `+M3` (correct), and negative like `-3` would show `-M3` (correct, using `Math.abs(-3) = 3`).

### 6. FEN field index for side-to-move

FEN format: `<pieces> <side> <castling> <en-passant> <halfmove> <fullmove>`. The side-to-move is **index 1** when splitting by space (0-indexed). `fen.split(" ")[1]` returns `"w"` or `"b"`. This is used in two places: `stockfish.js` (already works) and the new code in `claude.js`. Use the same extraction method.

### 7. Do NOT modify the engine's `_parseInfo` normalization

The negation in `_parseInfo` (line 93–97 of `src/engine/stockfish.js`) is correct. It converts Stockfish's side-to-move-relative score to White-relative. Do not remove or change this. The fix is entirely in how the Claude prompt consumes the White-relative data.

### 8. Anthropic SDK mock in tests

The `claude.js` file imports `Anthropic` at the top level and creates a client immediately (lines 3–6). When testing, you must mock the entire `@anthropic-ai/sdk` module before importing `claude.js`. In Vitest:

```js
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    constructor() {
      this.messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ text: "mock coaching hint" }],
        }),
      };
    }
  },
}));
```

Capture the `create` mock to inspect the arguments:
```js
const { getCoachingHint } = await import("../services/claude.js");
```
Then in the test, call `getCoachingHint(fen, analysis)` and inspect what was passed to `messages.create` via the mock.

### 9. The `import.meta.env.VITE_ANTHROPIC_API_KEY` in tests

During tests, `import.meta.env.VITE_ANTHROPIC_API_KEY` will be `undefined`. This is fine because the Anthropic SDK is mocked. But if the mock is improperly set up, the test will try to create a real client and fail with an auth error. Make sure the mock is hoisted properly with `vi.mock` (Vitest auto-hoists `vi.mock` calls).

### 10. Naming convention: this project uses plain JavaScript (JSX), not TypeScript

All files are `.js` or `.jsx`. Do NOT create `.ts` or `.tsx` files. Do NOT add type annotations. Follow the existing pattern of no JSDoc types — the codebase is intentionally minimal.

### 11. The `CoachPanel` engine analysis lines should STAY in White's perspective

Standard chess UI convention: engine evaluation lines are shown from White's perspective. The `CoachPanel` "Eval: -2.63" and the per-line scores like "(-2.63)" should remain as-is (White's perspective). Only the Claude coaching text changes to the player's perspective. Do not touch the rendering logic in `CoachPanel.jsx` lines 29–53 for score display.

### 12. CSS/Tailwind: use Tailwind v4 syntax

This project uses Tailwind CSS v4 (via `@tailwindcss/vite` plugin). Any new CSS classes should use standard Tailwind utility classes. The project does NOT have a `tailwind.config.js` file — Tailwind v4 uses CSS-based configuration. Don't create a Tailwind config file.
