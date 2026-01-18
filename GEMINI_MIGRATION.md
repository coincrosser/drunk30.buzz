# Gemini API Migration Complete ✅

## What Changed:
- **Replaced OpenAI API** with **Google Gemini API** across all generators (outline, script, youtube-pack)
- Created new `src/lib/gemini.ts` that wraps Gemini API with OpenAI-compatible interface
- Updated all API routes to use Gemini client
- Removed `openai` package, added `@google/generative-ai`
- Updated GitHub Actions workflow to use `GEMINI_API_KEY` instead of `OPENAI_API_KEY`

## API Key Added:
✅ `.env.local` updated with your Gemini API key
- `GEMINI_API_KEY=AIzaSyCgHWDaovc3C3F1GvQevijB0jANbsiwoJs`
- `GEMINI_MODEL=gemini-1.5-flash`

## GitHub Secrets Setup Required:
To enable Cloud Run deployment, add this secret to your GitHub repository:

**Go to:** `https://github.com/coincrosser/drunk30.buzz/settings/secrets/actions`

**Add new secret:**
- Name: `GEMINI_API_KEY`
- Value: `AIzaSyCgHWDaovc3C3F1GvQevijB0jANbsiwoJs`

## Local Testing:
✅ Build test passed - all generators compile successfully with Gemini

## Next Steps:
1. Add the GEMINI_API_KEY secret to GitHub repository settings
2. Push will trigger GitHub Actions → build → deploy to Cloud Run
3. Test generators: outline, script, youtube-pack

## Model Used:
- **Gemini 1.5 Flash**: Fast, cost-effective model suitable for podcast content generation
- Falls back to other models if specified in GEMINI_MODEL env var

## Files Modified:
- `src/lib/gemini.ts` (new file)
- `src/app/api/ai/outline/route.ts` 
- `src/app/api/ai/script/route.ts`
- `src/app/api/ai/youtube-pack/route.ts`
- `.github/workflows/deploy.yml`
- `.env.local`
- `package.json`
- `package-lock.json`
