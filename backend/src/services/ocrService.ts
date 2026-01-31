import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export interface OcrRequest {
  filePath: string;
  language: string;
}

type GoogleModel = {
  name?: string;
  supportedGenerationMethods?: string[];
  displayName?: string;
};

let cachedWorkingVisionModel: string | null = null;

export class OcrService {
  private genAI: GoogleGenerativeAI | null = null;
  private preferredModel =
    process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  private async listModelsViaRest(): Promise<GoogleModel[]> {
    const apiKey = process.env.GEMINI_API_KEY || "";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
      apiKey
    )}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to list models: HTTP ${res.status}`);
    }
    const json = (await res.json()) as { models?: GoogleModel[] };
    return Array.isArray(json.models) ? json.models : [];
  }

  private scoreModelName(name: string): number {
    const n = name.toLowerCase();
    let score = 0;
    // Prefer vision-capable modern models (flash first, then pro)
    if (n.includes("flash")) score += 100;
    if (n.includes("pro")) score += 60;
    if (n.includes("2.0")) score += 40;
    if (n.includes("1.5")) score += 30;
    return score;
  }

  private async getWorkingVisionModelName(): Promise<string> {
    if (cachedWorkingVisionModel) return cachedWorkingVisionModel;

    const explicit = (this.preferredModel || "").trim();
    if (explicit) {
      try {
        const m = this.genAI!.getGenerativeModel({ model: explicit });
        await m.generateContent("ping");
        cachedWorkingVisionModel = explicit;
        return explicit;
      } catch {
        // fall through
      }
    }

    const models = await this.listModelsViaRest();
    const candidates = models
      .filter((m) => {
        const methods = m.supportedGenerationMethods || [];
        return (
          typeof m.name === "string" && methods.includes("generateContent")
        );
      })
      .map((m) => String(m.name).replace(/^models\//, ""));

    if (candidates.length === 0) {
      cachedWorkingVisionModel = explicit || "gemini-1.5-flash-latest";
      return cachedWorkingVisionModel;
    }

    candidates.sort((a, b) => this.scoreModelName(b) - this.scoreModelName(a));
    cachedWorkingVisionModel = candidates[0];
    return cachedWorkingVisionModel;
  }

  async extractText(req: OcrRequest): Promise<string> {
    // If no API key, return placeholder
    if (!this.genAI) {
      return `OCR_RESULT_PLACEHOLDER for ${req.filePath} (language=${req.language}). Please configure GEMINI_API_KEY in .env file to enable OCR.`;
    }

    try {
      // Check if file exists
      await fs.access(req.filePath);

      // Read file
      const fileData = await fs.readFile(req.filePath);
      const base64Data = fileData.toString("base64");

      // Determine MIME type from file extension
      const ext = path.extname(req.filePath).toLowerCase();
      let mimeType = "image/png";

      if (ext === ".jpg" || ext === ".jpeg") {
        mimeType = "image/jpeg";
      } else if (ext === ".png") {
        mimeType = "image/png";
      } else if (ext === ".webp") {
        mimeType = "image/webp";
      } else if (ext === ".pdf") {
        mimeType = "application/pdf";
      } else if (ext === ".gif") {
        mimeType = "image/gif";
      }

      // Check file size (Gemini has limits - 20MB for images, 2MB for PDFs)
      const fileSizeMB = fileData.length / (1024 * 1024);
      if (mimeType === "application/pdf" && fileSizeMB > 2) {
        return `Error: PDF file is too large (${fileSizeMB.toFixed(2)}MB). Maximum size is 2MB.`;
      }
      if (fileSizeMB > 20) {
        return `Error: File is too large (${fileSizeMB.toFixed(2)}MB). Maximum size is 20MB.`;
      }

      // Use Gemini model (auto-fallback if a model isn't available for this key)
      const modelName = await this.getWorkingVisionModelName();
      const model = this.genAI.getGenerativeModel({ model: modelName });

      const prompt = `Extract all text from this document/image. 
Preserve the structure, line breaks, and formatting as much as possible.
If the document contains text in multiple languages (like English, Hindi, Marathi, Tamil, etc.), extract text from all languages.
Return only the extracted text content, nothing else. Do not add explanations or comments.`;

      let extractedText = "";
      try {
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ]);
        const response = await result.response;
        extractedText = response.text();
      } catch (err) {
        // If the chosen model can't handle inlineData, retry once with a "pro" model.
        const retryModelName = "gemini-1.5-pro-latest";
        try {
          const retryModel = this.genAI.getGenerativeModel({
            model: retryModelName
          });
          const result2 = await retryModel.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]);
          const response2 = await result2.response;
          extractedText = response2.text();
          cachedWorkingVisionModel = retryModelName;
        } catch {
          throw err;
        }
      }

      // Return extracted text or fallback if empty
      if (!extractedText || extractedText.trim().length === 0) {
        return `No text could be extracted from this document. The image may be too blurry, contain no text, or the document format may not be supported.`;
      }

      return extractedText;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Gemini Vision OCR error:", error);

      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes("429")) {
          return `Error: API rate limit exceeded. Please wait a moment and try again.`;
        }
        if (error.message.includes("400")) {
          return `Error: Invalid file format or file is corrupted. Please try a different file.`;
        }
        if (error.message.includes("ENOENT")) {
          return `Error: File not found at path: ${req.filePath}`;
        }
        return `Error extracting text: ${error.message}`;
      }

      return `Error extracting text: Unknown error occurred. Please check your API key and try again.`;
    }
  }
}

