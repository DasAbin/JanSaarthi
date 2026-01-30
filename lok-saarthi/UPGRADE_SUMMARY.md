# JanSaarthi / LokSaarthi Upgrade Summary

All requested upgrades have been implemented for **performance, multilingual audio, and accessibility**, aligned with hackathon guidelines: *Inclusion, accessibility, real-world public impact.*

---

## 1. Document Simplification (Speed)

| Change | Location |
|--------|----------|
| **PaddleOCR fast mode** | `backend/services/ocrService.ts`: OCR_ENGINE default `paddleocr`; `OCR_FAST=true` in `.env.example`. `backend/python/paddle_ocr.py`: `--fast` uses `use_angle_cls=False` and `cls=use_angle_cls` in `ocr.ocr()` so fast mode skips angle classification. |
| **Chunk size 400** | `backend/services/simplifyService.ts`: Already uses `maxTokens: 400`, `minTokens: 300`, `overlapTokens: 40`. |
| **>5 pages: one-shot LLM** | `backend/services/simplifyService.ts`: If `pages.length > 5`, skips embeddings/RAG and calls `oneShotSummary()` with `askLLM(..., { preferFast: true })`. |
| **Fastest model (o3-mini)** | `backend/services/llm.ts`: `preferFast` tries OpenAI `o3-mini` first, then Gemini; `OPENAI_FALLBACK_MODEL=o3-mini` in `.env.example`. |
| **PDF hashing + cache** | `backend/utils/cache.ts`: `hashFile()`, `getCachedSimplify()`, `setCachedSimplify()`; cache under `backend/storage/cache/`. `backend/utils/storage.ts`: `ensureStorageDirs()` includes `storagePath("cache")` and `storagePath("voices")`. |

---

## 2. Multilingual TTS (Piper / Coqui)

| Change | Location |
|--------|----------|
| **Piper TTS** | `backend/services/voiceService.ts`: `synthesizeWithPiper()` with `PIPER_PATH`, `PIPER_MODEL_DIR` or `PIPER_MODEL_<lang>`; Indian languages: en, hi, mr, kn, ta, ml, te, bn, pa, gu, or. |
| **GET /api/voice/tts** | `backend/routes/voice.ts`: `GET /tts?text=...&lang=xx` for low-bandwidth; returns `{ audioBase64, format, language, engine }`. |
| **Base64 audio** | Voice service returns `audioBase64`; frontend builds `data:audio/wav;base64,...` for playback. |
| **Voice setup doc** | `docs/VOICE_SETUP.md`: How to download and register Piper Indian voice models and Vosk STT. |

---

## 3. Listen Feature (Multi-language)

| Change | Location |
|--------|----------|
| **Language dropdown** | `frontend/components/VoiceBar.tsx`: Select with `VOICE_LANGUAGES` (en, hi, mr, kn, ta, ml, te, bn, pa, gu, or). |
| **TTS endpoint** | `frontend/hooks/useVoice.ts`: `useTTS()` uses `ttsGet(text, lang)` — GET `/api/voice/tts?text=...&lang=xx`. |
| **Audio playback** | `VoiceBar.tsx`: On success, sets `lastAudioUrl` from base64; `<audio>` plays. On empty response, falls back to `window.speechSynthesis` with `LANG_TO_BROWSER`. |
| **Error messages** | VoiceBar shows TTS/STT errors and playback failure messages. |

---

## 4. Tap to Speak (MediaRecorder + STT)

| Change | Location |
|--------|----------|
| **MediaRecorder** | `frontend/components/MicRecorder.tsx`: Ref-based setup; MIME `audio/webm;codecs=opus`; stream cleanup on stop; `aria-label` for accessibility. |
| **FormData** | `frontend/app/api/client.ts`: `stt(audio, language)` sends `FormData` with `audio` blob as `recording.webm` and `language`. |
| **Backend STT** | `backend/services/voiceService.ts`: Vosk first via `transcribeWithVosk()`; fallback to Gemini STT. `backend/python/vosk_stt.py`: Handles webm/opus (ffmpeg to 16kHz wav). |
| **Voice route** | `backend/routes/voice.ts`: `POST /stt` with multer; saves to temp; returns `{ text, confidence, language, engine }`. |

