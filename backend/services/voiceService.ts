import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { askLLM } from "./llm";

/** Indian language codes supported for TTS (Indic-Parler-TTS). */
export const TTS_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी (Hindi)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "or", name: "ଓଡ଼ିଆ (Odia)" }
] as const;

export type SttRequest = {
  audioPath: string;
  language: string; // e.g., "en-IN", "hi-IN", "mr-IN"
};

export type SttResponse = {
  text: string;
  confidence: number;
  language: string;
  engine: "silero" | "gemini" | "fallback";
};

export type TtsRequest = {
  text: string;
  languageCode: string; // e.g., "en-IN", "hi-IN", "mr-IN"
};

export type TtsResponse = {
  audioBase64: string;
  format: string;
  language: string;
  engine: "parler" | "browser" | "fallback";
};

export class VoiceService {
  /**
   * Get Python executable path, resolving relative paths from backend/ directory.
   */
  private getPythonPath(): string {
    const raw = process.env.PYTHON || "python";
    // Use as-is if it's just "python" (system PATH) or already absolute
    if (raw === "python" || path.isAbsolute(raw)) return raw;
    // Resolve relative path from current working directory (backend/)
    return path.resolve(process.cwd(), raw);
  }

  /**
   * Speech-to-Text: Silero STT (local, free) first, then Gemini fallback.
   */
  async speechToText(req: SttRequest): Promise<SttResponse> {
    const { audioPath, language } = req;

    try {
      await fs.access(audioPath);
    } catch {
      return {
        text: "Audio file not found.",
        confidence: 0,
        language,
        engine: "fallback"
      };
    }

    // 1) Try Silero STT (local, free, multilingual)
    try {
      const sileroText = await this.transcribeWithSilero(audioPath);
      if (sileroText !== null && sileroText.trim().length > 0) {
        return {
          text: sileroText.trim(),
          confidence: 0.9,
          language,
          engine: "silero"
        };
      }
    } catch (error) {
      console.error("[VoiceService] Silero STT error:", error);
    }

    // 2) Gemini-based transcription (fallback)
    try {
      const audioData = await fs.readFile(audioPath);
      const base64Audio = audioData.toString("base64");
      const ext = path.extname(audioPath).toLowerCase();
      let mimeType = "audio/webm";
      if (ext === ".wav") mimeType = "audio/wav";
      else if (ext === ".mp3") mimeType = "audio/mp3";
      else if (ext === ".ogg") mimeType = "audio/ogg";
      else if (ext === ".m4a") mimeType = "audio/mp4";

      const languageName = this.getLanguageName(language);
      const prompt = `Transcribe this audio recording. The audio is in ${languageName}. Return ONLY the transcribed text, nothing else. If you cannot understand the audio, return "[Audio unclear]".`;
      const text = await askLLM(prompt, { imageBase64: base64Audio, mimeType });

      return {
        text,
        confidence: text.length > 0 ? 0.85 : 0,
        language,
        engine: "gemini"
      };
    } catch (error) {
      console.error("[VoiceService] STT error:", error);
      return {
        text: "Unable to transcribe audio. Please try again or type your message.",
        confidence: 0,
        language,
        engine: "fallback"
      };
    }
  }

  /** Silero STT via Python script. Returns null if fails. */
  private async transcribeWithSilero(audioPath: string): Promise<string | null> {
    const scriptPath = path.join(process.cwd(), "python", "stt_silero.py");
    try {
      await fs.access(scriptPath);
    } catch {
      console.warn("[VoiceService] Silero STT script not found:", scriptPath);
      return null;
    }

    const python = this.getPythonPath();
    return new Promise((resolve) => {
      const child = spawn(python, [scriptPath, audioPath], {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: path.join(process.cwd(), "python")
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", (err) => {
        console.error("[VoiceService] Silero STT spawn error:", err);
        resolve(null);
      });
      child.on("exit", (code) => {
        if (code !== 0) {
          console.error(`[VoiceService] Silero STT exited with code ${code}: ${stderr}`);
          resolve(null);
          return;
        }
        const text = stdout.trim();
        resolve(text || null);
      });
    });
  }

  /**
   * Text-to-Speech: Indic-Parler-TTS (local, free) first, else browser fallback.
   * Supports Indian languages: hi, bn, ta, te, kn, ml, mr, gu, or, pa.
   */
  async textToSpeech(req: TtsRequest): Promise<TtsResponse> {
    const { text, languageCode } = req;
    const lang = (languageCode || "hi-IN").replace(/-IN$/i, "").toLowerCase();

    if (!text || text.trim().length === 0) {
      return {
        audioBase64: "",
        format: "audio/wav",
        language: languageCode,
        engine: "fallback"
      };
    }

    // 1) Indic-Parler-TTS (local, free, offline)
    try {
      const parlerBase64 = await this.generateParlerTTS(text, lang);
      if (parlerBase64) {
        return {
          audioBase64: parlerBase64,
          format: "audio/wav",
          language: languageCode,
          engine: "parler"
        };
      }
    } catch (error) {
      console.error("[VoiceService] Indic-Parler-TTS error:", error);
    }

    // 2) Return empty — frontend uses browser TTS (offline fallback)
    return {
      audioBase64: "",
      format: "audio/wav",
      language: languageCode,
      engine: "browser"
    };
  }

  /**
   * Generate TTS using Indic-Parler-TTS Python script.
   * Returns base64-encoded WAV audio or null on failure.
   */
  private async generateParlerTTS(text: string, langCode: string): Promise<string | null> {
    const scriptPath = path.join(process.cwd(), "python", "indic_tts.py");
    try {
      await fs.access(scriptPath);
    } catch {
      console.warn("[VoiceService] Indic-Parler-TTS script not found:", scriptPath);
      return null;
    }

    const python = this.getPythonPath();
    return new Promise((resolve) => {
      // Pass text as-is (spawn handles arguments correctly)
      const child = spawn(python, [scriptPath, text, langCode], {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: path.join(process.cwd(), "python")
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", (err) => {
        console.error("[VoiceService] Indic-Parler-TTS spawn error:", err);
        resolve(null);
      });
      child.on("exit", (code) => {
        if (code !== 0) {
          console.error(`[VoiceService] Indic-Parler-TTS exited with code ${code}: ${stderr}`);
          resolve(null);
          return;
        }
        const base64Audio = stdout.trim();
        resolve(base64Audio || null);
      });
    });
  }

  private getLanguageName(code: string): string {
    const lang = code.toLowerCase().replace(/-in$/i, "");
    if (lang.startsWith("hi")) return "Hindi";
    if (lang.startsWith("mr")) return "Marathi";
    if (lang.startsWith("ta")) return "Tamil";
    if (lang.startsWith("te")) return "Telugu";
    if (lang.startsWith("bn")) return "Bengali";
    if (lang.startsWith("gu")) return "Gujarati";
    if (lang.startsWith("kn")) return "Kannada";
    if (lang.startsWith("ml")) return "Malayalam";
    if (lang.startsWith("pa")) return "Punjabi";
    if (lang.startsWith("or")) return "Odia";
    return "English";
  }
}
