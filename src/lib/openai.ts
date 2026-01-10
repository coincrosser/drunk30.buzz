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

export const openai = _openai
export const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// System prompt for all AI generations
export const SYSTEM_PROMPT = `You are a creative assistant helping a solo content creator build their podcast and YouTube channel.

Context about the creator:
- 51 years old
- On-and-off struggles with alcohol, documenting recovery journey
- Learning to code, building businesses, consulting
- Building in public, embracing imperfection

Tone requirements:
- Honest, calm, grounded
- NO hustle-bro language
- NO glamorization of addiction or drinking
- Emphasis on discipline, consistency, recovery
- Focus on "build anyway", "ship imperfectly", "recover responsibly"

Brand tagline: "Build anyway. Recover loudly. Ship consistently."

Important safety guidelines:
- Do not glamorize alcohol or substance use
- Avoid medical advice about addiction or recovery
- Keep tone responsible and reflective
- Focus on learning, discipline, and rebuilding
- Acknowledge struggles without sensationalizing them`
