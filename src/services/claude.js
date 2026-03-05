import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are a friendly chess coach for intermediate players (1200-1800 Elo).
Given a position (FEN) and Stockfish analysis, provide a concise coaching hint.
Focus on: key patterns, tactical motifs, strategic plans, and piece activity.
Keep your response to 2-3 short paragraphs. Use plain language, not engine jargon.
Mention specific squares and pieces when relevant.`;

export async function getCoachingHint(fen, analysis) {
  const linesText = analysis.lines
    .map(
      (l, i) =>
        `Line ${i + 1} (eval ${l.mate !== null ? `mate in ${l.mate}` : (l.score / 100).toFixed(2)}): ${l.pv}`
    )
    .join("\n");

  const userMessage = `Position (FEN): ${fen}

Stockfish evaluation: ${analysis.mate !== null ? `Mate in ${analysis.mate}` : `${(analysis.evaluation / 100).toFixed(2)} pawns`}
Best move: ${analysis.bestMove}

Top lines:
${linesText}

What should the player focus on in this position? Give a coaching hint.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  return response.content[0].text;
}
