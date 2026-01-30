import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { storagePath } from "../utils/storage";
import { SimplifyService } from "../services/simplifyService";

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storagePath("pdfs")),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".pdf";
      cb(null, `${uuidv4()}${ext}`);
    }
  })
});

export const simplifyRouter = Router();
const simplify = new SimplifyService();

simplifyRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });
    const language = (req.body.language as string) || "en";

    const result = await simplify.simplifyDocument({
      filePath: req.file.path,
      originalName: req.file.originalname,
      language
    });

    return res.json(result);
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

