import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { storagePath } from "./storage";

const CACHE_DIR = "cache";
const CACHE_META = "index.json";

export type CachedSimplifyResult = {
  summary: string;
  eli10: string;
  keyPoints: string[];
  steps: string[];
  language: string;
  sourceFile: string;
  rawText?: string;
  ocrEngine?: string;
  cachedAt: number;
};

let meta: Record<string, { path: string; cachedAt: number }> = {};

async function loadMeta(): Promise<Record<string, { path: string; cachedAt: number }>> {
  const p = storagePath(CACHE_DIR, CACHE_META);
  try {
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveMeta(): Promise<void> {
  const p = storagePath(CACHE_DIR, CACHE_META);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(meta, null, 0), "utf-8");
}

/**
 * Hash file contents for cache key (SHA-256, first 16 chars).
 */
export async function hashFile(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

/**
 * Get cached simplify result by file hash. Returns null if miss or expired (7 days).
 */
export async function getCachedSimplify(hashKey: string): Promise<CachedSimplifyResult | null> {
  meta = await loadMeta();
  const entry = meta[hashKey];
  if (!entry) return null;
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  if (Date.now() - entry.cachedAt > maxAge) {
    delete meta[hashKey];
    await saveMeta();
    try {
      await fs.unlink(storagePath(CACHE_DIR, entry.path));
    } catch {
      // ignore
    }
    return null;
  }
  try {
    const p = storagePath(CACHE_DIR, entry.path);
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw) as CachedSimplifyResult;
  } catch {
    delete meta[hashKey];
    await saveMeta();
    return null;
  }
}

/**
 * Store simplify result in cache by file hash.
 */
export async function setCachedSimplify(
  hashKey: string,
  result: Omit<CachedSimplifyResult, "cachedAt">
): Promise<void> {
  meta = await loadMeta();
  const filename = `${hashKey}.json`;
  const fullPath = storagePath(CACHE_DIR, filename);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  const toSave: CachedSimplifyResult = { ...result, cachedAt: Date.now() };
  await fs.writeFile(fullPath, JSON.stringify(toSave), "utf-8");
  meta[hashKey] = { path: filename, cachedAt: toSave.cachedAt };
  await saveMeta();
}
