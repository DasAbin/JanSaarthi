import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { SimplifyService } from "../services/simplifyService";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "storage", "pdfs"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

export const simplifyRouter = Router();
const simplifyService = new SimplifyService();

simplifyRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const language = (req.body.language as string) || "en";
    const mode = (req.body.mode as string) || "default";

    const result = await simplifyService.simplifyDocument({
      filePath: req.file.path,
      originalName: req.file.originalname,
      language,
      mode
    });

    return res.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/simplify:", err);
    return res.status(500).json({ error: "Failed to simplify document" });
  }
});

