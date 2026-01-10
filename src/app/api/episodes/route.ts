import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Episode, Recording } from '@prisma/client'

// GET /api/episodes - List episodes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const published = searchParams.get('published')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (published === 'true') {
      where.status = 'PUBLISHED'
    }

    const episodes = await db.episode.findMany({
      where,
      orderBy: { episodeNumber: 'desc' },
      include: {
        script: {
          select: {
            id: true,
          },
        },
        outline: {
          select: {
            id: true,
          },
        },
        recordings: {
          select: {
            id: true,
            durationMs: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    // Normalize recording duration to `duration` (milliseconds) for compatibility
    const episodesNormalized = episodes.map(
      (ep: Episode & { recordings: Recording[] }) => ({
        ...ep,
        recordings: ep.recordings.map((r: Recording) => ({
          ...r,
          duration: r.durationMs,
        })),
      }),
    )

    return NextResponse.json({ episodes: episodesNormalized })
  } catch (error) {
    console.error('Failed to fetch episodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    )
  }
}

// POST /api/episodes - Create episode
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, topic } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Get next episode number
    const lastEpisode = await db.episode.findFirst({
      orderBy: { episodeNumber: 'desc' },
      select: { episodeNumber: true },
    })

    const episodeNumber = (lastEpisode?.episodeNumber || 0) + 1

    const episode = await db.episode.create({
      data: {
        title,
        description,
        episodeNumber,
        status: 'IDEA',
        // For now, using a placeholder user ID
        // In production, get this from auth
        userId: 'default-user',
      },
    })

    // If topic provided, create outline placeholder
    if (topic) {
      await db.episodeOutline.create({
        data: {
          episodeId: episode.id,
          content: `Topic: ${topic}`,
        },
      })
    }

    return NextResponse.json({ episode }, { status: 201 })
  } catch (error) {
    console.error('Failed to create episode:', error)
    return NextResponse.json(
      { error: 'Failed to create episode' },
      { status: 500 }
    )
  }
}
