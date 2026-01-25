import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { OcrService } from "../services/ocrService";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "storage", "temp"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

export const ocrRouter = Router();
const ocrService = new OcrService();

ocrRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const language = (req.body.language as string) || "en";
    const text = await ocrService.extractText({
      filePath: req.file.path,
      language
    });

    return res.json({ text });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/ocr:", err);
    return res.status(500).json({ error: "Failed to run OCR" });
  }
});

