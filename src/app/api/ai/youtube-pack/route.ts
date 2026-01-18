import { NextRequest, NextResponse } from 'next/server'
import { openai, AI_MODEL, SYSTEM_PROMPT } from '@/lib/openai'
import { db } from '@/lib/db'
import { handleAIError, validateInput } from '@/lib/ai-error-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { episodeId, title, description, script } = body

    // Validate required fields
    validateInput(body, ['title'])

    const prompt = `Generate YouTube metadata for a video with this context:

Title: ${title}
${description ? `Description: ${description}` : ''}
${script ? `Script excerpt (first 1000 chars): ${script.substring(0, 1000)}...` : ''}

Generate a complete YouTube pack with:
1. 5 alternative title options (compelling, under 60 chars each)
2. A full video description (include links placeholders, timestamps placeholder)
3. 5-8 relevant hashtags (without # prefix)
4. 15-20 video tags for SEO
5. Chapter timestamps template
6. A pinned comment suggestion
7. 3 thumbnail text/concept ideas

Return as JSON:
{
  "titles": ["title1", "title2", ...],
  "description": "full description text",
  "hashtags": ["tag1", "tag2", ...],
  "tags": ["keyword1", "keyword2", ...],
  "chapters": "00:00 - Intro\\n...",
  "pinnedComment": "comment text",
  "thumbnailIdeas": ["idea1", "idea2", "idea3"]
}

Tone: Honest, grounded, focused on learning and building. No clickbait or hype.`

    console.log(`📹 Generating YouTube pack for: "${title}"...`)

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const youtubePack = JSON.parse(content)

    // Save to database if episodeId provided
    if (episodeId) {
      try {
        const existing = await db.youTubePack.findUnique({
          where: { episodeId },
        })

        if (existing) {
          await db.youTubePack.update({
            where: { episodeId },
            data: {
              titleOptions: youtubePack.titles,
              description: youtubePack.description,
              hashtags: youtubePack.hashtags,
              tags: youtubePack.tags,
              chapters: youtubePack.chapters,
              pinnedComment: youtubePack.pinnedComment,
              thumbnailIdeas: youtubePack.thumbnailIdeas,
            },
          })
        } else {
          await db.youTubePack.create({
            data: {
              episodeId,
              titleOptions: youtubePack.titles,
              description: youtubePack.description,
              hashtags: youtubePack.hashtags,
              tags: youtubePack.tags,
              chapters: youtubePack.chapters,
              pinnedComment: youtubePack.pinnedComment,
              thumbnailIdeas: youtubePack.thumbnailIdeas,
            },
          })
        }

        console.log(`✅ YouTube pack saved for episode ${episodeId}`)
      } catch (dbError) {
        console.warn('⚠️  Could not save YouTube pack to database:', dbError)
        // Continue - return the generated pack even if DB save fails
      }
    }

    return NextResponse.json({ youtubePack })
  } catch (error) {
    return handleAIError(error)
  }
}
      { error: 'Failed to generate YouTube pack' },
      { status: 500 }
    )
  }
}
