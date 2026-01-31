# Multilingual TTS & STT Setup (Piper + Vosk)

For **inclusion, accessibility, and offline/low-bandwidth use**, LokSaarthi uses Piper TTS and Vosk STT. Indian voice models can be downloaded and placed in `backend/storage/` for offline fallback.

## TTS: Piper (Indian languages)

1. **Install Piper** (or use Coqui TTS if you prefer):
   - Binary: https://github.com/rhasspy/piper/releases
   - Set `PIPER_PATH` in `.env` if not in PATH.

2. **Download Indian voice models** (ONNX format):
   - Hindi: https://huggingface.co/rhasspy/piper-voices/tree/main
   - Search for `hi_IN`, `mr_IN`, `ta_IN`, `te_IN`, `bn_IN`, `gu_IN`, `kn_IN`, `ml_IN`, `pa_IN`, `or_IN`.
   - Example: `hi_IN` - download the folder and place `model.onnx` + `config.json` in:
     - `backend/storage/voices/hi/model.onnx`
     - `backend/storage/voices/hi/config.json`
   - Repeat for each language: `storage/voices/<lang>/model.onnx`.

3. **Environment** (optional):
   - `PIPER_PATH=piper` (or full path to piper binary)
   - `PIPER_MODEL_DIR=storage/voices` (default)
   - Or per language: `PIPER_MODEL_hi=path/to/hi/model.onnx`

4. **API**: `GET /api/voice/tts?text=...&lang=hi` returns `{ audioBase64, format: "audio/wav", engine: "piper" }`. If no Piper model, backend returns empty base64 and frontend uses **browser TTS** (offline fallback).

## STT: Vosk (Hindi + regional)

1. **Download a Vosk model** (e.g. Hindi small):
   - https://alphacephei.com/vosk/models
   - Example: `vosk-model-small-hi-0.22` (Hindi).

2. **Unzip** and set in `.env`:
   - `VOSK_MODEL=path/to/vosk-model-small-hi-0.22`
   - Or `VOSK_MODEL_DIR=path/to/models`

3. **API**: `POST /api/voice/stt` with `multipart/form-data`: `audio` (webm/opus) and `language`. Backend runs Vosk first; if unavailable or empty, falls back to **Gemini STT**.

## Hackathon alignment

- **Low-bandwidth**: Use `GET /api/voice/tts?text=...&lang=xx` (no request body).
- **Offline TTS**: Piper in `storage/voices`; else browser `speechSynthesis`.
- **Offline STT**: Vosk; else Gemini when online.
- **Accessibility**: Language dropdown and Tap to Speak on all relevant pages; error messages for LLM/STT/TTS.
