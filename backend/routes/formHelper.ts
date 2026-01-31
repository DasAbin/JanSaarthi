import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { storagePath } from "../utils/storage";
import { FormService } from "../services/formService";

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storagePath("forms")),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".png";
      cb(null, `${uuidv4()}${ext}`);
    }
  })
});

export const formHelperRouter = Router();
const forms = new FormService();

formHelperRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "image is required" });
    const language = (req.body.language as string) || "en";
    const result = await forms.explainForm({
      imagePath: req.file.path,
      language
    });
    return res.json(result);
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

