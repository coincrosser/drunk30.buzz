'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'

const FaceTrackedAvatar = dynamic(() => import('@/components/FaceTrackedAvatar'), {
  ssr: false,
  loading: () => <div className="w-full aspect-square bg-gray-800 rounded-3xl animate-pulse" />,
})

export default function AvatarStudioPage() {
  const [avatarImage, setAvatarImage] = useState<string>('/avatar-base.png')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
      const canvas = document.querySelector('canvas')
      if (!canvas) return

      // Get audio stream
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const canvasStream = canvas.captureStream(30)
      
      // Combine video and audio
      const combined = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ])

      const mediaRecorder = new MediaRecorder(combined, {
        mimeType: 'video/webm;codecs=vp9,opus',
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `avatar-${Date.now()}.webm`
        a.click()
        chunksRef.current = []
        audioStream.getTracks().forEach(t => t.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    } catch (err) {
      console.error('Recording error:', err)
      alert('Could not start recording. Check microphone permission.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur px-4 py-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">🎭 Avatar Studio</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar Component */}
        <FaceTrackedAvatar baseImage={avatarImage} />

        {/* Recording Controls */}
        <div className="space-y-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-full py-5 bg-red-600 text-white rounded-2xl text-xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl"
            >
              <span className="w-4 h-4 bg-white rounded-full" />
              RECORD VIDEO
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-full py-5 bg-gray-700 text-white rounded-2xl text-xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl"
            >
              <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              STOP • {formatTime(recordingTime)}
            </button>
          )}
        </div>

        {/* Upload Custom Avatar */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-3">📷 Custom Avatar</h2>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold active:scale-95 transition-transform"
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

        {/* Tips */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-3">💡 Tips</h2>
          <ul className="space-y-2 text-gray-300">
            <li>• Tap <span className="text-green-400 font-bold">START TRACKING</span> first</li>
            <li>• Good lighting = better tracking</li>
            <li>• Face the camera directly</li>
            <li>• Move your head to test</li>
            <li>• Tap <span className="text-red-400 font-bold">RECORD</span> when ready</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
