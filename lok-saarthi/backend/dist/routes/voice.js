"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const storage_1 = require("../utils/storage");
const voiceService_1 = require("../services/voiceService");
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, (0, storage_1.storagePath)("temp")),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname) || ".webm";
            cb(null, `${(0, uuid_1.v4)()}${ext}`);
        }
    })
});
exports.voiceRouter = (0, express_1.Router)();
const voice = new voiceService_1.VoiceService();
exports.voiceRouter.post("/stt", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: "audio is required" });
        const language = req.body.language || "en-IN";
        const out = await voice.speechToText({
            audioPath: req.file.path,
            language
        });
        return res.json(out);
    }
    catch (err) {
        console.error("[API ERROR]", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// GET /api/voice/tts?text=...&lang=xx — for low-bandwidth (no body); returns base64 audio
exports.voiceRouter.get("/tts", async (req, res) => {
    try {
        const text = req.query.text || "";
        const lang = req.query.lang || req.query.languageCode || "en";
        if (!text.trim())
            return res.status(400).json({ error: "text is required" });
        const languageCode = lang.includes("-") ? lang : `${lang}-IN`;
        const out = await voice.textToSpeech({ text: text.trim(), languageCode });
        return res.json(out);
    }
    catch (err) {
        console.error("[API ERROR]", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.voiceRouter.post("/tts", async (req, res) => {
    try {
        const { text, languageCode, lang } = (req.body || {});
        if (!text)
            return res.status(400).json({ error: "text is required" });
        const code = languageCode || (lang ? (lang.includes("-") ? lang : `${lang}-IN`) : "en-IN");
        const out = await voice.textToSpeech({ text, languageCode: code });
        return res.json(out);
    }
    catch (err) {
        console.error("[API ERROR]", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
//# sourceMappingURL=voice.js.map