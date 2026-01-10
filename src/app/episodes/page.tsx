import Link from 'next/link'
import { Play, Clock, Calendar } from 'lucide-react'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDuration } from '@/lib/utils'

export const metadata = {
  title: 'Episodes',
  description: 'Watch all episodes of drunk30.buzz',
}

export const revalidate = 60

async function getPublishedEpisodes() {
  if (!process.env.DATABASE_URL) {
    // No DB configured in this environment (e.g., CI/build). Return an empty list so the
    // site can still build and render placeholder content.
    return [] as const
  }

  return db.episode.findMany({
    where: {
      isPublic: true,
      status: 'PUBLISHED',
    },
    orderBy: {
      publishedAt: 'desc',
    },
    include: {
      script: {
        select: {
          estDurationMs: true,
        },
      },
    },
  })
} 

export default async function EpisodesPage() {
  const episodes = await getPublishedEpisodes()

  if (episodes.length === 0) {
    return (
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">Episodes</h1>
          <p className="text-muted-foreground mb-8">
            No episodes published yet. Check back soon!
          </p>
          <Button asChild>
            <Link href="/join">Get Notified When We Launch</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Episodes</h1>
          <p className="text-muted-foreground">
            All episodes of drunk30.buzz. Build anyway. Recover loudly. Ship consistently.
          </p>
        </div>

        <div className="grid gap-6">
          {episodes.map((episode, index) => (
            <Link key={episode.id} href={`/episodes/${episode.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="font-mono">#{episodes.length - index}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(episode.publishedAt || episode.createdAt)}</span>
                        {episode.script?.estDurationMs && (
                          <>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(episode.script.estDurationMs)}</span>
                          </>
                        )}
                      </div>
                      <CardTitle className="text-xl">{episode.title}</CardTitle>
                      {episode.description && (
                        <CardDescription className="mt-2 line-clamp-2">
                          {episode.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
