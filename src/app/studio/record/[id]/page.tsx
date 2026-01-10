'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Circle,
  Square,
  Upload,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Play,
  Pause,
  Camera,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatDuration } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'uploading' | 'uploaded'

interface Episode {
  id: string
  title: string
  episodeNumber: number
}

export default function RecordPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [episode, setEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [hasVideoPermission, setHasVideoPermission] = useState(false)
  const [hasAudioPermission, setHasAudioPermission] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [duration, setDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch episode data
  useEffect(() => {
    async function fetchEpisode() {
      try {
        const response = await fetch(`/api/episodes/${params.id}`)
        if (!response.ok) throw new Error('Episode not found')
        const data = await response.json()
        setEpisode(data.episode)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load episode')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchEpisode()
  }, [params.id])

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: videoEnabled
          ? {
              facingMode: facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : false,
        audio: audioEnabled
          ? {
              echoCancellation: true,
              noiseSuppression: true,
            }
          : false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setHasVideoPermission(stream.getVideoTracks().length > 0)
      setHasAudioPermission(stream.getAudioTracks().length > 0)
    } catch (err) {
      console.error('Failed to access camera:', err)
      toast({
        title: 'Camera Access Denied',
        description: 'Please allow camera and microphone access to record.',
        variant: 'destructive',
      })
    }
  }, [videoEnabled, audioEnabled, facingMode, toast])

  useEffect(() => {
    initializeCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [initializeCamera])

  const startRecording = () => {
    if (!streamRef.current) return

    chunksRef.current = []
    const options = { mimeType: 'video/webm;codecs=vp9,opus' }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setRecordedBlob(blob)

        // Create preview URL
        if (previewRef.current) {
          previewRef.current.src = URL.createObjectURL(blob)
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setRecordingState('recording')
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      toast({
        title: 'Recording Failed',
        description: 'Could not start recording. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setRecordingState('paused')
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setRecordingState('recording')
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setRecordingState('stopped')
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const resetRecording = () => {
    setRecordedBlob(null)
    setDuration(0)
    setRecordingState('idle')
    if (previewRef.current) {
      previewRef.current.src = ''
    }
  }

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  const uploadRecording = async () => {
    if (!recordedBlob || !episode) return

    setRecordingState('uploading')
    setUploadProgress(0)

    try {
      // Get upload URL
      const urlResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: episode.id,
          filename: `episode-${episode.episodeNumber}-raw.webm`,
          contentType: 'video/webm',
          size: recordedBlob.size,
        }),
      })

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, assetId } = await urlResponse.json()

      // Upload to Supabase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'video/webm' },
        body: recordedBlob,
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      // Confirm upload
      await fetch(`/api/upload/${assetId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration }),
      })

      setRecordingState('uploaded')
      setUploadProgress(100)

      toast({
        title: 'Upload Complete',
        description: 'Your recording has been saved successfully.',
      })
    } catch (err) {
      console.error('Upload failed:', err)
      setRecordingState('stopped')
      toast({
        title: 'Upload Failed',
        description: err instanceof Error ? err.message : 'Could not upload recording.',
        variant: 'destructive',
      })
    }
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Record Episode
          </CardTitle>
          <CardDescription>
            Record your video directly from your browser. Use front camera for selfie-style recording.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Preview */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {recordingState === 'stopped' || recordingState === 'uploaded' ? (
              <video
                ref={previewRef}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            ) : (
              <video
                ref={videoRef}
                className={cn(
                  'w-full h-full object-cover',
                  facingMode === 'user' && 'scale-x-[-1]'
                )}
                autoPlay
                muted
                playsInline
              />
            )}

            {/* Recording indicator */}
            {recordingState === 'recording' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                REC
              </div>
            )}

            {recordingState === 'paused' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-yellow-600 text-white px-3 py-1 rounded-full text-sm">
                <Pause className="h-3 w-3" />
                PAUSED
              </div>
            )}

            {/* Duration */}
            {(recordingState === 'recording' || recordingState === 'paused' || recordingState === 'stopped') && (
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-mono">
                {formatDuration(duration)}
              </div>
            )}

            {/* Permission warning */}
            {(!hasVideoPermission || !hasAudioPermission) && recordingState === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white p-6">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <p className="text-lg font-medium mb-2">Camera Access Required</p>
                  <p className="text-sm text-white/70 mb-4">
                    Please allow camera and microphone access to record.
                  </p>
                  <Button onClick={initializeCamera}>
                    Grant Access
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {recordingState === 'idle' && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={cn(!videoEnabled && 'text-destructive')}
                >
                  {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full h-16 w-16"
                  onClick={startRecording}
                  disabled={!hasVideoPermission && !hasAudioPermission}
                >
                  <Circle className="h-6 w-6 fill-current" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={cn(!audioEnabled && 'text-destructive')}
                >
                  {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button variant="outline" size="icon" onClick={toggleCamera}>
                  <Camera className="h-5 w-5" />
                </Button>
              </>
            )}

            {recordingState === 'recording' && (
              <>
                <Button variant="outline" size="icon" onClick={pauseRecording}>
                  <Pause className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-16 w-16"
                  onClick={stopRecording}
                >
                  <Square className="h-6 w-6 fill-current" />
                </Button>
              </>
            )}

            {recordingState === 'paused' && (
              <>
                <Button variant="outline" size="icon" onClick={resumeRecording}>
                  <Play className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-16 w-16"
                  onClick={stopRecording}
                >
                  <Square className="h-6 w-6 fill-current" />
                </Button>
              </>
            )}

            {recordingState === 'stopped' && (
              <>
                <Button variant="outline" onClick={resetRecording}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Re-record
                </Button>
                <Button onClick={uploadRecording}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Recording
                </Button>
              </>
            )}

            {recordingState === 'uploading' && (
              <div className="flex items-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Uploading... {uploadProgress}%</span>
              </div>
            )}

            {recordingState === 'uploaded' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Uploaded successfully
                </div>
                <Button onClick={() => router.push(`/studio/process/${episode.id}`)}>
                  Continue to Processing
                </Button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Recording Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Find good lighting — natural light works best</li>
              <li>Use a quiet environment or speak clearly</li>
              <li>Keep your phone steady or use a tripod</li>
              <li>Tap pause if you need a moment</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
