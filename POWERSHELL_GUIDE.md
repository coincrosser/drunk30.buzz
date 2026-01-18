# 🪟 PowerShell Quick Start for drunk30.buzz

## Setting Environment Variables in PowerShell

If you need to set variables in PowerShell (not recommended - use `.env.local` instead):

```powershell
# PowerShell syntax for environment variables:
$env:OPENAI_API_KEY="sk-proj-YOUR_KEY_HERE"
$env:DATABASE_URL="file:./prisma/dev.db"

# Verify they're set:
$env:OPENAI_API_KEY
$env:DATABASE_URL
```

**BUT WAIT!** We already created `.env.local` for you, so you don't need to do this!

---

## ✅ The Easy Way: Edit `.env.local`

### Step 1: Open `.env.local` in an editor
```powershell
# Option A: Open in VS Code
code .env.local

# Option B: Open in Notepad
notepad .env.local
```

### Step 2: Edit these lines:

**Current:**
```
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
DATABASE_URL=file:./prisma/dev.db
```

**Change to** (example):
```
OPENAI_API_KEY=sk-proj-abc123def456...your_actual_key...
DATABASE_URL=file:./prisma/dev.db
```

### Step 3: Save the file

### Step 4: Run the app
```powershell
npm run dev
```

---

## 🔑 Getting Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Click: "Create new secret key"
3. Copy the key (starts with `sk-proj-`)
4. Paste into `.env.local` as shown above

---

## 🗄️ Database Setup (Choose One)

### EASIEST: SQLite (Already Configured! ✅)
No setup needed! Already set in `.env.local`:
```
DATABASE_URL=file:./prisma/dev.db
```

Just run:
```powershell
npm run prisma:migrate
```

Done! ✅

---

### ADVANCED: PostgreSQL

**Install PostgreSQL:**
- Download from: https://www.postgresql.org/download/windows/
- Run the installer
- Remember the password you set

**Create database:**
```powershell
# Open PowerShell and run:
psql -U postgres -c "CREATE DATABASE drunk30;"
```

**Update `.env.local`:**
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/drunk30
```

**Setup:**
```powershell
npm run prisma:migrate
```

---

### ADVANCED: MySQL

**Install MySQL:**
- Download from: https://dev.mysql.com/downloads/mysql/
- Run the installer
- Remember the password you set

**Create database:**
```powershell
# Open PowerShell and run:
mysql -u root -p
# Then in the MySQL prompt:
CREATE DATABASE drunk30;
EXIT;
```

**Update `.env.local`:**
```
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/drunk30
```

**Setup:**
```powershell
npm run prisma:migrate
```

---

## ✅ Quick Setup (All at Once)

```powershell
# 1. Edit .env.local (open in editor and save)
code .env.local

# 2. Install dependencies
npm install

# 3. Setup database (creates the SQLite file)
npm run prisma:migrate

# 4. Start the app
npm run dev

# 5. Open browser
Start-Process "http://localhost:3000"
```

---

## 🧪 Verify Everything Works

```powershell
# Test the generators
bash test-generators.sh

# You should see:
# ✅ PASSED: Outline generator
# ✅ PASSED: Script generator
# ✅ PASSED: YouTube pack generator
# ✅ PASSED: Error handling
```

---

## 🆘 PowerShell Common Errors

### Error: "Database URL not found"
```
❌ This means .env.local wasn't saved properly
✅ Fix: Open .env.local, add DATABASE_URL=file:./prisma/dev.db, save
```

### Error: "OPENAI_API_KEY is missing"
```
❌ This means .env.local doesn't have your actual API key
✅ Fix: Get key from https://platform.openai.com/api-keys
✅ Paste into .env.local (replaces YOUR_OPENAI_API_KEY_HERE)
✅ Save the file
```

### Error: "npm not found"
```
❌ Node.js/npm not installed
✅ Install Node.js from: https://nodejs.org/
✅ Restart PowerShell
```

### Error: "Port 3000 already in use"
```
❌ Another app is using port 3000
✅ Option 1: Close other apps
✅ Option 2: Use different port: npm run dev -- -p 3001
```

---

## 📂 File Locations (PowerShell)

```powershell
# Show all files
ls

# Show only config files
ls *.json, *.env*

# Open .env.local in VS Code
code .env.local

# Open .env.local in Notepad
notepad .env.local

# Show project structure
tree src
```

---

## 💡 Pro Tips for PowerShell

### Run multiple commands
```powershell
npm install; npm run prisma:migrate; npm run dev
```

### Open folder in VS Code from PowerShell
```powershell
code .
```

### Open browser from PowerShell
```powershell
Start-Process "http://localhost:3000"
```

### Kill a process using a port
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the number)
taskkill /PID 12345 /F
```

### View file content
```powershell
# View .env.local
Get-Content .env.local

# View package.json
Get-Content package.json
```

---

## ✨ You're Ready!

1. **Edit `.env.local`** with your OpenAI API key
2. **Run `npm install`**
3. **Run `npm run prisma:migrate`**
4. **Run `npm run dev`**
5. **Visit `http://localhost:3000`** ✅

Questions? See: `SETUP_GUIDE.md` (comprehensive)
