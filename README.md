## JanSaarthi – AI-powered Civic Access Platform

This repository contains the full-stack implementation of **JanSaarthi**, a voice-first, low-bandwidth platform that simplifies government documents, explains forms, identifies scheme eligibility, and teaches essential skills in local languages.

### 🚀 Quick Start

**Get running in 3 steps:**

```bash
# 1. Setup Backend
cd backend
npm install
npm run dev  # Runs on http://localhost:4000

# 2. Setup Frontend (in a new terminal)
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000

# 3. Open browser
# Visit: http://localhost:3000
```

**📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)**

### Problem Statement

Citizens, especially in rural and low-connectivity regions, struggle to:
- Understand complex government documents and forms.
- Discover and evaluate eligibility for government schemes.
- Learn essential civic and financial skills in their own language and via voice.

### Solution Summary

JanSaarthi provides:
- **Document Simplifier** for PDFs/images using OCR + LLM summarization.
- **Scheme Eligibility Matcher (YojanaMatch)** that maps user profiles to relevant schemes.
- **Ask JanSaarthi** conversational Q&A about government schemes with voice input.
- **Scheme Comparison** to compare 2–5 schemes side by side.
- **AI Form Helper** to explain each field of a form, with download guide and voice playback.
- **Voice I/O** with mic input and TTS output in local languages.
- **Micro-learning modules** for civic and financial awareness.

### High-level Features

- **Document Simplifier**
  - Upload PDF/image, extract text via OCR, clean & chunk it.
  - Store embeddings in ChromaDB.
  - Use Gemini 1.5 Flash for summaries, key points, and actionable steps.

- **Scheme Eligibility Matcher (YojanaMatch)**
  - Load schemes from `backend/storage/knowledge/schemes.json`.
  - Use Gemini for rule reasoning and eligibility scoring.
  - Return top 3 schemes with explanations.

- **AI Form Helper**
  - OCR to identify fields from a form image.
  - LLM to explain each field, with examples and required flags.

- **Voice & TTS**
  - Optional STT via Vosk.
  - TTS via Google Cloud Text-to-Speech.

- **Micro-learning**
  - JSON modules with lessons and quizzes in `backend/storage/knowledge/modules`.
  - Simple lesson & quiz viewer with optional audio mode.

### Architecture Overview

#### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, ShadCN-style UI components, React Query, HeroIcons.
- **Backend**: Node.js, Express, TypeScript, Gemini 1.5 Flash, ChromaDB, PaddleOCR, Google TTS, Vosk (optional).
- **Storage**: Local filesystem for PDFs, forms, audio, OCR outputs, and knowledge packs.

#### ASCII Architecture Diagram

```text
                         +----------------------+
                         |      Frontend        |
                         |  Next.js 14 (TS)     |
                         |  Tailwind + ShadCN   |
                         |  React Query         |
                         +----------+-----------+
                                    |
                                    | HTTP (REST) / JSON
                                    v
                         +----------------------+
                         |       Backend        |
                         |   Node + Express     |
                         |   TypeScript APIs    |
                         +----------+-----------+
                                    |
        +---------------------------+---------------------------+
        |                           |                           |
        v                           v                           v
+---------------+        +-------------------+       +--------------------+
|  OCR Service  |        |   AI / LLM Layer  |       |   Microlearning    |
| PaddleOCR     |        | Gemini 1.5 Flash  |       | JSON Modules       |
| (PDF, images) |        | Sentence Embeds   |       | (modules/*.json)   |
+-------+-------+        +--------+----------+       +---------+----------+
        |                          |                            |
        v                          v                            v
   Local Storage             +-----------+                Local Storage
  (pdfs/forms/temp)         | ChromaDB  |                (knowledge packs)
                            | (vectors) |
                            +-----------+
```

### Folder Structure

```text
jan-saarthi/
  frontend/
    app/
      page.tsx
      upload/page.tsx
      simplify/page.tsx
      yojana/page.tsx
      form-helper/page.tsx
      learn/page.tsx
      api/
    components/
    hooks/
    lib/
    styles/
  backend/
    server.ts
    routes/
      ocr.ts
      simplify.ts
      yojana.ts
      formHelper.ts
      voice.ts
      learn.ts
    services/
      ocrService.ts
      simplifyService.ts
      yojanaService.ts
      formService.ts
      ragService.ts
      voiceService.ts
      embeddings.ts
    utils/
      chunker.ts
      cleaner.ts
      textProcessing.ts
    storage/
      pdfs/
      forms/
      knowledge/
      temp/
  docs/
  README.md
```

### Running the Backend

```bash
cd backend
npm install
npm run dev
```

The backend starts on `http://localhost:4000` by default and exposes:
- `POST /api/ask`
- `POST /api/simplify`
- `GET /api/yojana`, `POST /api/yojana/check`, `POST /api/yojana/compare`
- `POST /api/form-helper`
- `POST /api/voice/stt`
- `POST /api/voice/tts`
- `GET /api/learn/:moduleId`

> NOTE: OCR, Gemini, ChromaDB, Google TTS and Vosk integrations are implemented via service abstractions with environment-variable-based configuration. See inline `TODO` comments for wiring credentials and installing native dependencies for your OS.

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:3000` and provides:
- **Integrated landing page** with all features inline: Simplify, Find Schemes, Ask JanSaarthi, Form Helper, Compare Schemes, Learn.
- **Upload & Simplify** document flow.
- **YojanaMatch** scheme eligibility checker.
- **AI Form Helper**.
- **Micro-learning** modules.
- **Voice input + TTS playback** where applicable.

### API Overview

- **POST `/api/ask`**
  - Body: JSON `{ question, language?, userProfile? }`.
  - Response: conversational answer about government schemes, with optional sources.

- **POST `/api/simplify`**
  - Body: multipart/form-data with `file` (PDF/image), optional `language`, `mode`.
  - Response: simplified summary, ELI10 explanation, key points, steps, metadata.

- **GET `/api/yojana`**
  - Response: list of schemes `{ id, name, category }` for comparison.

- **POST `/api/yojana/compare`**
  - Body: JSON `{ schemeIds: string[] }`.
  - Response: full scheme details for comparison.

- **POST `/api/yojana/check`**
  - Body: JSON user profile (age, gender, income, state, occupation, etc.).
  - Response: top 3 matching schemes with eligibility reasoning.

- **POST `/api/form-helper`**
  - Body: multipart/form-data with `image` (form photo).
  - Response: list of `{ field, meaning, example, required }`.

- **POST `/api/voice/stt`**
  - Body: audio file (optional, only if Vosk enabled).
  - Response: transcribed text.

- **POST `/api/voice/tts`**
  - Body: `{ text, languageCode, voiceId? }`.
  - Response: audio file/buffer location.

- **GET `/api/learn/:moduleId`**
  - Response: micro-learning module with lessons and quizzes.

For detailed request/response TypeScript interfaces, see the backend `routes` and `services` files.

### Docs

Additional design notes and API examples can be added under the `docs/` directory.

