export interface STTRequest {
  audioPath: string;
  language: string;
}

export interface TTSRequest {
  text: string;
  languageCode: string;
  voiceId?: string;
}

export class VoiceService {
  // TODO: Integrate Vosk for offline STT.
  async speechToText(req: STTRequest): Promise<string> {
    // Placeholder: return a dummy transcript so frontend works.
    return `TRANSCRIPT_PLACEHOLDER for ${req.audioPath} (language=${req.language}). TODO: Wire Vosk STT.`;
  }

  // TODO: Integrate Google Cloud Text-to-Speech.
  async textToSpeech(
    req: TTSRequest
  ): Promise<{ audioUrl: string; info: string }> {
    // In production, call Google TTS and persist audio under storage/audio.
    return {
      audioUrl: "/static/temp/tts-placeholder.mp3",
      info: `TTS placeholder for "${req.text.slice(
        0,
        80
      )}..." (language=${req.languageCode})`
    };
  }
}

