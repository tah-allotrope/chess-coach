import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are a friendly chess coach for intermediate players (1200-1800 Elo).
Given a position (FEN) and Stockfish analysis, provide a concise coaching hint.
Focus on: key patterns, tactical motifs, strategic plans, and piece activity.
Keep your response to 2-3 short paragraphs. Use plain language, not engine jargon.
Mention specific squares and pieces when relevant.
You will be told which color the player is and which side is to move. Always address the player as "you" and frame evaluations from their perspective.
A positive evaluation means the player is better; a negative evaluation means the player is worse.`;

function colorToLabel(color) {
  return color === "b" ? "Black" : "White";
}

function formatPerspectiveEval(score, mate) {
  if (mate !== null && mate !== undefined) {
    return mate > 0 ? `mate in ${mate}` : `mate in ${Math.abs(mate)} for your opponent`;
  }

  const pawns = score / 100;
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
}

export async function getCoachingHint(fen, analysis, playerColor) {
  try {
    const sideToMove = fen.split(" ")[1];
    const sideLabel = sideToMove === "w" ? "White" : "Black";
    const player = playerColor ?? sideToMove;
    const playerLabel = colorToLabel(player);
    const perspectiveMultiplier = player === "b" ? -1 : 1;
    const playerEval = analysis.evaluation * perspectiveMultiplier;
    const playerMate =
      analysis.mate !== null && analysis.mate !== undefined
        ? analysis.mate * perspectiveMultiplier
        : null;

    const linesText = analysis.lines
      .map(
        (l, i) => {
          const lineScore = l.score * perspectiveMultiplier;
          const lineMate =
            l.mate !== null && l.mate !== undefined
              ? l.mate * perspectiveMultiplier
              : null;
          const lineEvalText =
            lineMate !== null && lineMate !== undefined
              ? formatPerspectiveEval(lineScore, lineMate)
              : formatPerspectiveEval(lineScore, null);

          return `Line ${i + 1} (eval ${lineEvalText}): ${l.pv}`;
        }
      )
      .join("\n");

    const userMessage = `Position (FEN): ${fen}
Player color: ${playerLabel}
Player to move: ${sideLabel}

Evaluation from ${playerLabel}'s perspective: ${
      playerMate !== null
        ? playerMate > 0
          ? `Mate in ${playerMate}`
          : `Mate in ${Math.abs(playerMate)} for your opponent`
        : `${playerEval >= 0 ? "+" : ""}${(playerEval / 100).toFixed(2)} pawns`
    }
(Positive means ${playerLabel} is better, negative means ${playerLabel} is worse)
Best move: ${analysis.bestMove}

Top lines:
${linesText}

What should ${playerLabel} focus on in this position? Give a coaching hint.`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    return response.content[0].text;
  } catch (error) {
    console.error("Error getting coaching hint from Anthropic:", error);
    return "I'm having trouble analyzing this position right now. Try again later!";
  }
}
