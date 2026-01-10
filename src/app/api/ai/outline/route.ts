import { NextRequest, NextResponse } from 'next/server'
import { openai, AI_MODEL, SYSTEM_PROMPT } from '@/lib/openai'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { episodeId, topic, context } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    const prompt = `Create an outline for a podcast/YouTube episode about: ${topic}

${context ? `Additional context: ${context}` : ''}

Create a structured outline with:
1. A compelling hook/introduction (1-2 sentences to grab attention)
2. 3-5 main talking points with brief notes for each
3. A personal angle or story connection
4. A conclusion with a call-to-action

Format the response as JSON with this structure:
{
  "hook": "string",
  "mainPoints": [
    { "title": "string", "notes": "string" }
  ],
  "personalAngle": "string",
  "conclusion": "string",
  "callToAction": "string"
}

Remember: Keep the tone honest, grounded, and reflective. No hustle-bro language. Focus on learning and building.`

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const outline = JSON.parse(content)

    // Format outline as readable text
    const formattedContent = `## Hook
${outline.hook}

## Main Points
${outline.mainPoints.map((point: { title: string; notes: string }, i: number) => `${i + 1}. **${point.title}**\n   ${point.notes}`).join('\n\n')}

## Personal Angle
${outline.personalAngle}

## Conclusion
${outline.conclusion}

## Call to Action
${outline.callToAction}`

    // Save to database if episodeId provided
    if (episodeId) {
      await db.episodeOutline.upsert({
        where: { episodeId },
        create: {
          episodeId,
          content: formattedContent,
        },
        update: {
          content: formattedContent,
        },
      })

      // Update episode status
      await db.episode.update({
        where: { id: episodeId },
        data: { status: 'OUTLINE' },
      })
    }

    return NextResponse.json({
      outline: {
        ...outline,
        formatted: formattedContent,
      },
    })
  } catch (error) {
    console.error('Failed to generate outline:', error)
    return NextResponse.json(
      { error: 'Failed to generate outline' },
      { status: 500 }
    )
  }
}
