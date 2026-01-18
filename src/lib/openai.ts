// Legacy shim: Keep exports for any leftover imports expecting lib/openai.
// Internally we delegate to Gemini to avoid the OpenAI SDK dependency during build.
import { gemini, AI_MODEL as GEMINI_MODEL, SYSTEM_PROMPT as GEMINI_SYSTEM_PROMPT } from './gemini'

export const openai = gemini
export const AI_MODEL = GEMINI_MODEL
export const SYSTEM_PROMPT = GEMINI_SYSTEM_PROMPT
