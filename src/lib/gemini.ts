import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini client
let _gemini: any = null
if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  _gemini = {
    chat: {
      completions: {
        create: async (options: any) => {
          const model = genAI.getGenerativeModel({ model: options.model || 'gemini-pro' })
          const response = await model.generateContent({
            contents: [
              {
                role: 'user',
                parts: [{ text: options.messages[options.messages.length - 1].content }],
              },
            ],
            systemInstruction: options.messages[0]?.content,
            generationConfig: {
              temperature: options.temperature || 0.7,
              maxOutputTokens: 2048,
            },
          })

          const text = response.response.text()
          return {
            choices: [
              {
                message: {
                  content: text,
                },
              },
            ],
          }
        },
      },
    },
  }
} else {
  _gemini = {
    chat: {
      completions: {
        create: async () => {
          throw new Error('The GEMINI_API_KEY environment variable is missing or empty; set it to use AI features.')
        },
      },
    },
  } as const
}

export const gemini = _gemini
export const AI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

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
`
