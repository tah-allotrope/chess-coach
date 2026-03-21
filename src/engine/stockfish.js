export class StockfishEngine {
  constructor({ multiPv = 3 } = {}) {
    this.worker = null;
    this.multiPv = multiPv;
  }

  _onMessage(callback) {
    const handler = (e) => callback(typeof e.data === "string" ? e.data : "");
    this.worker.addEventListener("message", handler);
    return () => this.worker.removeEventListener("message", handler);
  }

  _send(cmd) {
    this.worker.postMessage(cmd);
  }

  _waitFor(token) {
    return new Promise((resolve) => {
      const remove = this._onMessage((line) => {
        if (line.includes(token)) {
          remove();
          resolve(line);
        }
      });
    });
  }

  async init() {
    if (this.worker) {
      return;
    }

    this.worker = new Worker("/stockfish/stockfish.js");
    this._send("uci");
    await this._waitFor("uciok");
    this._send(`setoption name MultiPV value ${this.multiPv}`);
    this._send("isready");
    await this._waitFor("readyok");
  }

  async getBestMove(fen, depth = 8) {
    const result = await this.analyze(fen, depth);
    return result.bestMove;
  }

  async analyze(fen, depth = 20) {
    const lines = new Map();
    let bestMove = null;

    const blackToMove = fen.split(" ")[1] === "b";

    return new Promise((resolve) => {
      const remove = this._onMessage((line) => {
        if (line.startsWith("info") && line.includes("multipv") && line.includes(" pv ")) {
          const parsed = this._parseInfo(line, blackToMove);
          if (parsed) lines.set(parsed.multipv, parsed);
        }
        if (line.startsWith("bestmove")) {
          bestMove = line.split(" ")[1];
          remove();

          const sortedLines = Array.from(lines.values()).sort(
            (a, b) => a.multipv - b.multipv
          );

          const topEval = sortedLines[0]?.score ?? 0;
          resolve({
            bestMove,
            evaluation: topEval,
            mate: sortedLines[0]?.mate ?? null,
            lines: sortedLines,
          });
        }
      });

      this._send("position fen " + fen);
      this._send("go depth " + depth);
    });
  }

  _parseInfo(line, blackToMove) {
    const get = (key) => {
      const regex = new RegExp(`\\b${key}\\s+(\\S+)`);
      const m = line.match(regex);
      return m ? m[1] : null;
    };

    const depthStr = get("depth");
    const multipvStr = get("multipv");
    const pvIndex = line.indexOf(" pv ");
    if (!depthStr || !multipvStr || pvIndex === -1) return null;

    const pv = line.slice(pvIndex + 4).trim();
    const cpStr = get("cp");
    const mateStr = get("mate");

    let score = 0;
    let mate = null;

    if (mateStr !== null) {
      mate = parseInt(mateStr, 10);
      if (blackToMove) mate = -mate;
      score = mate > 0 ? 100000 - mate : -100000 - mate;
    } else if (cpStr !== null) {
      score = parseInt(cpStr, 10);
      if (blackToMove) score = -score;
    }

    return {
      depth: parseInt(depthStr, 10),
      multipv: parseInt(multipvStr, 10),
      score,
      mate,
      pv,
    };
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
