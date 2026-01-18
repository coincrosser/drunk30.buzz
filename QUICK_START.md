# drunk30.buzz - Getting Started Checklist

## ✅ Setup Checklist

### Step 1: Environment Setup (5 minutes)
- [ ] Node.js installed (`node -v` shows >= 18.0.0)
- [ ] Database running (PostgreSQL/MySQL/SQLite)
- [ ] `.env.local` created with:
  - [ ] `OPENAI_API_KEY` set
  - [ ] `DATABASE_URL` set and tested

### Step 2: Install & Configure (5 minutes)
- [ ] Ran `npm install`
- [ ] Ran `npm run prisma:migrate` (initializes database)
- [ ] `npm run dev` starts without errors

### Step 3: Test Generators
- [ ] Outline generator works (`/api/ai/outline` request succeeds)
- [ ] Script generator works (`/api/ai/script` request succeeds)
- [ ] YouTube pack generator works (`/api/ai/youtube-pack` request succeeds)

### Step 4: Test Camera
- [ ] Visit `/studio/record/test`
- [ ] Browser asks for camera permission
- [ ] Camera preview shows in video element
- [ ] Can record and download video

---

## 🔧 Quick Fixes

### Generators Say "Missing API Key"
```bash
# Check your .env.local has:
OPENAI_API_KEY=sk-proj-... (not empty)

# Restart server:
npm run dev
```

### Camera Won't Open
```
1. Check browser console (F12) for error message
2. Allow camera permission in browser settings
3. Make sure no other app is using camera
4. Try a different browser
```

### Database Connection Failed
```bash
# Check DATABASE_URL in .env.local
# Start your database:
# - PostgreSQL: sudo service postgresql start
# - MySQL: sudo service mysql start

# Then retry:
npm run prisma:migrate
```

### Nothing Works
```bash
# Full reset:
rm -rf .next node_modules package-lock.json
npm install
npm run prisma:migrate
npm run dev
```

---

## 📝 Status

- ✅ AI Generators: Fixed with proper error handling
- ✅ Camera Recording: Enhanced with browser compatibility
- ✅ Environment: Now validates at startup
- ✅ Database: Configured with Prisma
- ✅ Next.js: Updated scripts in package.json

---

**Next**: Update `.env.local` with your actual API keys, then run `npm run dev`
