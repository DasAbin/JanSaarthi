# JanSaarthi Full Audit & Repair Report

## 1. Files Scanned

### Backend
- `server.ts` – Express entry, routes, CORS, static, port fallback, shutdown
- `services/llm.ts` – Single LLM entry (Gemini + OpenAI fallback)
- `services/geminiService.ts` – Wrapper over askLLM
- `services/ocrService.ts` – OCR (PaddleOCR / Gemini Vision via geminiService)
- `services/ragService.ts` – RAG + askLLM for summarization
- `services/simplifyService.ts` – OCR → clean → chunk → RAG → summary
- `services/yojanaService.ts` – Schemes + askLLM for eligibility
- `services/formService.ts` – OCR + askLLM for form fields
- `services/voiceService.ts` – STT/TTS (askLLM for STT)
- `services/embeddings.ts` – Bag-of-words embeddings + re-export geminiService
- `services/learnService.ts` – List/get modules from JSON
- `routes/ocr.ts`, `simplify.ts`, `yojana.ts`, `formHelper.ts`, `voice.ts`, `learn.ts`
- `utils/storage.ts`, `cleaner.ts`, `chunker.ts`, `textProcessing.ts`
- `.env.example`

### Frontend
- `app/api/client.ts` – API client (simplify, yojana, form-helper, learn, voice)
- `app/upload/page.tsx` – Document simplify (file + language)
- `app/simplify/page.tsx` – Redirect to upload
- `app/yojana/page.tsx` – YojanaMatch form + results
- `app/form-helper/page.tsx` – Form image upload + fields table
- `app/learn/page.tsx` – Modules list + lessons + VoiceBar
- `hooks/useSimplifyDocument.ts`, `useYojanaMatch.ts`, `useFormHelper.ts`, `useLearnModule.ts`, `useVoice.ts`
- `components/VoiceBar.tsx`, `MicRecorder.tsx`

---

## 2. Fixes Applied

### Backend
| File | Fix |
|------|-----|
| `server.ts` | Moved `dotenv.config()` to top; added port fallback to 5000 on EADDRINUSE; added SIGTERM/SIGINT shutdown |
| `services/llm.ts` | Default `OPENAI_FALLBACK_MODEL` set to `o3-mini`; added gpt-4o-mini retry when o3-mini fails or returns empty |
| `.env.example` | Documented `OPENAI_FALLBACK_MODEL=o3-mini` |

### Frontend
| File | Fix |
|------|-----|
| `app/yojana/page.tsx` | Use `data?.results` (backend returns `{ results, profileSummary }`); use `item.reasons` instead of `item.explanation`; score as number; added `isError`/`error` display |
| `app/form-helper/page.tsx` | Added `isError`/`error` display |
| `app/upload/page.tsx` | Added `isError`/`error` display |
| `app/api/client.ts` | Added `listModules()` (GET /api/learn); `explainForm(image, language)` with optional language |
| `app/learn/page.tsx` | Fetch modules via `listModules()`; use `modules` from API; sync `selected` when modules load |
| `hooks/useVoice.ts` | TTS maps `audioBase64` to `audioUrl` (`data:audio/mp3;base64,...`) for playback |

### No changes needed (verified)
- All backend services use `askLLM()` or `geminiService` (which uses askLLM); no direct Gemini client in services
- All routes validate input, call correct service, return JSON, have try/catch with [API ERROR]
- `backend/src/` is legacy and not loaded by `server.ts` (server uses `./routes` and `./services`)

---

## 3. Updated Files List

- `backend/server.ts`
- `backend/services/llm.ts`
- `backend/.env.example`
- `frontend/app/yojana/page.tsx`
- `frontend/app/form-helper/page.tsx`
- `frontend/app/upload/page.tsx`
- `frontend/app/api/client.ts`
- `frontend/app/learn/page.tsx`
- `frontend/hooks/useVoice.ts`

---

## 4. Verification

- **Backend TypeScript**: `npx tsc --noEmit` passes.
- **Backend start**: Run `npm run dev` in `backend/` – server listens on 4000 (or 5000 if 4000 in use).
- **APIs**: All return JSON; routes have validation and error handling.
- **LLM**: Single entry `askLLM()` in `llm.ts`; Gemini via ListModels or GEMINI_MODEL; OpenAI fallback o3-mini → gpt-4o-mini when key is valid.
- **OCR + RAG**: simplifyService: OCR → clean → chunk → RAG addChunks → summarizeFromChunks (askLLM) → clearCollection; ragService uses askLLM for JSON summary.
- **Scheme matching**: yojanaService loads schemes.json, uses askLLM for eligibility JSON per scheme, returns top 5.
- **Form helper**: formService: OCR → askLLM (JSON) for fields; returns title, description, fields, tips.
- **Voice**: STT uses askLLM with audio base64; TTS uses Google TTS or returns empty; frontend builds audio URL from audioBase64 for playback.
- **Learn**: GET /api/learn returns { modules }; GET /api/learn/:moduleId returns module; frontend lists modules and fetches selected module.

---

## 5. Run Instructions

```bash
# Backend
cd lok-saarthi/backend
cp .env.example .env   # then set GEMINI_API_KEY, optionally OPENAI_API_KEY
npm install
npm run dev            # http://localhost:4000 or 5000

# Frontend (separate terminal)
cd lok-saarthi/frontend
npm install
npm run dev            # http://localhost:3000
```

Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000` (or 5000) in frontend `.env` if backend is not on 4000.
