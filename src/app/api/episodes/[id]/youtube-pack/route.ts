import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/episodes/[id]/youtube-pack - Save/update YouTube pack
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      titles,
      description,
      hashtags,
      tags,
      chapters,
      pinnedComment,
      thumbnailIdeas,
    } = body

    // Check if episode exists
    const episode = await db.episode.findUnique({
      where: { id },
      include: { youtubePack: true },
    })

    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      )
    }

    let youtubePack

    if (episode.youtubePack) {
      // Update existing
      youtubePack = await db.youTubePack.update({
        where: { id: episode.youtubePack.id },
        data: {
          titleOptions: titles,
          description,
          hashtags,
          tags,
          chapters,
          pinnedComment,
          thumbnailIdeas,
        },
      })
    } else {
      // Create new
      youtubePack = await db.youTubePack.create({
        data: {
          episodeId: id,
          titleOptions: titles,
          description,
          hashtags,
          tags,
          chapters,
          pinnedComment,
          thumbnailIdeas,
        },
      })
    }

    return NextResponse.json({ youtubePack })
  } catch (error) {
    console.error('Failed to save YouTube pack:', error)
    return NextResponse.json(
      { error: 'Failed to save YouTube pack' },
      { status: 500 }
    )
  }
}
