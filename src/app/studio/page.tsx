import Link from 'next/link'
import { Plus, Mic2, FileText, Video, Youtube, Clock } from 'lucide-react'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { EpisodeStatus } from '@prisma/client'

export const metadata = {
  title: 'Studio',
  description: 'Your creator dashboard',
}

const statusLabels: Record<EpisodeStatus, string> = {
  IDEA: 'Idea',
  OUTLINE: 'Outline',
  SCRIPT: 'Script Ready',
  READY_TO_RECORD: 'Ready to Record',
  RECORDED: 'Recorded',
  PROCESSING: 'Processing',
  PROCESSED: 'Processed',
  PUBLISHED: 'Published',
}

const statusColors: Record<EpisodeStatus, string> = {
  IDEA: 'bg-gray-100 text-gray-700',
  OUTLINE: 'bg-blue-100 text-blue-700',
  SCRIPT: 'bg-indigo-100 text-indigo-700',
  READY_TO_RECORD: 'bg-purple-100 text-purple-700',
  RECORDED: 'bg-orange-100 text-orange-700',
  PROCESSING: 'bg-yellow-100 text-yellow-700',
  PROCESSED: 'bg-green-100 text-green-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
}

async function getRecentEpisodes() {
  if (!process.env.DATABASE_URL) {
    return [] as const
  }

  return db.episode.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      script: {
        select: { wordCount: true },
      },
      recordings: {
        select: { id: true },
      },
    },
  })
}

async function getStats() {
  if (!process.env.DATABASE_URL) {
    return { total: 0, published: 0, drafts: 0 }
  }

  const [total, published, drafts] = await Promise.all([
    db.episode.count(),
    db.episode.count({ where: { status: 'PUBLISHED' } }),
    db.episode.count({ where: { status: { not: 'PUBLISHED' } } }),
  ])
  return { total, published, drafts }
}

export default async function StudioPage() {
  const [episodes, stats] = await Promise.all([getRecentEpisodes(), getStats()])

  return (
    <div className="container py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Studio Dashboard</h1>
          <p className="text-muted-foreground">Create, record, and publish episodes</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline" size="lg">
            <Link href="/studio/record/freestyle">
              <Mic2 className="mr-2 h-4 w-4" />
              Record Freestyle
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/studio/new">
              <Plus className="mr-2 h-4 w-4" />
              New Episode
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
            <Mic2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Youtube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.drafts}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Episodes</CardTitle>
          <CardDescription>Your latest episodes and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {episodes.length === 0 ? (
            <div className="text-center py-8">
              <Mic2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No episodes yet</p>
              <Button asChild>
                <Link href="/studio/new">Create Your First Episode</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/studio/process/${episode.id}`}
                      className="font-medium hover:underline block truncate"
                    >
                      {episode.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[episode.status]}`}
                      >
                        {statusLabels[episode.status]}
                      </span>
                      <span>•</span>
                      <span>{formatDate(episode.updatedAt)}</span>
                      {episode.script && (
                        <>
                          <span>•</span>
                          <span>{episode.script.wordCount} words</span>
                        </>
                      )}
                      {episode.recordings.length > 0 && (
                        <>
                          <span>•</span>
                          <Video className="h-3 w-3" />
                          <span>{episode.recordings.length} recording(s)</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {episode.script && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/studio/teleprompter/${episode.id}`}>
                          <FileText className="h-3 w-3 mr-1" />
                          Teleprompter
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/studio/record/${episode.id}`}>
                        <Video className="h-3 w-3 mr-1" />
                        Record
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
