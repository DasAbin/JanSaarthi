import path from "path";
import fs from "fs/promises";
import { Cleaner } from "../utils/cleaner";
import { storagePath } from "../utils/storage";
import { geminiService } from "./geminiService";
import { spawn } from "child_process";

export type OcrPage = {
  pageNumber: number;
  text: string;
};

export type OcrResult = {
  rawText: string;
  cleanedText: string;
  pages: OcrPage[];
  engine: "paddleocr" | "gemini_vision";
};

export type OcrRequest = {
  filePath: string;
  language: string; // e.g. en, hi, mr
};

function pythonExecutable(): string {
  return process.env.PYTHON || "python";
}

function mapLangToPaddle(lang: string): string {
  const l = (lang || "en").toLowerCase();
  if (l.startsWith("en")) return "en";
  if (l.startsWith("hi")) return "hi";
  if (l.startsWith("mr")) return "mr";
  return "en";
}

async function runPaddleOcr(filePath: string, language: string): Promise<OcrPage[]> {
  const script = path.join(process.cwd(), "python", "paddle_ocr.py");
  
  // Check if script exists
  try {
    await fs.access(script);
  } catch {
    throw new Error("PaddleOCR script not found. Using Gemini Vision fallback.");
  }

  const outJson = storagePath("temp", `${path.basename(filePath)}.ocr.json`);
  await fs.mkdir(path.dirname(outJson), { recursive: true });

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
  if (fastMode) args.push("--fast");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(pythonExecutable(), args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      reject(new Error(`Failed to spawn Python: ${err.message}`));
    });
    child.on("exit", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`PaddleOCR failed (code=${code}): ${stderr}`));
    });
  });

  const raw = await fs.readFile(outJson, "utf-8");
  const json = JSON.parse(raw) as { pages: OcrPage[] };
  return Array.isArray(json.pages) ? json.pages : [];
}

export class OcrService {
  private cleaner = new Cleaner();

  async extractText(req: OcrRequest): Promise<OcrResult> {
    await fs.access(req.filePath);
    const wantsPaddle = (process.env.OCR_ENGINE || "paddleocr").toLowerCase() === "paddleocr";

    // Try PaddleOCR if configured
    if (wantsPaddle) {
      try {
        const pages = await runPaddleOcr(req.filePath, req.language);
        const rawText = pages.map((p) => p.text).join("\n\n");
        const cleanedText = this.cleaner.clean(rawText);
        return { rawText, cleanedText, pages, engine: "paddleocr" };
      } catch (e) {
        console.error("PaddleOCR failed, falling back to Gemini Vision:", e);
      }
    }

    // Gemini Vision (default and fallback)
    const extracted = await geminiService.extractTextFromImage(req.filePath, req.language);
    const pages: OcrPage[] = [{ pageNumber: 1, text: extracted }];
    const rawText = extracted;
    const cleanedText = this.cleaner.clean(rawText);
    return { rawText, cleanedText, pages, engine: "gemini_vision" };
  }
}
