# drunk30.buzz Setup & Troubleshooting Guide

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0 ([Download](https://nodejs.org/))
- A database (PostgreSQL, MySQL, or SQLite)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Edit `.env.local` and fill in:

```env
# Required: OpenAI API Key (from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-...

# Required: Database connection
# PostgreSQL example: postgresql://user:password@localhost:5432/drunk30
# MySQL example: mysql://user:password@localhost:3306/drunk30
# SQLite example: file:./prisma/dev.db
DATABASE_URL=postgresql://user:password@localhost:5432/drunk30

# Optional: OpenAI Model (defaults to gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini

# Optional: Base URL for OpenAI API (if using a proxy)
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 3. Set Up Database
```bash
# Create/migrate database
npm run prisma:migrate

# (Optional) View database in GUI
npm run prisma:studio
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## ❌ Troubleshooting

### Generators Not Working ("All generators fail")

**Error: "OPENAI_API_KEY is missing"**
- ✅ Solution: Add your API key to `.env.local`
- Restart dev server: `npm run dev`

**Error: "Invalid API key" or "401 Unauthorized"**
- ✅ Solution: Check your API key at https://platform.openai.com/api-keys
- Make sure you're using the correct key (starts with `sk-proj-`)

**Error: "No response from AI" or blank response**
- ✅ Check browser console (F12 → Console tab) for error messages
- ✅ Check terminal logs for API errors
- ✅ Verify internet connection
- ✅ Try again in a few seconds (might be rate limited)

**Error: Database connection failed**
- ✅ Verify `DATABASE_URL` in `.env.local` is correct
- ✅ Make sure your database server is running
- ✅ For PostgreSQL: `sudo service postgresql start`
- ✅ For SQLite: Just works (creates file automatically)

### Camera Not Working

**Error: "Camera Access Denied"**
- ✅ **Chrome/Edge**: Settings → Privacy → Site Settings → Camera → Allow drunk30.buzz
- ✅ **Firefox**: Allow permission when prompted, or check: Privacy → Permissions → Camera
- ✅ **Safari**: Allow permission when prompted

**Error: "Camera is in use by another application"**
- ✅ Close other apps using camera (Zoom, Teams, OBS, etc.)
- ✅ Restart browser

**Error: "Browser does not support camera recording"**
- ✅ Use Chrome, Edge, or Firefox
- ✅ Safari has limited support
- ✅ Internet Explorer is not supported

**Error: "HTTPS required"**
- ✅ On localhost (`http://localhost:3000`): Works fine
- ✅ On production (`drunk30.buzz`): Must use HTTPS
- ✅ Check: Is your domain using SSL? (Look for 🔒 in browser)

**Camera works but video quality is poor**
- ✅ Camera settings: Higher resolution in constraints (already optimized to 1920×1080)
- ✅ Check lighting
- ✅ Use a better camera/webcam if available

---

## 🎬 Using the Recorder

1. Go to `/studio/record/[episode-id]` (or click Record in sidebar)
2. **Allow camera/microphone** when prompted
3. Click **Start Recording** (red circle appears)
4. Click **Stop Recording** (ends recording)
5. Click **Download** or **Upload** to save

---

## 🤖 Using the AI Generators

### Outline Generator
```
POST /api/ai/outline
{
  "topic": "My topic",
  "context": "Optional additional info",
  "episodeId": "optional-uuid"
}
```

### Script Generator
```
POST /api/ai/script
{
  "outline": "The outline text",
  "title": "Episode Title",
  "targetDuration": 10,  // minutes
  "episodeId": "optional-uuid"
}
```

### YouTube Pack Generator
```
POST /api/ai/youtube-pack
{
  "title": "Video Title",
  "description": "Optional description",
  "script": "Optional script excerpt",
  "episodeId": "optional-uuid"
}
```

---

## 📊 Available Scripts

```bash
# Development
npm run dev           # Start dev server (http://localhost:3000)

# Database
npm run prisma:migrate   # Create/run migrations
npm run prisma:studio    # Open Prisma GUI

# Building
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

---

## 🔗 Useful Links

- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **Database Setup**: 
  - PostgreSQL: https://www.postgresql.org/download/
  - MySQL: https://dev.mysql.com/downloads/
- **Prisma Docs**: https://www.prisma.io/docs/
- **Next.js Docs**: https://nextjs.org/docs

---

## 🆘 Still Having Issues?

1. **Check the console**: Open browser DevTools (F12) → Console tab
2. **Check the logs**: Look at terminal output where you ran `npm run dev`
3. **Clear cache**: `rm -rf .next node_modules .env.local` then reinstall
4. **Update Node**: Make sure you have Node >= 18

Common fixes:
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild Next.js
rm -rf .next
npm run build

# Full reset
npm run dev
```

---

**For video tutorial**: Check the [drunk30.buzz documentation](https://github.com/drunk30/drunk30.buzz/blob/main/README.md)
