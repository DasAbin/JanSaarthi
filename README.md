## JanSaarthi – AI-powered Civic Access Platform

This repository contains the full-stack implementation of **JanSaarthi**, a voice-first, low-bandwidth platform that simplifies government documents, explains forms, identifies scheme eligibility, and teaches essential skills in local languages.

### Submission Links (fill these before submitting)

- **Project Summary**: This README (sections below)
- **Demonstration (Demo Video Link)**: `TODO: paste YouTube/Drive link`
- **Codebase (GitHub Repo Link)**: `TODO: paste GitHub repository link`
- **Working Link (Live URL)**: `TODO: paste deployed URL (AWS)`

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

### Why this stands out (unique + real-world impact)

- **Works in low-connectivity settings**: the platform still provides usable outputs even with **no AI keys** (offline fallback) and supports document text extraction without heavy dependencies.
- **Voice-first UX**: designed for users with limited literacy—mic input + listen-back across key flows.
- **Trust + transparency**: scheme matching includes eligibility reasoning + required documents + next steps.
- **Deployable on AWS credits**: optional **AWS Bedrock** support so you can run the AI on AWS (no external API keys needed).

### Ideal Demo Flow (2–3 minutes)

1. **Ask JanSaarthi**: “Which schemes can help a low-income farmer in Bihar?” (voice or text)
2. **YojanaMatch**: fill profile → show top matches + why + documents
3. **Form Helper**: upload a form image → show field-by-field guidance + tips
4. **Document Simplifier**: upload a PDF/image → show summary + ELI10 + steps
5. Toggle language + “Listen” to show accessibility

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

### “Works without API keys” mode (important for judging)

JanSaarthi is designed to **run in a fully working demo mode even with zero AI keys**:

- **LLM**: falls back to a local/offline heuristic responder when no keys are set
- **OCR**: uses `pdf-parse` for text-based PDFs and `tesseract.js` for images (no Python required)

If you DO add keys, the output quality improves (Gemini/OpenAI) and you can optionally use **AWS Bedrock** (recommended for AWS credits).

### AWS Deployment (recommended: single URL via Docker on AWS)

We provide a production-ready `docker-compose.yml` + Nginx reverse proxy so you get **one working URL** that serves:

- Frontend at `/`
- Backend at `/api/*`
- Uploaded files at `/static/*`

#### Option A: AWS EC2 (fastest for hackathons)

1. Create an EC2 Ubuntu instance (t3.small or higher), open inbound **HTTP 80** and **SSH 22**
2. Install Docker + Docker Compose plugin
3. Clone your repo on the instance
4. Run:

```bash
docker compose up -d --build
```

5. Visit: `http://<EC2_PUBLIC_IP>/`

#### Option B: Use AWS Bedrock (no external API keys)

Set these environment variables for the backend (in your compose/host env):

```env
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

Then redeploy/restart the backend.

> IAM: The instance/task role must allow `bedrock:InvokeModel` / `bedrock:Converse` for the chosen model.

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

