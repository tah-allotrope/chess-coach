import { Chess } from "chess.js";

export function isValidFen(fen) {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

export function evalToText(cp, mate) {
  if (mate !== null && mate !== undefined) {
    return mate > 0 ? `M${mate}` : `M${mate}`;
  }
  const sign = cp >= 0 ? "+" : "";
  return `${sign}${(cp / 100).toFixed(2)}`;
}

export function evalToPercent(cp) {
  const pct = 50 + 50 * (2 / (1 + Math.exp(-0.004 * cp)) - 1);
  return Math.min(98, Math.max(2, pct));
}

export function formatPv(pvString, maxMoves = 6) {
  return pvString.split(" ").slice(0, maxMoves).join(" ");
}
