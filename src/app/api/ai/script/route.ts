import { NextRequest, NextResponse } from 'next/server'
import { openai, AI_MODEL, SYSTEM_PROMPT } from '@/lib/openai'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { episodeId, title, outline, targetDuration = 10 } = body

    if (!outline) {
      return NextResponse.json(
        { error: 'Outline is required' },
        { status: 400 }
      )
    }

    const wordsPerMinute = 150
    const targetWords = targetDuration * wordsPerMinute

    const prompt = `Write a conversational podcast/YouTube script based on this outline:

Title: ${title || 'Untitled Episode'}

Outline:
${outline}

Requirements:
- Target length: approximately ${targetWords} words (${targetDuration} minutes at ${wordsPerMinute} wpm)
- Write in first person, conversational tone
- Include natural pauses and transitions
- Add [PAUSE] markers where the speaker should take a breath
- Keep it honest and grounded — no hype or hustle-bro energy
- Include personal reflection where appropriate
- End with a clear call-to-action

Write the script as plain text, ready to be read from a teleprompter. Use short paragraphs for easier reading.`

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const script = completion.choices[0]?.message?.content
    if (!script) {
      throw new Error('No response from AI')
    }

    // Count words
    const wordCount = script.split(/\s+/).length
    const estDurationMs = Math.ceil(wordCount / wordsPerMinute) * 60 * 1000
    const estimatedDuration = Math.ceil(wordCount / wordsPerMinute)

    // Save to database if episodeId provided
    if (episodeId) {
      await db.episodeScript.upsert({
        where: { episodeId },
        create: {
          episodeId,
          content: script,
          wordCount,
          estDurationMs,
        },
        update: {
          content: script,
          wordCount,
          estDurationMs,
        },
      })

      // Update episode status
      await db.episode.update({
        where: { id: episodeId },
        data: { status: 'SCRIPT' },
      })
    }

    return NextResponse.json({
      script: {
        content: script,
        wordCount,
        estimatedDuration,
        estDurationMs,
      },
    })
  } catch (error) {
    console.error('Failed to generate script:', error)
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    )
  }
}
