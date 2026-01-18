import OpenAI from 'openai'

// Only instantiate the real OpenAI client when an API key is present.
// During `next build`, Next collects page data which imports server modules. If the
// API key is missing (e.g., in CI or local dev when not set), creating the client
// can throw and abort the build. Use a lightweight stub that throws when used,
// so the app can build successfully and produce a helpful runtime error if called.

let _openai: any = null
if (process.env.OPENAI_API_KEY) {
  _openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  })
} else {
  // Minimal stub that surfaces a descriptive error when an endpoint tries to call it
  _openai = {
    chat: {
      completions: {
        create: async () => {
          throw new Error('The OPENAI_API_KEY environment variable is missing or empty; set it to use AI features.')
        },
      },
    },
  } as const
}

// Legacy shim: Keep exports for any leftover imports expecting lib/openai.
// Internally we delegate to Gemini to avoid the OpenAI SDK dependency during build.
import { gemini, AI_MODEL as GEMINI_MODEL, SYSTEM_PROMPT as GEMINI_SYSTEM_PROMPT } from './gemini'

export const openai = gemini
export const AI_MODEL = GEMINI_MODEL
export const SYSTEM_PROMPT = GEMINI_SYSTEM_PROMPT
- 51 years old
