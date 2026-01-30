/** Indian language codes supported for TTS (Piper/Google/browser). */
export declare const TTS_LANGUAGES: readonly [{
    readonly code: "en";
    readonly name: "English";
}, {
    readonly code: "hi";
    readonly name: "हिंदी (Hindi)";
}, {
    readonly code: "mr";
    readonly name: "मराठी (Marathi)";
}, {
    readonly code: "kn";
    readonly name: "ಕನ್ನಡ (Kannada)";
}, {
    readonly code: "ta";
    readonly name: "தமிழ் (Tamil)";
}, {
    readonly code: "ml";
    readonly name: "മലയാളം (Malayalam)";
}, {
    readonly code: "te";
    readonly name: "తెలుగు (Telugu)";
}, {
    readonly code: "bn";
    readonly name: "বাংলা (Bengali)";
}, {
    readonly code: "pa";
    readonly name: "ਪੰਜਾਬੀ (Punjabi)";
}, {
    readonly code: "gu";
    readonly name: "ગુજરાતી (Gujarati)";
}, {
    readonly code: "or";
    readonly name: "ଓଡ଼ିଆ (Odia)";
}];
export type SttRequest = {
    audioPath: string;
    language: string;
};
export type SttResponse = {
    text: string;
    confidence: number;
    language: string;
    engine: "gemini" | "vosk" | "fallback";
};
export type TtsRequest = {
    text: string;
    languageCode: string;
};
export type TtsResponse = {
    audioBase64: string;
    format: string;
    language: string;
    engine: "piper" | "google" | "browser" | "fallback";
};
export declare class VoiceService {
    /**
     * Speech-to-Text: Vosk (offline, Hindi + regional) first, then Gemini.
     */
    speechToText(req: SttRequest): Promise<SttResponse>;
    /** Vosk STT via Python script. Returns null if Vosk not configured or fails. */
    private transcribeWithVosk;
    /**
     * Text-to-Speech: Piper (offline) first, then Google Cloud TTS, else browser fallback.
     * Supports Indian languages: Marathi, Kannada, Tamil, Malayalam, Telugu, Bengali, Punjabi, Gujarati, Odia.
     */
    textToSpeech(req: TtsRequest): Promise<TtsResponse>;
    /**
     * Piper TTS: spawn piper binary. Set PIPER_PATH (binary) and PIPER_MODEL_DIR or PIPER_MODEL_<lang> (path to .onnx).
     * Indian voices: place .onnx models in storage/voices/<lang>/ or set PIPER_MODEL_hi, PIPER_MODEL_ta, etc.
     */
    private synthesizeWithPiper;
    private synthesizeWithGoogleTts;
    private getVoiceConfig;
    private getLanguageName;
}
