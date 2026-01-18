'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Teleprompter } from '@/components/teleprompter'

interface Episode {
  id: string
  title: string
  script: {
    content: string
  } | null
}

export default function TeleprompterPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEpisode() {
      try {
        const response = await fetch(`/api/episodes/${params.id}`)
        if (!response.ok) {
          throw new Error('Episode not found')
        }
        const data = await response.json()
        setEpisode(data.episode)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load episode')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchEpisode()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !episode) {
    return (
      <div className="container max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Episode Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || 'Could not load episode'}</p>
        <Button onClick={() => router.push('/studio')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Studio
        </Button>
      </div>
    )
  }

  if (!episode.script?.content) {
    return (
      <div className="container max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">No Script Available</h1>
        <p className="text-muted-foreground mb-6">
          This episode doesn't have a script yet. Create one first.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => router.push('/studio')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Studio
          </Button>
          <Button onClick={() => router.push(`/studio/new?edit=${episode.id}`)}>
            Create Script
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/studio')}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Exit
        </Button>
      </div>
      <Teleprompter script={episode.script.content} title={episode.title} />
    </div>
  )
}
