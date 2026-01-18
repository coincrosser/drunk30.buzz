"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  RotateCcw,
  Play,
  Pause,
  Camera,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDuration } from '@/lib/utils'

const FaceTrackedAvatar = dynamic(() => import('@/components/FaceTrackedAvatar'), { ssr: false })

// Freestyle recorder: no episode required. User records locally and can download or jump to YouTube upload.

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'

type FacingMode = 'user' | 'environment'

type RecordMode = 'camera' | 'avatar'

export default function FreestyleRecordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [title, setTitle] = useState('Freestyle Session')
  const [notes, setNotes] = useState('')
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [hasVideoPermission, setHasVideoPermission] = useState(false)
  const [hasAudioPermission, setHasAudioPermission] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [duration, setDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [facingMode, setFacingMode] = useState<FacingMode>('user')
  const [recordMode, setRecordMode] = useState<RecordMode>('camera')
  const [avatarImage, setAvatarImage] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const avatarCanvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const initializeCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: 'Browser Not Supported',
          description: 'Your browser does not support camera recording. Try Chrome, Firefox, or Edge.',
          variant: 'destructive',
        })
        return
      }

      const constraints: MediaStreamConstraints = {
        video: videoEnabled
          ? {
              facingMode,
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
    } catch (err: any) {
      let errorMessage = 'Please allow camera and microphone access to record.'
      if (err.name === 'NotAllowedError') errorMessage = 'Camera permission was denied. Check browser settings and try again.'
      else if (err.name === 'NotFoundError') errorMessage = 'No camera or microphone found on this device.'
      else if (err.name === 'NotReadableError') errorMessage = 'Camera is in use by another application. Close it and try again.'
      else if (err.name === 'SecurityError') errorMessage = 'Camera access requires HTTPS. If testing, use localhost.'

      toast({ title: 'Camera Access Error', description: errorMessage, variant: 'destructive' })
    }
  }, [audioEnabled, facingMode, toast, videoEnabled])

  useEffect(() => {
    initializeCamera()
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [initializeCamera])

  const startRecording = () => {
    const source = recordMode === 'avatar' && avatarCanvasRef.current ? avatarCanvasRef.current : streamRef.current
    if (!source) return

    chunksRef.current = []
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
    ]

    let selectedMimeType = ''
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType
        break
      }
    }
    if (!selectedMimeType && MediaRecorder.isTypeSupported('audio/webm')) {
      selectedMimeType = 'audio/webm'
    }

    try {
      let recordStream: MediaStream
      if (recordMode === 'avatar' && avatarCanvasRef.current) {
        const canvasStream = avatarCanvasRef.current.captureStream(30)
        if (streamRef.current) {
          const audioTracks = streamRef.current.getAudioTracks()
          audioTracks.forEach((track) => canvasStream.addTrack(track))
        }
        recordStream = canvasStream
      } else {
        recordStream = streamRef.current!
      }

      const options = selectedMimeType ? { mimeType: selectedMimeType } : {}
      const mediaRecorder = new MediaRecorder(recordStream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const mimeType = selectedMimeType || 'video/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        if (previewRef.current) {
          previewRef.current.src = URL.createObjectURL(blob)
        }
      }

      mediaRecorder.start(1000)
      setRecordingState('recording')
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000)
      toast({ title: 'Recording Started', description: `Recording in ${selectedMimeType || 'default format'}` })
    } catch (err: any) {
      toast({
        title: 'Recording Failed',
        description: err.message || 'Could not start recording. Please try again.',
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
      timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording' || mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.stop()
      setRecordingState('stopped')
      if (timerRef.current) clearInterval(timerRef.current)
      toast({ title: 'Recording Stopped', description: 'Preview is ready below.' })
    }
  }

  const resetRecording = () => {
    setRecordedBlob(null)
    setRecordingState('idle')
    setDuration(0)
    if (previewRef.current?.src) {
      URL.revokeObjectURL(previewRef.current.src)
      previewRef.current.src = ''
    }
  }

  const downloadRecording = () => {
    if (!recordedBlob) return
    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'freestyle'}-${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAvatarImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setAvatarImage(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="container py-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/studio')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Record Freestyle</h1>
          <p className="text-muted-foreground">Skip the guided flow. Record locally, then upload anywhere.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Capture</CardTitle>
            <CardDescription>Record video/audio locally. Nothing is uploaded automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-2">
              <Button
                variant={recordMode === 'camera' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecordMode('camera')}
              >
                <Camera className="h-4 w-4 mr-2" /> Camera
              </Button>
              <Button
                variant={recordMode === 'avatar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecordMode('avatar')}
              >
                <User className="h-4 w-4 mr-2" /> Avatar
              </Button>
            </div>

            <div className="relative aspect-video rounded-lg border bg-black overflow-hidden">
              {recordMode === 'camera' ? (
                <>
                  <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                  {!hasVideoPermission && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-center px-4">
                      <p>Allow camera access to start recording.</p>
                    </div>
                  )}
                </>
              ) : (
                <FaceTrackedAvatar canvasRef={avatarCanvasRef} avatarImage={avatarImage} />
              )}
            </div>

            {recordMode === 'avatar' && !avatarImage && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Avatar Image</label>
                <Input type="file" accept="image/*" onChange={handleAvatarImageUpload} />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {recordingState === 'idle' && (
                <Button onClick={startRecording} disabled={!hasAudioPermission && !hasVideoPermission}>
                  <Circle className="h-4 w-4 mr-2 fill-current" /> Start Recording
                </Button>
              )}
              {recordingState === 'recording' && (
                <>
                  <Button variant="secondary" onClick={pauseRecording}>
                    <Pause className="h-4 w-4 mr-2" /> Pause
                  </Button>
                  <Button variant="destructive" onClick={stopRecording}>
                    <Square className="h-4 w-4 mr-2" /> Stop
                  </Button>
                </>
              )}
              {recordingState === 'paused' && (
                <>
                  <Button onClick={resumeRecording}>
                    <Play className="h-4 w-4 mr-2" /> Resume
                  </Button>
                  <Button variant="destructive" onClick={stopRecording}>
                    <Square className="h-4 w-4 mr-2" /> Stop
                  </Button>
                </>
              )}
              {recordingState === 'stopped' && (
                <>
                  <Button onClick={resetRecording} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" /> Record Again
                  </Button>
                  <Button onClick={downloadRecording}>
                    <Upload className="h-4 w-4 mr-2" /> Download
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="https://studio.youtube.com/channel/" target="_blank">
                      <Video className="h-4 w-4 mr-2" /> Upload to YouTube
                    </Link>
                  </Button>
                </>
              )}

              <Button
                type="button"
                variant={videoEnabled ? 'outline' : 'secondary'}
                onClick={() => setVideoEnabled((v) => !v)}
              >
                {videoEnabled ? <Video className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />} Video
              </Button>
              <Button
                type="button"
                variant={audioEnabled ? 'outline' : 'secondary'}
                onClick={() => setAudioEnabled((v) => !v)}
              >
                {audioEnabled ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />} Audio
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFacingMode((mode) => (mode === 'user' ? 'environment' : 'user'))}
              >
                <Camera className="h-4 w-4 mr-2" /> Flip Camera
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Status:</span> {recordingState === 'recording' ? 'Recording' : recordingState}
              {recordingState !== 'idle' && (
                <span className="ml-2 inline-flex items-center gap-2">
                  <span className={cn('inline-flex h-2 w-2 rounded-full', recordingState === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-gray-400')} />
                  {formatDuration(duration * 1000)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>Optional notes; kept local only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Freestyle title" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Talking points or reminders" rows={4} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview & Download</CardTitle>
              <CardDescription>Nothing uploads until you choose to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="aspect-video rounded-lg border overflow-hidden bg-black">
                <video ref={previewRef} controls playsInline className="h-full w-full object-cover" />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={downloadRecording} disabled={!recordedBlob}>
                  {recordedBlob ? <Upload className="h-4 w-4 mr-2" /> : <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {recordedBlob ? 'Download Recording' : 'Waiting for recording...'}
                </Button>
                <Button asChild variant="secondary" disabled={!recordedBlob}>
                  <Link href="https://studio.youtube.com/channel/" target="_blank">
                    <Video className="h-4 w-4 mr-2" /> Upload to YouTube
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
