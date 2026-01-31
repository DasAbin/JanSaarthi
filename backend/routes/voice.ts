import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { storagePath } from "../utils/storage";
import { VoiceService } from "../services/voiceService";

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storagePath("temp")),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".webm";
      cb(null, `${uuidv4()}${ext}`);
    }
  })
});

export const voiceRouter = Router();
const voice = new VoiceService();

voiceRouter.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "audio is required" });
    const language = (req.body.language as string) || "en-IN";
    const out = await voice.speechToText({
      audioPath: req.file.path,
      language
    });
    return res.json(out);
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/voice/tts?text=...&lang=xx — for low-bandwidth (no body); returns base64 audio
voiceRouter.get("/tts", async (req, res) => {
  try {
    const text = (req.query.text as string) || "";
    const lang = (req.query.lang as string) || req.query.languageCode as string || "en";
    if (!text.trim()) return res.status(400).json({ error: "text is required" });
    const languageCode = lang.includes("-") ? lang : `${lang}-IN`;
    const out = await voice.textToSpeech({ text: text.trim(), languageCode });
    return res.json(out);
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

voiceRouter.post("/tts", async (req, res) => {
  try {
    const { text, languageCode, lang } = (req.body || {}) as {
      text?: string;
      languageCode?: string;
      lang?: string;
    };
    if (!text) return res.status(400).json({ error: "text is required" });
    const code = languageCode || (lang ? (lang.includes("-") ? lang : `${lang}-IN`) : "en-IN");
    const out = await voice.textToSpeech({ text, languageCode: code });
    return res.json(out);
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

