import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/episodes/[id] - Get single episode
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include')?.split(',') || []

    const includeOptions: Record<string, boolean | object> = {}

    if (include.includes('script')) {
      includeOptions.script = true
    }
    if (include.includes('outline')) {
      includeOptions.outline = true
    }
    if (include.includes('recordings')) {
      includeOptions.recordings = {
        orderBy: { createdAt: 'desc' },
      }
    }
    if (include.includes('assets')) {
      includeOptions.assets = true
    }
    if (include.includes('jobs')) {
      includeOptions.jobs = {
        orderBy: { createdAt: 'desc' },
      }
    }
    if (include.includes('youtubePack')) {
      includeOptions.youtubePack = true
    }

    const episode = await db.episode.findUnique({
      where: { id },
      include: Object.keys(includeOptions).length > 0 ? includeOptions : undefined,
    })

    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ episode })
  } catch (error) {
    console.error('Failed to fetch episode:', error)
    return NextResponse.json(
      { error: 'Failed to fetch episode' },
      { status: 500 }
    )
  }
}

// PUT /api/episodes/[id] - Update episode
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, status } = body

    const episode = await db.episode.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    })

    return NextResponse.json({ episode })
  } catch (error) {
    console.error('Failed to update episode:', error)
    return NextResponse.json(
      { error: 'Failed to update episode' },
      { status: 500 }
    )
  }
}

// DELETE /api/episodes/[id] - Delete episode
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    await db.episode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete episode:', error)
    return NextResponse.json(
      { error: 'Failed to delete episode' },
      { status: 500 }
    )
  }
}
