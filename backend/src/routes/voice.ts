import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { VoiceService } from "../services/voiceService";

const uploadDir = path.join(__dirname, "..", "storage", "temp");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".wav";
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

export const voiceRouter = Router();
const voiceService = new VoiceService();

voiceRouter.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    const language = (req.body.language as string) || "en-IN";

    const text = await voiceService.speechToText({
      audioPath: req.file.path,
      language
    });

    return res.json({ text });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/voice/stt:", err);
    return res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

voiceRouter.post("/tts", async (req, res) => {
  try {
    const { text, languageCode, voiceId } = req.body as {
      text: string;
      languageCode?: string;
      voiceId?: string;
    };

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const audioResult = await voiceService.textToSpeech({
      text,
      languageCode: languageCode || "en-IN",
      voiceId
    });

    return res.json(audioResult);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/voice/tts:", err);
    return res.status(500).json({ error: "Failed to synthesize speech" });
  }
});

