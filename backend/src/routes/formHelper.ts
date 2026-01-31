import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { FormService } from "../services/formService";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "storage", "forms"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

export const formHelperRouter = Router();
const formService = new FormService();

formHelperRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const language = (req.body.language as string) || "en";

    const result = await formService.explainForm({
      imagePath: req.file.path,
      originalName: req.file.originalname,
      language
    });

    return res.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/form-helper:", err);
    return res.status(500).json({ error: "Failed to process form" });
  }
});

