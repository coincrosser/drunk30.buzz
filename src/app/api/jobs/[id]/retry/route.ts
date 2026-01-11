import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id

    // Find the job
    const job = await db.job.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if job can be retried
    if (job.status === 'RUNNING') {
      return NextResponse.json(
        { error: 'Cannot retry a running job' },
        { status: 400 }
      )
    }

    if (job.attempts >= job.maxAttempts) {
      return NextResponse.json(
        { error: 'Job has reached maximum retry attempts' },
        { status: 400 }
      )
    }

    // Reset job to pending
    const updatedJob = await db.job.update({
      where: { id: jobId },
      data: {
        status: 'PENDING',
        errorMsg: null,
        runAfter: new Date(),
        attempts: job.attempts + 1,
      },
    })

    return NextResponse.json({ job: updatedJob })
  } catch (error) {
    console.error('Failed to retry job:', error)
    return NextResponse.json(
      { error: 'Failed to retry job' },
      { status: 500 }
    )
  }
}