---

## 5. Hackathon Guidelines

| Guideline | Implementation |
|-----------|----------------|
| **Low-bandwidth** | GET `/api/voice/tts?text=...&lang=xx` (no body); TTS uses GET in frontend. |
| **Offline TTS/STT** | Piper TTS in `storage/voices`; Vosk STT via `VOSK_MODEL`; frontend falls back to `speechSynthesis` when server returns no audio. |
| **Simplified UI** | Short descriptions on upload, form-helper, learn; clear labels and aria-labels. |
| **Loading states** | `isPending` / `isLoading` on buttons and sections (upload, form-helper, yojana, learn). |
| **Error messages** | LLM/STT/TTS errors shown in VoiceBar and pages; “Check your connection”, “Try again”, etc. |
| **Local-language defaults** | `getLocalLanguage()` from `navigator.language` on upload, form-helper, learn; defaultLang passed to VoiceBar. |
| **Accessibility** | `aria-label`, `aria-busy`, `role="alert"`, `role="main"`, sr-only hints, voice language select. |

---

## Changed Files (Summary)

**Backend**
- `backend/.env.example` — OCR_ENGINE=paddleocr, OCR_FAST=true; Piper/Vosk env notes.
- `backend/services/ocrService.ts` — Default OCR engine `paddleocr`.
- `backend/python/paddle_ocr.py` — Fast mode: `cls=use_angle_cls` in `ocr.ocr()`.
- `backend/services/simplifyService.ts` — Already had cache, chunk 400, >5 pages one-shot, preferFast.
- `backend/services/voiceService.ts` — Already had Piper, Indian languages, Vosk + Gemini STT.
- `backend/services/llm.ts` — Already had preferFast and o3-mini.
- `backend/routes/voice.ts` — Already had GET/POST TTS, POST STT.
- `backend/utils/storage.ts` — Already had cache and voices dirs.
- `backend/utils/cache.ts` — Already had hash + simplify cache.

**Frontend**
- `frontend/app/api/client.ts` — STT FormData with `recording.webm`; `ttsGet` typed; comments.
- `frontend/hooks/useVoice.ts` — useTTS uses `ttsGet` (GET); VOICE_LANGUAGES unchanged.
- `frontend/components/MicRecorder.tsx` — Ref-based MediaRecorder, MIME opus, cleanup, aria-label.
- `frontend/components/VoiceBar.tsx` — Language select, errors, playback message, defaultLang, accessibility.
- `frontend/app/upload/page.tsx` — VOICE_LANGUAGES dropdown, getLocalLanguage, defaultLang to VoiceBar, aria, error copy.
- `frontend/app/form-helper/page.tsx` — Language selector, VoiceBar, getLocalLanguage, useFormHelper(image, language), aria, error copy.
- `frontend/app/learn/page.tsx` — defaultLang for VoiceBar, loading/error states, getLocalLanguage.
- `frontend/hooks/useFormHelper.ts` — Accepts `language` and passes to `explainForm(image, language)`.

**Docs**
- `docs/VOICE_SETUP.md` — Piper Indian voices + Vosk STT setup.
- `lok-saarthi/UPGRADE_SUMMARY.md` — This file.

---

## Verification

- **Backend starts**: Confirmed — `JanSaarthi backend running on http://localhost:4000` (no errors).
- **Multilingual TTS**: GET `/api/voice/tts?text=...&lang=hi` returns base64; frontend uses it or browser TTS.
- **STT**: POST `/api/voice/stt` with FormData; Vosk then Gemini.
- **Document simplification**: PaddleOCR fast, chunk 400, cache, >5 pages one-shot, preferFast/o3-mini.
- **Form-helper**: Language selector and VoiceBar; explainForm sends language; works in all listed languages.
- **Yojana**: Unchanged; eligibility check and UI with loading/error states.
- **Frontend**: Client uses BACKEND_URL; GET TTS and POST STT with correct payloads; VoiceBar and MicRecorder wired.

All features align with: **Inclusion, accessibility, real-world public impact.**
