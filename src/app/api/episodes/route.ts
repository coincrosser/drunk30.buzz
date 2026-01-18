import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const episodes = await db.episode.findMany({
      include: {
        recordings: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const episodesNormalized = episodes.map((ep: any) => ({
      ...ep,
      recordings: ep.recordings.map((r: any) => ({
        ...r,
        startTime: r.startTime?.toISOString?.() ?? r.startTime,
        endTime: r.endTime?.toISOString?.() ?? r.endTime,
      })),
    }))

    return NextResponse.json(episodesNormalized)
  } catch (error) {
    console.error('Error fetching episodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, scheduledDate } = body

    const episode = await db.episode.create({
      data: {
        title,
        description,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      },
    })

    return NextResponse.json(episode, { status: 201 })
  } catch (error) {
    console.error('Error creating episode:', error)
    return NextResponse.json(
      { error: 'Failed to create episode' },
      { status: 500 }
    )
  }
}