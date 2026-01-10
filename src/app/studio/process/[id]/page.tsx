'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Circle,
  XCircle,
  Play,
  RefreshCw,
  FileVideo,
  FileAudio,
  Image,
  Scissors,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatDuration, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
type JobType = 'TRANSCODE' | 'GENERATE_THUMBNAIL' | 'EXTRACT_AUDIO' | 'GENERATE_SHORTS' | 'PUBLISH_YOUTUBE'

interface Job {
  id: string
  type: JobType
  status: JobStatus
  progress: number | null
  error: string | null
  createdAt: string
  updatedAt: string
}

interface Asset {
  id: string
  type: string
  filename: string
  url: string | null
  size: number
  duration: number | null
}

interface Episode {
  id: string
  title: string
  episodeNumber: number
  status: string
  recordings: Array<{
    id: string
    duration: number
    createdAt: string
  }>
  assets: Asset[]
  jobs: Job[]
}

const JOB_LABELS: Record<JobType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  TRANSCODE: { label: 'Transcode Video', icon: FileVideo },
  GENERATE_THUMBNAIL: { label: 'Generate Thumbnail', icon: Image },
  EXTRACT_AUDIO: { label: 'Extract Audio', icon: FileAudio },
  GENERATE_SHORTS: { label: 'Generate Shorts', icon: Scissors },
  PUBLISH_YOUTUBE: { label: 'Publish to YouTube', icon: Play },
}

export default function ProcessPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [episode, setEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)

  const fetchEpisode = useCallback(async () => {
    try {
      const response = await fetch(`/api/episodes/${params.id}?include=recordings,assets,jobs`)
      if (!response.ok) throw new Error('Episode not found')
      const data = await response.json()
      setEpisode(data.episode)
      return data.episode
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load episode')
      return null
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) fetchEpisode()
  }, [params.id, fetchEpisode])

  // Poll for job updates when there are running jobs
  useEffect(() => {
    if (!episode) return

    const hasRunningJobs = episode.jobs.some((job) => job.status === 'RUNNING' || job.status === 'PENDING')
    
    if (hasRunningJobs && !polling) {
      setPolling(true)
      const interval = setInterval(async () => {
        const updated = await fetchEpisode()
        if (updated) {
          const stillRunning = updated.jobs.some(
            (job: Job) => job.status === 'RUNNING' || job.status === 'PENDING'
          )
          if (!stillRunning) {
            setPolling(false)
            clearInterval(interval)
          }
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [episode, polling, fetchEpisode])

  const startJob = async (type: JobType) => {
    if (!episode) return

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: episode.id,
          type,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start job')
      }

      toast({
        title: 'Job Started',
        description: `${JOB_LABELS[type].label} has been queued.`,
      })

      fetchEpisode()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to start job',
        variant: 'destructive',
      })
    }
  }

  const retryJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/retry`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to retry job')

      toast({
        title: 'Job Retried',
        description: 'The job has been queued again.',
      })

      fetchEpisode()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to retry job',
        variant: 'destructive',
      })
    }
  }

  const getJobStatus = (type: JobType): Job | undefined => {
    return episode?.jobs.find((job) => job.type === type)
  }

  const renderJobStatus = (job: Job | undefined, type: JobType) => {
    const { label, icon: Icon } = JOB_LABELS[type]

    if (!job) {
      return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-sm text-muted-foreground">Not started</p>
            </div>
          </div>
          <Button size="sm" onClick={() => startJob(type)}>
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        </div>
      )
    }

    const statusIcons: Record<JobStatus, React.ReactNode> = {
      PENDING: <Clock className="h-5 w-5 text-muted-foreground" />,
      RUNNING: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
      COMPLETED: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      FAILED: <XCircle className="h-5 w-5 text-destructive" />,
    }

    return (
      <div
        className={cn(
          'flex items-center justify-between p-4 border rounded-lg',
          job.status === 'RUNNING' && 'border-blue-500/50 bg-blue-500/5',
          job.status === 'COMPLETED' && 'border-green-500/50 bg-green-500/5',
          job.status === 'FAILED' && 'border-destructive/50 bg-destructive/5'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">
              {job.status === 'PENDING' && 'Queued...'}
              {job.status === 'RUNNING' && `Processing${job.progress ? ` (${job.progress}%)` : '...'}`}
              {job.status === 'COMPLETED' && 'Completed'}
              {job.status === 'FAILED' && (job.error || 'Failed')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusIcons[job.status]}
          {job.status === 'FAILED' && (
            <Button size="sm" variant="outline" onClick={() => retryJob(job.id)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      </div>
    )
  }

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

  const hasRecording = episode.recordings.length > 0
  const latestRecording = episode.recordings[0]

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/studio')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-sm text-muted-foreground">
          Episode {episode.episodeNumber}: {episode.title}
        </div>
      </div>

      {/* Recording Info */}
      {hasRecording ? (
        <Card>
          <CardHeader>
            <CardTitle>Raw Recording</CardTitle>
            <CardDescription>
              Recorded {formatDate(latestRecording.createdAt)} • Duration:{' '}
              {formatDuration(latestRecording.duration)}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Recording Yet</CardTitle>
            <CardDescription>
              Record your episode first before processing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/studio/record/${episode.id}`)}>
              Go to Recording
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Processing Jobs */}
      {hasRecording && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Jobs</CardTitle>
            <CardDescription>
              Process your recording to prepare it for publishing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderJobStatus(getJobStatus('TRANSCODE'), 'TRANSCODE')}
            {renderJobStatus(getJobStatus('EXTRACT_AUDIO'), 'EXTRACT_AUDIO')}
            {renderJobStatus(getJobStatus('GENERATE_THUMBNAIL'), 'GENERATE_THUMBNAIL')}
            {renderJobStatus(getJobStatus('GENERATE_SHORTS'), 'GENERATE_SHORTS')}
          </CardContent>
        </Card>
      )}

      {/* Assets */}
      {episode.assets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Assets</CardTitle>
            <CardDescription>
              Files created from processing your recording.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {episode.assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {asset.type === 'PROCESSED_VIDEO' && <FileVideo className="h-5 w-5" />}
                    {asset.type === 'AUDIO' && <FileAudio className="h-5 w-5" />}
                    {asset.type === 'THUMBNAIL' && <Image className="h-5 w-5" />}
                    {asset.type === 'SHORT_CLIP' && <Scissors className="h-5 w-5" />}
                    <div>
                      <p className="font-medium text-sm">{asset.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {(asset.size / 1024 / 1024).toFixed(2)} MB
                        {asset.duration && ` • ${formatDuration(asset.duration)}`}
                      </p>
                    </div>
                  </div>
                  {asset.url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={asset.url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {hasRecording && (
        <div className="flex justify-end">
          <Button onClick={() => router.push(`/studio/youtube-pack/${episode.id}`)}>
            Continue to YouTube Pack
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
