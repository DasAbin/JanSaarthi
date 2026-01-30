"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageRoot = storageRoot;
exports.storagePath = storagePath;
exports.ensureStorageDirs = ensureStorageDirs;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
function storageRoot() {
    // Backend runs with cwd = backend/
    return path_1.default.join(process.cwd(), "storage");
}
function storagePath(...parts) {
    return path_1.default.join(storageRoot(), ...parts);
}
async function ensureStorageDirs() {
    const dirs = [
        storagePath("pdfs"),
        storagePath("forms"),
        storagePath("audio"),
        storagePath("knowledge"),
        storagePath("knowledge", "modules"),
        storagePath("temp"),
        storagePath("chroma"),
        storagePath("cache"),
        storagePath("voices")
    ];
    await Promise.all(dirs.map((d) => promises_1.default.mkdir(d, { recursive: true })));
}
//# sourceMappingURL=storage.js.map