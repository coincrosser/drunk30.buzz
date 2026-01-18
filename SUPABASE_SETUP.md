# 🗄️ Supabase Setup Guide for drunk30.buzz

## Quick Setup (5 minutes)

### Step 1: Get Your Supabase Credentials

1. Go to: https://app.supabase.com
2. Sign in or create account
3. Open your project (Project ID: `bamboo-almanac-483903-i3` or create new)
4. Go to: **Settings → API Keys**

### Step 2: Get Connection String

1. In Supabase dashboard: **Settings → Database**
2. Under "Connection Pooling" section:
   - **Host**: Copy the host (format: `xxx.supabase.co`)
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Port**: `6543` (for connection pooling)

3. Get password:
   - When you created the project, you set a password
   - If you forgot: Settings → Database → Reset Password

### Step 3: Update `.env.local`

Edit `.env.local` and fill in these values:

```env
# Your actual values below:

OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:6543/postgres

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_FROM_API_KEYS

SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_FROM_API_KEYS

STORAGE_BUCKET=assets
```

**Example** (don't use these values, get your own):
```env
DATABASE_URL=postgresql://postgres:abc123def@drunk30.supabase.co:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://drunk30.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Run Database Migrations

```powershell
npm run prisma:migrate
```

This creates all tables and schemas in your Supabase database.

### Step 5: Start the App

```powershell
npm run dev
```

✅ Done! Your app is now connected to Supabase.

---

## 🔑 Finding Your Credentials

### Database URL (CONNECTION POOLING)
```
Location: Settings → Database → Connection Pooling
Select: PostgreSQL
Copy: Connection String
Format: postgresql://postgres:password@host:6543/postgres
```

### Supabase URL
```
Location: Settings → General
Look for: Project URL
Format: https://YOUR_PROJECT.supabase.co
```

### API Keys
```
Location: Settings → API Keys
Keys you need:
  - NEXT_PUBLIC_SUPABASE_ANON_KEY (public, safe to expose)
  - SUPABASE_SERVICE_ROLE_KEY (secret, keep hidden)
```

---

## ✅ Verify Everything Works

### Test 1: Database Connection
```powershell
# This creates tables in Supabase
npm run prisma:migrate
```

If successful, you'll see:
```
Environment variables loaded from .env.local
Prisma schema loaded from prisma/schema.prisma

6 files generated in 47ms
```

### Test 2: View Database
```powershell
npm run prisma:studio
```

This opens a GUI at `http://localhost:5555` where you can see all your database tables.

### Test 3: Start App
```powershell
npm run dev
```

Visit `http://localhost:3000` and check that it loads without errors.

### Test 4: Test Generators
```powershell
bash test-generators.sh
```

Should pass all tests if everything is configured.

---

## 🆘 Common Supabase Issues

### Issue: "Connection refused" or "Cannot connect to database"
```
❌ Problem: DATABASE_URL is wrong
✅ Fix:
  1. Go to Settings → Database → Connection Pooling
  2. Copy exact connection string
  3. Paste into DATABASE_URL in .env.local
  4. Make sure port is 6543 (not 5432)
  5. Restart: npm run dev
```

### Issue: "NEXT_PUBLIC_SUPABASE_URL is missing"
```
❌ Problem: .env.local doesn't have Supabase URL
✅ Fix:
  1. Get from: Settings → General → Project URL
  2. Add to .env.local
  3. Restart: npm run dev
```

### Issue: "Invalid API Key"
```
❌ Problem: NEXT_PUBLIC_SUPABASE_ANON_KEY is wrong
✅ Fix:
  1. Go to: Settings → API Keys
  2. Copy NEXT_PUBLIC_SUPABASE_ANON_KEY (labeled as "anon key")
  3. Paste into .env.local
  4. Restart: npm run dev
```

### Issue: "Prisma migration fails"
```
❌ Problem: DATABASE_URL connection failed
✅ Fix:
  1. Test connection manually:
     psql postgresql://postgres:PASSWORD@HOST:6543/postgres
  2. If that works, check .env.local spelling
  3. Make sure no extra spaces in DATABASE_URL
  4. Restart terminal and try again
```

### Issue: "Table already exists"
```
❌ Problem: Already ran migrations once
✅ Fix: Just continue, it's safe to run again
  npm run prisma:migrate
```

---

## 📁 What Gets Stored

### In Supabase PostgreSQL (DATABASE_URL)
- Episodes
- Scripts
- Outlines  
- YouTube metadata
- User data
- Video assets metadata

### In Supabase Storage (NEXT_PUBLIC_SUPABASE_URL)
- Recorded videos
- Generated backgrounds
- Episode thumbnails

---

## 🔒 Security Notes

### ⚠️ IMPORTANT: Don't Commit `.env.local`
```
.env.local contains SENSITIVE keys!
It's already in .gitignore ✅
Never commit it to GitHub!
```

### Safe Keys (OK to commit):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
(These are "public" - frontend can use them)
```

### Secret Keys (NEVER commit):
```
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
(These are "secret" - only backend can use them)
```

---

## 📚 Supabase Resources

- **Dashboard**: https://app.supabase.com
- **Documentation**: https://supabase.com/docs
- **SQL Editor**: In dashboard → SQL Editor (run queries directly)
- **Prisma Docs**: https://www.prisma.io/docs/

---

## ✨ You're Ready!

1. **Get your Supabase credentials** (see "Finding Your Credentials" above)
2. **Edit `.env.local`** with the values
3. **Run `npm run prisma:migrate`** to create tables
4. **Run `npm run dev`** to start the app
5. **Visit `http://localhost:3000`** ✅

Questions? Check `SETUP_GUIDE.md` for comprehensive troubleshooting.
