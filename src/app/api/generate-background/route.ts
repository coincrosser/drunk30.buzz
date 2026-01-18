import { NextRequest, NextResponse } from 'next/server'

// Background image generation via OpenAI was removed. Gemini image generation is not
// wired up yet, so we return a clear, non-failing response for now. This keeps the
// build green and surfaces a descriptive message to callers.
export async function POST(request: NextRequest) {
  const { prompt } = await request.json()

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  return NextResponse.json(
    {
      error:
        'Background generation is temporarily disabled while migrating from OpenAI to Gemini. No image was generated.',
    },
    { status: 501 }
  )
}
