import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, Share2, Youtube } from 'lucide-react'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDuration } from '@/lib/utils'

interface EpisodePageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 60

async function getEpisode(id: string) {
  return db.episode.findUnique({
    where: { id },
    include: {
      script: true,
      assets: {
        where: {
          type: 'PROCESSED_VIDEO',
        },
        take: 1,
      },
      youtubePack: true,
    },
  })
}

export async function generateMetadata({ params }: EpisodePageProps) {
  const { id } = await params
  const episode = await getEpisode(id)

  if (!episode) {
    return { title: 'Episode Not Found' }
  }

  return {
    title: episode.title,
    description: episode.description || `Watch ${episode.title} on drunk30.buzz`,
  }
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { id } = await params
  const episode = await getEpisode(id)

  if (!episode || !episode.isPublic) {
    notFound()
  }

  const videoAsset = episode.assets[0]

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/episodes"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Episodes
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4">{episode.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(episode.publishedAt || episode.createdAt)}</span>
              </div>
              {episode.script?.estDurationMs && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(episode.script.estDurationMs)}</span>
                </div>
              )}
            </div>
          </header>

          {videoAsset && (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-8">
              <video
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.STORAGE_BUCKET || 'assets'}/${videoAsset.storagePath}`}
                controls
                className="w-full h-full"
                poster=""
              />
            </div>
          )}

          {!videoAsset && (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-8 flex items-center justify-center">
              <p className="text-muted-foreground">Video coming soon</p>
            </div>
          )}

          {episode.description && (
            <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
              <p className="text-lg">{episode.description}</p>
            </div>
          )}

          {episode.youtubePack && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Youtube className="h-5 w-5" />
                  Watch on YouTube
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {episode.youtubePack.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {episode.youtubePack.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {episode.youtubePack.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/join">
                Get Notified of New Episodes
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/episodes">
                More Episodes
              </Link>
            </Button>
          </div>
        </article>
      </div>
    </div>
  )
}
