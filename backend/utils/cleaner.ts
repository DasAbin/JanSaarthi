export type CleanOptions = {
  /** Lines repeated >= this count are treated as headers/footers */
  repeatedLineThreshold?: number;
  /** Max length of a line to consider as header/footer candidate */
  headerFooterMaxLen?: number;
};

const DEFAULTS: Required<CleanOptions> = {
  repeatedLineThreshold: 3,
  headerFooterMaxLen: 90
};

function normalizeLine(line: string): string {
  return line
    .replace(/\s+/g, " ")
    .replace(/[‐‑–—]/g, "-")
    .trim();
}

function looksLikePageJunk(line: string): boolean {
  const l = line.toLowerCase();
  if (!l) return true;
  if (/^page\s*\d+(\s*of\s*\d+)?$/i.test(line.trim())) return true;
  if (/^\d+\s*\/\s*\d+$/.test(line.trim())) return true;
  if (/^\d+$/.test(line.trim()) && line.trim().length <= 3) return true;
  if (l.includes("government of india") || l.includes("भारत सरकार")) return true;
  if (l.includes("ministry of") || l.includes("विभाग")) return true;
  return false;
}

export class Cleaner {
  clean(text: string, opts: CleanOptions = {}): string {
    const o = { ...DEFAULTS, ...opts };

    const rawLines = text
      .replace(/\r/g, "\n")
      .split("\n")
      .map((l) => normalizeLine(l))
      .filter(Boolean);

    // Count repeated short lines → likely headers/footers
    const freq = new Map<string, number>();
    for (const line of rawLines) {
      if (line.length <= o.headerFooterMaxLen) {
        freq.set(line, (freq.get(line) || 0) + 1);
      }
    }

    const filtered = rawLines.filter((line) => {
      if (looksLikePageJunk(line)) return false;
      const count = freq.get(line) || 0;
      if (line.length <= o.headerFooterMaxLen && count >= o.repeatedLineThreshold) {
        return false;
      }
      return true;
    });

    // Rebuild paragraphs: keep blank lines between logical sections
    const rebuilt = filtered
      .join("\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return rebuilt;
  }
}

