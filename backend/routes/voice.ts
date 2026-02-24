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
    const language = (req.body.language as string) || "hi-IN";
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

// POST /api/voice/transcribe — alias for /stt (Silero STT)
voiceRouter.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "audio is required" });
    const language = (req.body.language as string) || (req.body.lang as string) || "hi-IN";
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

// POST /api/voice/listen — TTS endpoint (Indic-Parler-TTS)
voiceRouter.post("/listen", async (req, res) => {
  try {
    const { text, lang, languageCode, selectedLanguage } = (req.body || {}) as {
      text?: string;
      lang?: string;
      languageCode?: string;
      selectedLanguage?: string;
    };
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    // Limit text length to prevent issues (1000 chars max for TTS)
    const trimmedText = text.trim().slice(0, 1000);
    
    const langCode = languageCode || 
                     (lang ? (lang.includes("-") ? lang : `${lang}-IN`) : null) ||
                     (selectedLanguage ? (selectedLanguage.includes("-") ? selectedLanguage : `${selectedLanguage}-IN`) : null) ||
                     "hi-IN";
    
    const out = await voice.textToSpeech({ text: trimmedText, languageCode: langCode });
    
    // Return 200 with empty audioBase64 if TTS fails (allows frontend fallback)
    return res.status(200).json({
      audioBase64: out.audioBase64 || "",
      format: out.format || "audio/wav",
      language: out.language || langCode,
      engine: out.engine || "fallback"
    });
  } catch (err) {
    console.error("[API ERROR]", err);
    // Return 200 with empty audioBase64 on error (allows frontend fallback)
    return res.status(200).json({
      audioBase64: "",
      format: "audio/wav",
      language: (req.body?.lang || req.body?.languageCode || "hi-IN"),
      engine: "fallback"
    });
  }
});

// GET /api/voice/tts?text=...&lang=xx — for low-bandwidth (no body); returns base64 audio
voiceRouter.get("/tts", async (req, res) => {
  try {
    // URL decode the text parameter (it comes URL-encoded)
    let text = (req.query.text as string) || "";
    try {
      text = decodeURIComponent(text);
    } catch {
      // If decoding fails, use as-is
    }
    
    const lang = (req.query.lang as string) || 
                 (req.query.languageCode as string) || 
                 (req.query.selectedLanguage as string) || 
                 "hi";
    
    if (!text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }
    
    // Limit text length to prevent issues (1000 chars max for TTS)
    const trimmedText = text.trim().slice(0, 1000);
    
    const languageCode = lang.includes("-") ? lang : `${lang}-IN`;
    const out = await voice.textToSpeech({ text: trimmedText, languageCode });
    
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

