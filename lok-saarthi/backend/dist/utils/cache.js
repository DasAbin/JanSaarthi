"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashFile = hashFile;
exports.getCachedSimplify = getCachedSimplify;
exports.setCachedSimplify = setCachedSimplify;
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const storage_1 = require("./storage");
const CACHE_DIR = "cache";
const CACHE_META = "index.json";
let meta = {};
async function loadMeta() {
    const p = (0, storage_1.storagePath)(CACHE_DIR, CACHE_META);
    try {
        const raw = await promises_1.default.readFile(p, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
async function saveMeta() {
    const p = (0, storage_1.storagePath)(CACHE_DIR, CACHE_META);
    await promises_1.default.mkdir(path_1.default.dirname(p), { recursive: true });
    await promises_1.default.writeFile(p, JSON.stringify(meta, null, 0), "utf-8");
}
/**
 * Hash file contents for cache key (SHA-256, first 16 chars).
 */
async function hashFile(filePath) {
    const buf = await promises_1.default.readFile(filePath);
    return crypto_1.default.createHash("sha256").update(buf).digest("hex").slice(0, 16);
}
/**
 * Get cached simplify result by file hash. Returns null if miss or expired (7 days).
 */
async function getCachedSimplify(hashKey) {
    meta = await loadMeta();
    const entry = meta[hashKey];
    if (!entry)
        return null;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (Date.now() - entry.cachedAt > maxAge) {
        delete meta[hashKey];
        await saveMeta();
        try {
            await promises_1.default.unlink((0, storage_1.storagePath)(CACHE_DIR, entry.path));
        }
        catch {
            // ignore
        }
        return null;
    }
    try {
        const p = (0, storage_1.storagePath)(CACHE_DIR, entry.path);
        const raw = await promises_1.default.readFile(p, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        delete meta[hashKey];
        await saveMeta();
        return null;
    }
}
/**
 * Store simplify result in cache by file hash.
 */
async function setCachedSimplify(hashKey, result) {
    meta = await loadMeta();
    const filename = `${hashKey}.json`;
    const fullPath = (0, storage_1.storagePath)(CACHE_DIR, filename);
    await promises_1.default.mkdir(path_1.default.dirname(fullPath), { recursive: true });
    const toSave = { ...result, cachedAt: Date.now() };
    await promises_1.default.writeFile(fullPath, JSON.stringify(toSave), "utf-8");
    meta[hashKey] = { path: filename, cachedAt: toSave.cachedAt };
    await saveMeta();
}
//# sourceMappingURL=cache.js.map