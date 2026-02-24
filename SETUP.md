# 🚀 JanSaarthi - Setup & Run Guide

## Prerequisites

Before running JanSaarthi, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (optional, for cloning)

Verify installation:
```bash
node --version  # Should be v18+
npm --version   # Should be 9+
```

---

## 📦 Quick Start (5 Minutes)

### Step 1: Navigate to Project Directory

```bash
cd aiforbharat
```

### Step 2: Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (see Environment Variables section below)
# Then start the backend server
npm run dev
```

The backend will start on **http://localhost:4000**

### Step 3: Setup Frontend (New Terminal)

Open a **new terminal window** and run:

```bash
# Navigate to frontend (from project root)
cd aiforbharat/frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

The frontend will start on **http://localhost:3000**

### Step 4: Open in Browser

Visit: **http://localhost:3000**

---

## 🔧 Detailed Setup Instructions

### Backend Setup

#### 1. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- Express server
- TypeScript
- File upload handling (multer)
- CORS middleware
- Development tools

#### 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# In backend directory
touch .env  # On Windows: type nul > .env
```

Add the following (optional for basic testing):

```env
# Server Configuration
PORT=4000

# Gemini AI (Optional - for real AI features)
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Google Cloud TTS (Optional - for voice features)
# Requires Google Cloud credentials JSON file
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
```

**Note**: The app will work with placeholder responses even without API keys. Add keys for full functionality.

#### 3. Create Storage Directories

The storage directories should auto-create, but if needed:

```bash
# On Windows PowerShell
New-Item -ItemType Directory -Force -Path "src\storage\pdfs"
New-Item -ItemType Directory -Force -Path "src\storage\forms"
New-Item -ItemType Directory -Force -Path "src\storage\temp"
New-Item -ItemType Directory -Force -Path "src\storage\knowledge\modules"
```

#### 4. Run Backend

```bash
npm run dev
```

You should see:
```
JanSaarthi backend running on http://localhost:4000
```

**Test the backend:**
```bash
# In another terminal
curl http://localhost:4000/api/health
# Should return: {"status":"ok","service":"jan-saarthi-backend"}
```

---

### Frontend Setup

#### 1. Install Dependencies

```bash
cd frontend
npm install
```

This installs:
- Next.js 14
- React 18
- TailwindCSS
- React Query
- HeroIcons

#### 2. Environment Variables (Optional)

Create a `.env.local` file in the `frontend/` directory:

```env
# Backend URL (defaults to http://localhost:4000)
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

#### 3. Run Frontend

```bash
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
- Local:        http://localhost:3000
```

#### 4. Open Browser

Visit: **http://localhost:3000**

---

## 🎯 Running Both Servers

### Option 1: Two Terminal Windows (Recommended)

**Terminal 1 - Backend:**
```bash
cd aiforbharat/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd aiforbharat/frontend
npm run dev
```

### Option 2: Background Processes

**Windows PowerShell:**
```powershell
# Start backend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd aiforbharat/backend; npm run dev"

# Start frontend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd aiforbharat/frontend; npm run dev"
```

**Linux/Mac:**
```bash
# Start backend in background
cd aiforbharat/backend && npm run dev &

# Start frontend in background
cd aiforbharat/frontend && npm run dev &
```

---

## ✅ Verify Installation

### Backend Health Check

```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{"status":"ok","service":"jan-saarthi-backend"}
```

### Frontend Check

1. Open browser: http://localhost:3000
2. You should see the LokSaarthi homepage with 4 feature cards
3. Click on any card to navigate to that feature

---

## 🧪 Testing Features

### 1. Document Simplifier
- Navigate to: http://localhost:3000/upload
- Upload a PDF or image
- Click "Simplify"
- View the simplified summary

### 2. YojanaMatch
- Navigate to: http://localhost:3000/yojana
- Fill in profile details (age, income, state, occupation)
- Click "Check Schemes"
- View matched government schemes

### 3. AI Form Helper
- Navigate to: http://localhost:3000/form-helper
- Upload a form image
- Click "Explain Form"
- View field explanations

### 4. Micro-Learning
- Navigate to: http://localhost:3000/learn
- Select a module
- View lessons and quizzes

---

## 🔌 Enabling Full AI Features (Optional)

### 1. Gemini AI Integration

1. Get API key from: https://makersuite.google.com/app/apikey
2. Add to `backend/.env`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
3. Update `backend/src/services/embeddings.ts`:
   ```typescript
   // Replace the placeholder generateJson method with:
   import { GoogleGenerativeAI } from "@google/generative-ai";
   
   const genAI = new GoogleGenerativeAI(this.apiKey);
   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
   ```

### 2. Google Cloud TTS

1. Create a Google Cloud project
2. Enable Text-to-Speech API
3. Create a service account and download JSON key
4. Add to `backend/.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./path/to/key.json
   ```
5. Update `backend/src/services/voiceService.ts` with actual TTS calls

### 3. PaddleOCR (For Real OCR)

1. Install Python and PaddleOCR:
   ```bash
   pip install paddlepaddle paddleocr
   ```
2. Create a Python script wrapper
3. Update `backend/src/services/ocrService.ts` to call the Python script

### 4. ChromaDB (For Vector Storage)

1. Install ChromaDB:
   ```bash
   pip install chromadb
   ```
2. Update `backend/src/services/ragService.ts` with ChromaDB client

---

## 🐛 Troubleshooting

### Backend Issues

**Port 4000 already in use:**
```bash
# Change PORT in backend/.env
PORT=4001
```

**Module not found errors:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
cd backend
npm run build  # Check for compilation errors
```

### Frontend Issues

**Port 3000 already in use:**
- Next.js will automatically use 3001, 3002, etc.

**Build errors:**
```bash
cd frontend
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

**API connection errors:**
- Ensure backend is running on http://localhost:4000
- Check `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local`

### Common Issues

**"Cannot find module" errors:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**CORS errors:**
- Backend has CORS enabled by default
- If issues persist, check `backend/src/server.ts`

**File upload not working:**
- Ensure storage directories exist
- Check file permissions

---

## 📝 Development Commands

### Backend

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Run production build
```

### Frontend

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Run ESLint
```

---

## 🚀 Production Deployment

### Backend

1. Build:
   ```bash
   cd backend
   npm run build
   ```

2. Set production environment variables

3. Run:
   ```bash
   npm start
   ```

### Frontend

1. Build:
   ```bash
   cd frontend
   npm run build
   ```

2. Run:
   ```bash
   npm start
   ```

3. Or deploy to Vercel/Netlify:
   ```bash
   # Vercel
   vercel deploy
   
   # Netlify
   netlify deploy --prod
   ```

---

## 📚 Next Steps

1. ✅ Both servers running
2. ✅ Test all features
3. ⚙️ Add API keys for full AI features (optional)
4. 🎨 Customize UI/colors if needed
5. 📦 Add more schemes to `backend/src/storage/knowledge/schemes.json`
6. 📚 Add more learning modules to `backend/src/storage/knowledge/modules/`

---

## 💡 Quick Reference

| Service | URL | Command |
|---------|-----|---------|
| Frontend | http://localhost:3000 | `cd frontend && npm run dev` |
| Backend | http://localhost:4000 | `cd backend && npm run dev` |
| Health Check | http://localhost:4000/api/health | `curl http://localhost:4000/api/health` |

---

**Need help?** Check the `README.md` or `docs/` folder for more information.
