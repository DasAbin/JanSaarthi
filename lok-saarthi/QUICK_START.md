# 🚀 Quick Start - Manual Steps

## Step 1: Restart Backend Server

The backend code has been fixed. You need to restart it to pick up the changes:

1. **Stop the current backend server** (in the terminal where it's running):
   - Press `Ctrl + C` to stop it

2. **Restart the backend**:
   ```bash
   cd lok-saarthi/backend
   npm run dev
   ```

   You should see:
   ```
   LokSaarthi backend running on http://localhost:4000
   ```

## Step 2: Verify Frontend is Running

Make sure your frontend is still running on **http://localhost:3000**

If not, start it:
```bash
cd lok-saarthi/frontend
npm run dev
```

## Step 3: Test the Application

1. **Open browser**: http://localhost:3000

2. **Test Document Simplifier**:
   - Click on "Document Simplifier" card
   - Upload any PDF or image file
   - Click "Simplify"
   - ✅ Should now work without errors!

3. **Test Other Features**:
   - **YojanaMatch**: Fill in profile details and check schemes
   - **Form Helper**: Upload a form image
   - **Learn**: Browse learning modules

## Step 4: (Optional) Add Gemini API Key for Real AI

If you want real AI summaries instead of placeholders:

1. Get a Gemini API key from: https://makersuite.google.com/app/apikey

2. Create/Edit `backend/.env`:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. Restart backend server

## ✅ That's It!

Your LokSaarthi application should now be fully functional!

---

## Troubleshooting

**If backend still shows errors:**
- Make sure you restarted it after the fixes
- Check that all files were saved correctly

**If frontend can't connect:**
- Verify backend is running on port 4000
- Check browser console for errors

**Need help?** Check `SETUP.md` for detailed instructions.
