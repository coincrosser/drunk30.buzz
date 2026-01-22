'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const FaceTrackedAvatar = dynamic(() => import('@/components/FaceTrackedAvatar'), {
  ssr: false,
  loading: () => <div className="w-full aspect-square max-w-[400px] mx-auto bg-gray-800 rounded-2xl animate-pulse" />,
})

export default function AvatarStudioPage() {
  const [avatarImage, setAvatarImage] = useState<string>('/avatar-base.png')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setAvatarImage(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const startRecording = async () => {
    try {
      // Find the canvas
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) {
        alert('Avatar not loaded. Wait for it to appear.')
        return
      }

      // Get audio permission
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = audioStream

      // Get canvas stream at 30fps
      const canvasStream = canvas.captureStream(30)

      // Combine video (canvas) + audio
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ])

      // Create recorder
      let mimeType = 'video/webm;codecs=vp9,opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm'
      }

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType })
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Create download
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `avatar-${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        chunksRef.current = []

        // Stop audio
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(t => t.stop())
          audioStreamRef.current = null
        }
      }

      mediaRecorderRef.current = mediaRecorder
      
      // Start recording with 1 second chunks
      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)

    } catch (err: any) {
      console.error('Recording error:', err)
      alert('Recording failed: ' + (err.message || 'Check microphone permission'))
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur px-4 py-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">🎭 Avatar Studio</h1>
        <p className="text-gray-400 text-sm">Face-tracked avatar recording</p>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Avatar */}
        <FaceTrackedAvatar baseImage={avatarImage} width={400} height={400} />

        {/* Recording Button */}
        <div>
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-full py-5 bg-red-600 text-white rounded-2xl text-xl font-bold flex items-center justify-center gap-3 active:scale-95 shadow-xl"
            >
              <span className="w-4 h-4 bg-white rounded-full" />
              RECORD VIDEO
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-full py-5 bg-gray-700 text-white rounded-2xl text-xl font-bold flex items-center justify-center gap-3 active:scale-95 shadow-xl"
            >
              <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              STOP • {formatTime(recordingTime)}
            </button>
          )}
        </div>

        {/* Upload */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-3">📷 Custom Avatar</h2>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold active:scale-95"
          >
            Upload Image
          </button>
          {avatarImage && avatarImage !== '/avatar-base.png' && (
            <div className="mt-3 flex items-center gap-3">
              <img src={avatarImage} alt="Avatar" className="w-16 h-16 rounded-xl object-cover" />
              <span className="text-gray-400 text-sm">Custom avatar loaded</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-3">📋 How to Use</h2>
          <ol className="space-y-2 text-gray-300 list-decimal list-inside">
            <li>Tap <span className="text-green-400 font-bold">START TRACKING</span></li>
            <li>Allow camera access</li>
            <li>Move your head to test tracking</li>
            <li>Tap <span className="text-red-400 font-bold">RECORD VIDEO</span></li>
            <li>Allow microphone access</li>
            <li>Record your content!</li>
            <li>Tap <span className="font-bold">STOP</span> to save</li>
          </ol>
        </div>

        {/* Tips */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-3">💡 Tips</h2>
          <ul className="space-y-2 text-gray-300">
            <li>• Good lighting = better tracking</li>
            <li>• Face camera directly</li>
            <li>• Keep phone steady</li>
            <li>• Close other camera apps</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
