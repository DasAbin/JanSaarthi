"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const cleaner_1 = require("../utils/cleaner");
const storage_1 = require("../utils/storage");
const geminiService_1 = require("./geminiService");
const child_process_1 = require("child_process");
function pythonExecutable() {
    return process.env.PYTHON || "python";
}
function mapLangToPaddle(lang) {
    const l = (lang || "en").toLowerCase();
    if (l.startsWith("en"))
        return "en";
    if (l.startsWith("hi"))
        return "hi";
    if (l.startsWith("mr"))
        return "mr";
    return "en";
}
async function runPaddleOcr(filePath, language) {
    const script = path_1.default.join(process.cwd(), "python", "paddle_ocr.py");
    // Check if script exists
    try {
        await promises_1.default.access(script);
    }
    catch {
        throw new Error("PaddleOCR script not found. Using Gemini Vision fallback.");
    }
    const outJson = (0, storage_1.storagePath)("temp", `${path_1.default.basename(filePath)}.ocr.json`);
    await promises_1.default.mkdir(path_1.default.dirname(outJson), { recursive: true });
    const fastMode = (process.env.OCR_FAST || "true").toLowerCase() === "true";
    const args = [
        script,
        "--input",
        filePath,
        "--lang",
        mapLangToPaddle(language),
        "--out",
        outJson
    ];
    if (fastMode)
        args.push("--fast");
    await new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(pythonExecutable(), args, { stdio: ["ignore", "pipe", "pipe"] });
        let stderr = "";
        child.stderr.on("data", (d) => (stderr += d.toString()));
        child.on("error", (err) => {
            reject(new Error(`Failed to spawn Python: ${err.message}`));
        });
        child.on("exit", (code) => {
            if (code === 0)
                return resolve();
            reject(new Error(`PaddleOCR failed (code=${code}): ${stderr}`));
        });
    });
    const raw = await promises_1.default.readFile(outJson, "utf-8");
    const json = JSON.parse(raw);
    return Array.isArray(json.pages) ? json.pages : [];
}
class OcrService {
    constructor() {
        this.cleaner = new cleaner_1.Cleaner();
    }
    async extractText(req) {
        await promises_1.default.access(req.filePath);
        const wantsPaddle = (process.env.OCR_ENGINE || "paddleocr").toLowerCase() === "paddleocr";
        // Try PaddleOCR if configured
        if (wantsPaddle) {
            try {
                const pages = await runPaddleOcr(req.filePath, req.language);
                const rawText = pages.map((p) => p.text).join("\n\n");
                const cleanedText = this.cleaner.clean(rawText);
                return { rawText, cleanedText, pages, engine: "paddleocr" };
            }
            catch (e) {
                console.error("PaddleOCR failed, falling back to Gemini Vision:", e);
            }
        }
        // Gemini Vision (default and fallback)
        const extracted = await geminiService_1.geminiService.extractTextFromImage(req.filePath, req.language);
        const pages = [{ pageNumber: 1, text: extracted }];
        const rawText = extracted;
        const cleanedText = this.cleaner.clean(rawText);
        return { rawText, cleanedText, pages, engine: "gemini_vision" };
    }
}
exports.OcrService = OcrService;
//# sourceMappingURL=ocrService.js.map