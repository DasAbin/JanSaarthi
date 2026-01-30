export type Chunk = {
  id: string;
  text: string;
  tokenCount: number;
  startChar: number;
  endChar: number;
};

export type ChunkOptions = {
  minTokens?: number; // default 500
  maxTokens?: number; // default 800
  overlapTokens?: number; // default 60
};

const DEFAULTS: Required<ChunkOptions> = {
  minTokens: 500,
  maxTokens: 800,
  overlapTokens: 60
};

// Fast approximate token estimator (works offline)
export function estimateTokens(text: string): number {
  // Roughly ~0.75 words per token in English; for Indic scripts this varies.
  // We use a conservative mapping: tokens ~= words * 1.33
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words * 1.33));
}

export class Chunker {
  chunk(text: string, opts: ChunkOptions = {}): Chunk[] {
    const o = { ...DEFAULTS, ...opts };
    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    const chunks: Chunk[] = [];
    let buffer = "";
    let bufferStart = 0;
    let cursor = 0;
    let chunkIndex = 0;

    const flush = () => {
      const t = buffer.trim();
      if (!t) return;
      const tokenCount = estimateTokens(t);
      chunks.push({
        id: `chunk_${chunkIndex++}`,
        text: t,
        tokenCount,
        startChar: bufferStart,
        endChar: bufferStart + buffer.length
      });
    };

    for (const p of paragraphs) {
      const addition = (buffer ? "\n\n" : "") + p;
      const candidate = buffer + addition;
      const candidateTokens = estimateTokens(candidate);

      if (candidateTokens <= o.maxTokens) {
        if (!buffer) bufferStart = cursor;
        buffer = candidate;
      } else {
        // If current buffer is too small, force-add paragraph by splitting it.
        if (estimateTokens(buffer) < o.minTokens && p.length > 0) {
          const words = p.split(/\s+/);
          let part = "";
          for (const w of words) {
            const cand = (part ? part + " " : "") + w;
            if (estimateTokens(cand) > o.maxTokens) {
              if (!buffer) bufferStart = cursor;
              buffer = (buffer ? buffer + "\n\n" : "") + part;
              flush();
              // overlap: keep last overlapTokens from part
              const overlap = this.takeLastTokens(part, o.overlapTokens);
              buffer = overlap;
              bufferStart = Math.max(0, cursor + (p.indexOf(overlap) >= 0 ? p.indexOf(overlap) : 0));
              part = w;
            } else {
              part = cand;
            }
          }
          if (part) {
            if (!buffer) bufferStart = cursor;
            buffer = (buffer ? buffer + "\n\n" : "") + part;
          }
        } else {
          flush();
          // overlap from previous buffer
          const overlap = this.takeLastTokens(buffer, o.overlapTokens);
          buffer = overlap ? overlap + "\n\n" + p : p;
          bufferStart = Math.max(0, cursor);
        }
      }

      cursor += p.length + 2; // rough, since we removed multiple newlines
    }

    flush();
    return chunks;
  }

  private takeLastTokens(text: string, tokens: number): string {
    if (tokens <= 0) return "";
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "";
    const takeWords = Math.max(1, Math.round(tokens / 1.33));
    return words.slice(Math.max(0, words.length - takeWords)).join(" ");
  }
}

