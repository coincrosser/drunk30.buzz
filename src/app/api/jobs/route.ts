import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { episodeId, type, payload } = await request.json()

    if (!episodeId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: episodeId, type' },
        { status: 400 }
      )
    }

    // Validate job type
    const validTypes = ['TRANSCODE', 'GENERATE_THUMBNAIL', 'EXTRACT_AUDIO', 'GENERATE_SHORTS', 'PUBLISH_YOUTUBE']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid job type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify episode exists
    const episode = await db.episode.findUnique({
      where: { id: episodeId },
    })

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }

    // Create the job
    const job = await db.job.create({
      data: {
        episodeId,
        type,
        status: 'PENDING',
        payload: payload || {},
        runAfter: new Date(),
      },
    })

    // TODO: In production, this would trigger a background worker
    // For now, jobs will be picked up by a separate worker process
    // or processed via a cron job

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Failed to create job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const episodeId = searchParams.get('episodeId')
    const status = searchParams.get('status')

    const where: any = {}
    if (episodeId) where.episodeId = episodeId
    if (status) where.status = status

    const jobs = await db.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
