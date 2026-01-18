'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'

const FaceTrackedAvatar = dynamic(() => import('@/components/FaceTrackedAvatar'), {
  ssr: false,
  loading: () => <div className="w-[400px] h-[400px] bg-gray-800 rounded-lg animate-pulse" />,
})

export default function AvatarStudioPage() {
  const [avatarImage, setAvatarImage] = useState<string>('/avatar-base.png')
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const startRecording = async () => {
    try {
      const canvas = document.querySelector('canvas')
      if (!canvas) return

      const stream = canvas.captureStream(30)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `avatar-recording-${Date.now()}.webm`
        a.click()
        chunksRef.current = []
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Recording error:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-2">🎭 Avatar Studio</h1>
      <p className="text-gray-400 mb-6">Face-tracked avatar for your recordings</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Avatar Preview</h2>
          
          <FaceTrackedAvatar baseImage={avatarImage} width={400} height={400} />

          <div className="mt-4 flex gap-2">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                <span className="w-3 h-3 bg-white rounded-full" />
                Record Avatar
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
              >
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                Stop Recording
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Avatar Image</h2>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Upload Custom Avatar
            </button>
            
            <p className="text-sm text-gray-400 mt-2">
              High-contrast black & white images work best
            </p>

            {avatarImage && (
              <div className="mt-4">
                <img
                  src={avatarImage}
                  alt="Avatar"
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">💡 How to Use</h2>
            <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
              <li>Click "Start Face Tracking"</li>
              <li>Allow camera access when prompted</li>
              <li>Your avatar mimics your expressions</li>
              <li>Click "Record Avatar" to capture video</li>
              <li>Use the video in your content!</li>
            </ol>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">⚡ Tips</h2>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Good lighting improves tracking</li>
              <li>• Keep face centered in frame</li>
              <li>• Head movement is subtle (cinematic)</li>
              <li>• Blinks and mouth are tracked</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
