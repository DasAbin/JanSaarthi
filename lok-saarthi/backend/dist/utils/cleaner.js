"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cleaner = void 0;
const DEFAULTS = {
    repeatedLineThreshold: 3,
    headerFooterMaxLen: 90
};
function normalizeLine(line) {
    return line
        .replace(/\s+/g, " ")
        .replace(/[‐‑–—]/g, "-")
        .trim();
}
function looksLikePageJunk(line) {
    const l = line.toLowerCase();
    if (!l)
        return true;
    if (/^page\s*\d+(\s*of\s*\d+)?$/i.test(line.trim()))
        return true;
    if (/^\d+\s*\/\s*\d+$/.test(line.trim()))
        return true;
    if (/^\d+$/.test(line.trim()) && line.trim().length <= 3)
        return true;
    if (l.includes("government of india") || l.includes("भारत सरकार"))
        return true;
    if (l.includes("ministry of") || l.includes("विभाग"))
        return true;
    return false;
}
class Cleaner {
    clean(text, opts = {}) {
        const o = { ...DEFAULTS, ...opts };
        const rawLines = text
            .replace(/\r/g, "\n")
            .split("\n")
            .map((l) => normalizeLine(l))
            .filter(Boolean);
        // Count repeated short lines → likely headers/footers
        const freq = new Map();
        for (const line of rawLines) {
            if (line.length <= o.headerFooterMaxLen) {
                freq.set(line, (freq.get(line) || 0) + 1);
            }
        }
        const filtered = rawLines.filter((line) => {
            if (looksLikePageJunk(line))
                return false;
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
exports.Cleaner = Cleaner;
//# sourceMappingURL=cleaner.js.map