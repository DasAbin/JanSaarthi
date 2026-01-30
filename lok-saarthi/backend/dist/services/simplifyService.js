"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplifyService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const ocrService_1 = require("./ocrService");
const ragService_1 = require("./ragService");
const cleaner_1 = require("../utils/cleaner");
const chunker_1 = require("../utils/chunker");
const storage_1 = require("../utils/storage");
const cache_1 = require("../utils/cache");
const llm_1 = require("./llm");
class SimplifyService {
    constructor() {
        this.ocrService = new ocrService_1.OcrService();
        this.cleaner = new cleaner_1.Cleaner();
        this.chunker = new chunker_1.Chunker();
    }
    async simplifyDocument(req) {
        const { filePath, originalName, language } = req;
        // Cache: hash PDF and check cache (low-bandwidth, faster repeat requests)
        const hashKey = await (0, cache_1.hashFile)(filePath);
        const cached = await (0, cache_1.getCachedSimplify)(hashKey);
        if (cached) {
            console.log(`[SimplifyService] Cache hit for ${originalName}`);
            return {
                summary: cached.summary,
                eli10: cached.eli10,
                keyPoints: cached.keyPoints,
                steps: cached.steps,
                language: cached.language,
                sourceFile: cached.sourceFile,
                rawText: cached.rawText,
                ocrEngine: cached.ocrEngine
            };
        }
        // Step 1: Extract text using OCR (PaddleOCR fast mode when OCR_FAST=true)
        console.log(`[SimplifyService] Starting OCR for: ${originalName}`);
        const ocrResult = await this.ocrService.extractText({
            filePath,
            language
        });
        const { rawText, cleanedText, engine, pages } = ocrResult;
        console.log(`[SimplifyService] OCR complete using ${engine}. Pages: ${pages.length}, Text length: ${rawText.length}`);
        // Step 2: Clean the text further if needed
        const finalText = cleanedText || this.cleaner.clean(rawText);
        let summary;
        let eli10;
        let keyPoints;
        let steps;
        // If document > 5 pages: skip embeddings, one-shot LLM summary (faster, lower bandwidth)
        if (pages.length > 5) {
            console.log(`[SimplifyService] Long document (${pages.length} pages): one-shot LLM summary (no RAG)`);
            const oneShot = await this.oneShotSummary(finalText, originalName, language);
            summary = oneShot.summary;
            eli10 = oneShot.eli10;
            keyPoints = oneShot.keyPoints;
            steps = oneShot.steps;
        }
        else {
            // Step 3: Chunk with size 400 (faster, smaller chunks)
            const chunks = this.chunker.chunk(finalText, {
                minTokens: 300,
                maxTokens: 400,
                overlapTokens: 40
            });
            console.log(`[SimplifyService] Created ${chunks.length} chunks (max 400 tokens)`);
            // Step 4: Store chunks in RAG
            const collectionName = `doc_${Date.now()}`;
            ragService_1.ragService.addChunks(collectionName, chunks, {
                sourceFile: originalName,
                language
            });
            // Step 5: Generate summary using RAG
            const ragResult = await ragService_1.ragService.summarizeFromChunks({
                chunks,
                originalText: finalText,
                language,
                documentName: originalName
            });
            summary = ragResult.summary;
            eli10 = ragResult.eli10;
            keyPoints = ragResult.keyPoints;
            steps = ragResult.steps;
            ragService_1.ragService.clearCollection(collectionName);
        }
        const safeKeyPoints = Array.isArray(keyPoints) ? keyPoints : [];
        const safeSteps = Array.isArray(steps) ? steps : [];
        // Step 6: Save summary to file
        const summaryFileName = `${path_1.default.basename(filePath)}.summary.txt`;
        const summaryPath = (0, storage_1.storagePath)("temp", summaryFileName);
        const summaryContent = `
Document: ${originalName}
Language: ${language}
OCR Engine: ${engine}

=== SUMMARY ===
${summary}

=== SIMPLE EXPLANATION ===
${eli10}

=== KEY POINTS ===
${safeKeyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

=== STEPS TO TAKE ===
${safeSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

=== RAW TEXT (first 2000 chars) ===
${rawText.slice(0, 2000)}...
    `.trim();
        await promises_1.default.writeFile(summaryPath, summaryContent, "utf-8");
        console.log(`[SimplifyService] Summary saved to: ${summaryPath}`);
        const result = {
            summary,
            eli10,
            keyPoints: safeKeyPoints,
            steps: safeSteps,
            language,
            sourceFile: originalName,
            rawText: rawText.slice(0, 5000),
            ocrEngine: engine
        };
        // Cache result for future requests
        await (0, cache_1.setCachedSimplify)(hashKey, result);
        return result;
    }
    /** One-shot LLM summary for long documents (>5 pages); no embeddings/RAG. */
    async oneShotSummary(fullText, documentName, language) {
        const truncated = fullText.slice(0, 12000);
        const langInstr = language === "hi"
            ? "Respond in Hindi (हिंदी में जवाब दें)."
            : language === "mr"
                ? "Respond in Marathi (मराठी मध्ये उत्तर द्या)."
                : "Respond in simple English.";
        const prompt = `You are a helpful assistant that simplifies government documents for rural citizens.
${langInstr}
Document: ${documentName}

Full text excerpt:
${truncated}

Generate a JSON response with these fields only:
{
  "summary": "A clear 2-3 sentence summary of what this document is about",
  "eli10": "Explain as if talking to a 10-year-old villager, simple words and examples",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "steps": ["Step 1: What to do first", "Step 2: Next action", "Step 3: etc."]
}
Make it practical and actionable. Return ONLY valid JSON.`;
        try {
            const jsonStr = await (0, llm_1.askLLM)(prompt, { json: true, preferFast: true });
            const parsed = JSON.parse(jsonStr);
            return {
                summary: parsed.summary || "Summary not available.",
                eli10: parsed.eli10 || "Simple explanation not available.",
                keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
                steps: Array.isArray(parsed.steps) ? parsed.steps : []
            };
        }
        catch (e) {
            console.error("[SimplifyService] One-shot summary error:", e);
            return {
                summary: "Unable to generate summary. Please try again.",
                eli10: "Sorry, we couldn't explain this document right now.",
                keyPoints: ["Document processing failed"],
                steps: ["Please try uploading again"]
            };
        }
    }
}
exports.SimplifyService = SimplifyService;
//# sourceMappingURL=simplifyService.js.map