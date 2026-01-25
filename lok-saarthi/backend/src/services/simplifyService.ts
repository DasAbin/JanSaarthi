import path from "path";
import fs from "fs/promises";
import { OcrService } from "./ocrService";
import { RagService } from "./ragService";
import { Cleaner } from "../utils/cleaner";
import { Chunker } from "../utils/chunker";

export interface SimplifyRequest {
  filePath: string;
  originalName: string;
  language: string;
  mode: string;
}

export interface SimplifyResponse {
  summary: string;
  eli10: string;
  keyPoints: string[];
  steps: string[];
  language: string;
  sourceFile: string;
}

export class SimplifyService {
  private ocrService = new OcrService();
  private cleaner = new Cleaner();
  private chunker = new Chunker();
  private ragService = new RagService();

  async simplifyDocument(req: SimplifyRequest): Promise<SimplifyResponse> {
    // 1. OCR
    const rawText = await this.ocrService.extractText({
      filePath: req.filePath,
      language: req.language
    });

    // 2. Clean text
    const cleaned = this.cleaner.clean(rawText);

    // 3. Chunk text
    const chunks = this.chunker.chunk(cleaned);

    // 4. Index into vector store (ChromaDB abstraction)
    await this.ragService.indexDocument({
      documentId: path.basename(req.filePath),
      chunks,
      metadata: {
        filename: req.originalName,
        language: req.language
      }
    });

    // 5. Ask Gemini to summarize
    const { summary, eli10, keyPoints, steps } =
      await this.ragService.summarizeFromChunks({
        chunks,
        language: req.language
      });

    // Ensure keyPoints and steps are arrays (safety check)
    const safeKeyPoints = Array.isArray(keyPoints) ? keyPoints : [];
    const safeSteps = Array.isArray(steps) ? steps : [];

    // Optionally persist simplified text
    const outDir = path.join(__dirname, "..", "storage", "temp");
    const outPath = path.join(
      outDir,
      `${path.basename(req.filePath)}.summary.txt`
    );
    await fs.writeFile(
      outPath,
      [summary, "", "ELI10:", eli10, "", "Key points:", ...safeKeyPoints].join(
        "\n"
      ),
      "utf-8"
    );

    return {
      summary,
      eli10,
      keyPoints: safeKeyPoints,
      steps: safeSteps,
      language: req.language,
      sourceFile: req.originalName
    };
  }
}

