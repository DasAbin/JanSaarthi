# 🔑 Gemini API Setup

## Quick Setup (2 Steps)

### Step 1: Get Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### Step 2: Add to .env File

Create or edit `backend/.env`:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

**That's it!** The code is now updated to automatically use Gemini when the API key is present.

### Step 3: Restart Backend

```bash
# Stop backend (Ctrl+C) and restart:
cd backend
npm run dev
```

---

## ✅ Verification

After restarting, when you upload a document:
- **Without API key**: You'll see placeholder messages
- **With API key**: You'll get real AI-generated summaries!

---

## 🎯 What Changed

The code now automatically:
- ✅ Detects if Gemini API key exists
- ✅ Calls Gemini 1.5 Flash API
- ✅ Returns real AI summaries
- ✅ Falls back gracefully if API fails

No code changes needed - just add the API key and restart!
