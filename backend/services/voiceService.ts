import fs from "fs/promises";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { storagePath } from "../utils/storage";
import { askLLM } from "./llm";

/** Indian language codes supported for TTS (Piper/Google/browser). */
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
  engine: "gemini" | "vosk" | "fallback";
};

export type TtsRequest = {
  text: string;
  languageCode: string; // e.g., "en-IN", "hi-IN", "mr-IN"
};

export type TtsResponse = {
  audioBase64: string;
  format: string;
  language: string;
  engine: "piper" | "google" | "browser" | "fallback";
};

export class VoiceService {
  /**
   * Speech-to-Text: Vosk (offline, Hindi + regional) first, then Gemini.
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

    // 1) Try Vosk (offline STT) if VOSK_MODEL or VOSK_MODEL_DIR is set
    const voskText = await this.transcribeWithVosk(audioPath);
    if (voskText !== null && voskText.trim().length > 0) {
      return {
        text: voskText.trim(),
        confidence: 0.9,
        language,
        engine: "vosk"
      };
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

  /** Vosk STT via Python script. Returns null if Vosk not configured or fails. */
  private async transcribeWithVosk(audioPath: string): Promise<string | null> {
    const modelPath = process.env.VOSK_MODEL || process.env.VOSK_MODEL_DIR;
    if (!modelPath) return null;
    const pathModule = await import("path");
    const script = pathModule.join(process.cwd(), "python", "vosk_stt.py");
    try {
      await fs.access(script);
    } catch {
      return null;
    }
    const { spawn } = await import("child_process");
    const python = process.env.PYTHON || "python";
    return new Promise((resolve) => {
      const child = spawn(python, [script, "--input", audioPath], {
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", () => resolve(null));
      child.on("exit", (code) => {
        if (code !== 0) {
          resolve(null);
          return;
        }
        try {
          const json = JSON.parse(stdout) as { text?: string };
          resolve(json.text || null);
        } catch {
          resolve(null);
        }
      });
    });
  }

  /**
   * Text-to-Speech: Piper (offline) first, then Google Cloud TTS, else browser fallback.
   * Supports Indian languages: Marathi, Kannada, Tamil, Malayalam, Telugu, Bengali, Punjabi, Gujarati, Odia.
   */
  async textToSpeech(req: TtsRequest): Promise<TtsResponse> {
    const { text, languageCode } = req;
    const lang = (languageCode || "en-IN").replace(/-IN$/i, "").toLowerCase();

    if (!text || text.trim().length === 0) {
      return {
        audioBase64: "",
        format: "audio/wav",
        language: languageCode,
        engine: "fallback"
      };
    }

    // 1) Piper TTS (offline, no API key) — set PIPER_PATH and PIPER_MODEL_DIR or PIPER_MODEL_<LANG>
    try {
      const piperBase64 = await this.synthesizeWithPiper(text, lang);
      if (piperBase64) {
        return {
          audioBase64: piperBase64,
          format: "audio/wav",
          language: languageCode,
          engine: "piper"
        };
      }
    } catch (error) {
      console.error("[VoiceService] Piper TTS error:", error);
    }

    // 2) Google Cloud TTS (if configured)
    const googleCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (googleCredentials) {
      try {
        const audioBase64 = await this.synthesizeWithGoogleTts(text, languageCode);
        return {
          audioBase64,
          format: "audio/mp3",
          language: languageCode,
          engine: "google"
        };
      } catch (error) {
        console.error("[VoiceService] Google TTS error:", error);
      }
    }

    // 3) Return empty — frontend uses browser TTS (offline fallback)
    return {
      audioBase64: "",
      format: "audio/wav",
      language: languageCode,
      engine: "browser"
    };
  }

  /**
   * Piper TTS: spawn piper binary. Set PIPER_PATH (binary) and PIPER_MODEL_DIR or PIPER_MODEL_<lang> (path to .onnx).
   * Indian voices: place .onnx models in storage/voices/<lang>/ or set PIPER_MODEL_hi, PIPER_MODEL_ta, etc.
   */
  private async synthesizeWithPiper(text: string, langCode: string): Promise<string | null> {
    const piperPath = process.env.PIPER_PATH || "piper";
    const modelDir = process.env.PIPER_MODEL_DIR || storagePath("voices");
    const envKey = `PIPER_MODEL_${langCode.replace("-", "_").toUpperCase()}`;
    const explicitModel = process.env[envKey];
    let modelPath = explicitModel || path.join(modelDir, langCode, "model.onnx");
    try {
      await fs.access(modelPath);
    } catch {
      // Try en as fallback for Piper
      if (langCode !== "en") {
        modelPath = process.env.PIPER_MODEL_EN || path.join(modelDir, "en", "model.onnx");
        try {
          await fs.access(modelPath);
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }
    const outWav = path.join(process.env.TMPDIR || os.tmpdir(), `piper_${Date.now()}.wav`);
    return new Promise((resolve, reject) => {
      const child = spawn(piperPath, ["--model", modelPath, "--output_file", outWav], {
        stdio: ["pipe", "pipe", "pipe"]
      });
      child.stdin.write(text, () => child.stdin.end());
      let stderr = "";
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", (err) => reject(err));
      child.on("exit", async (code) => {
        try {
          if (code === 0) {
            const buf = await fs.readFile(outWav);
            await fs.unlink(outWav).catch(() => {});
            resolve(buf.toString("base64"));
          } else {
            reject(new Error(`Piper exited ${code}: ${stderr}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  private async synthesizeWithGoogleTts(text: string, languageCode: string): Promise<string> {
    try {
      // Dynamic import to avoid errors if package not installed
      const textToSpeech = await import("@google-cloud/text-to-speech");
      const client = new textToSpeech.TextToSpeechClient();

      // Map language code to Google TTS voice
      const voiceConfig = this.getVoiceConfig(languageCode);

      const [response] = await client.synthesizeSpeech({
        input: { text },
        voice: voiceConfig,
        audioConfig: { audioEncoding: "MP3" }
      });

      if (response.audioContent) {
        return Buffer.from(response.audioContent).toString("base64");
      }
      return "";
    } catch (error) {
      console.error("[VoiceService] Google TTS synthesis error:", error);
      throw error;
    }
  }

  private getVoiceConfig(languageCode: string): { languageCode: string; name: string; ssmlGender: "FEMALE" | "MALE" } {
    const lang = languageCode.toLowerCase();
    
    if (lang.startsWith("hi")) {
      return { languageCode: "hi-IN", name: "hi-IN-Wavenet-A", ssmlGender: "FEMALE" };
    }
    if (lang.startsWith("mr")) {
      return { languageCode: "mr-IN", name: "mr-IN-Wavenet-A", ssmlGender: "FEMALE" };
    }
    if (lang.startsWith("ta")) {
      return { languageCode: "ta-IN", name: "ta-IN-Wavenet-A", ssmlGender: "FEMALE" };
    }
    if (lang.startsWith("te")) {
      return { languageCode: "te-IN", name: "te-IN-Standard-A", ssmlGender: "FEMALE" };
    }
    if (lang.startsWith("bn")) {
      return { languageCode: "bn-IN", name: "bn-IN-Wavenet-A", ssmlGender: "FEMALE" };
    }
    if (lang.startsWith("gu")) {
      return { languageCode: "gu-IN", name: "gu-IN-Wavenet-A", ssmlGender: "FEMALE" };
    }
    if (lang.startsWith("kn")) {
      return { languageCode: "kn-IN", name: "kn-IN-Wavenet-A", ssmlGender: "FEMALE" };
    }
    if (lang.startsWith("ml")) {
      return { languageCode: "ml-IN", name: "ml-IN-Wavenet-A", ssmlGender: "FEMALE" };
    }
    if (lang.startsWith("pa")) {
      return { languageCode: "pa-IN", name: "pa-IN-Wavenet-A", ssmlGender: "FEMALE" };
    }
    if (lang.startsWith("or")) {
      return { languageCode: "or-IN", name: "or-IN-Wavenet-A", ssmlGender: "FEMALE" };
    }
    // Default: English India
    return { languageCode: "en-IN", name: "en-IN-Wavenet-A", ssmlGender: "FEMALE" };
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
