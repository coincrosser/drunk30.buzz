'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface AvatarState {
  headRotationX: number
  headRotationY: number
  leftEyeOpen: number
  rightEyeOpen: number
  mouthOpen: number
}

export default function FaceTrackedAvatar({ baseImage }: { baseImage: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [trackingStatus, setTrackingStatus] = useState<'idle' | 'initializing' | 'tracking' | 'no-face' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  
  const avatarStateRef = useRef<AvatarState>({
    headRotationX: 0,
    headRotationY: 0,
    leftEyeOpen: 1,
    rightEyeOpen: 1,
    mouthOpen: 0,
  })
  const [displayState, setDisplayState] = useState<AvatarState>(avatarStateRef.current)
  
  const faceMeshRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)
  const faceDetectedTimeRef = useRef(0)
  const isTrackingRef = useRef(false)

  const smoothValue = (current: number, target: number) => current + (target - current) * 0.6

  const getEyeOpenRatio = (landmarks: any[], indices: number[]) => {
    const top = landmarks[indices[1]], bottom = landmarks[indices[5]]
    const left = landmarks[indices[0]], right = landmarks[indices[3]]
    const v = Math.sqrt(Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2))
    const h = Math.sqrt(Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2))
    return Math.min(1, Math.max(0, (v / h) * 5))
  }

  const getMouthOpenRatio = (landmarks: any[]) => {
    const top = landmarks[13], bottom = landmarks[14]
    const left = landmarks[61], right = landmarks[291]
    const v = Math.sqrt(Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2))
    const h = Math.sqrt(Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2))
    return Math.min(1, Math.max(0, (v / h) * 4))
  }

  const getHeadRotation = (landmarks: any[]) => {
    const nose = landmarks[1], forehead = landmarks[10]
    const leftEye = landmarks[33], rightEye = landmarks[263]
    const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }
    return {
      rotationX: (forehead.y - nose.y) * 400,
      rotationY: (nose.x - eyeCenter.x) * 500,
    }
  }

  const drawAvatar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = avatarStateRef.current
    const w = canvas.width, h = canvas.height

    ctx.clearRect(0, 0, w, h)

    if (baseImgRef.current) {
      ctx.save()
      const rotateAngle = (state.headRotationY * Math.PI) / 180
      const hShift = state.headRotationY * 3
      const vShift = state.headRotationX * 2
      const scale = 1 + (Math.abs(state.headRotationY) / 30) * 0.15

      ctx.translate(w / 2, h / 2)
      ctx.rotate(rotateAngle)
      ctx.scale(scale, scale)
      ctx.translate(-w / 2 + hShift, -h / 2 + vShift)
      ctx.drawImage(baseImgRef.current, 0, 0, w, h)
      ctx.restore()

      const avgEye = (state.leftEyeOpen + state.rightEyeOpen) / 2
      if (avgEye < 0.85) {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, (1 - avgEye) * 2.5)})`
        ctx.fillRect(w * 0.20, h * 0.26, w * 0.25, h * 0.14)
        ctx.fillRect(w * 0.50, h * 0.26, w * 0.25, h * 0.14)
      }

      if (state.mouthOpen > 0.08) {
        ctx.fillStyle = `rgba(40,5,5,${Math.min(0.95, state.mouthOpen * 2)})`
        ctx.beginPath()
        ctx.ellipse(w * 0.5, h * 0.73, w * 0.14, h * 0.02 + state.mouthOpen * h * 0.1, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      if (isTrackingRef.current) {
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 4
        ctx.strokeRect(2, 2, w - 4, h - 4)
      }
    } else {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#888'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Loading...', w / 2, h / 2)
    }
  }, [])

  useEffect(() => {
    let running = true
    const animate = () => {
      if (!running) return
      drawAvatar()
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => { running = false; if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [drawAvatar])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { baseImgRef.current = img }
    img.src = baseImage
  }, [baseImage])

  const initFaceTracking = useCallback(async () => {
    try {
      setTrackingStatus('initializing')
      setError(null)

      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      if (!(window as any).FaceMesh) {
        await new Promise((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'
          s.onload = res; s.onerror = rej
          document.head.appendChild(s)
        })
      }

      const faceMesh = new (window as any).FaceMesh({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      })

      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 })

      faceMesh.onResults((results: any) => {
        if (results.multiFaceLandmarks?.[0]) {
          const lm = results.multiFaceLandmarks[0]
          faceDetectedTimeRef.current = Date.now()

          const prev = avatarStateRef.current
          avatarStateRef.current = {
            headRotationX: smoothValue(prev.headRotationX, getHeadRotation(lm).rotationX),
            headRotationY: smoothValue(prev.headRotationY, getHeadRotation(lm).rotationY),
            leftEyeOpen: smoothValue(prev.leftEyeOpen, getEyeOpenRatio(lm, [33, 160, 158, 133, 153, 144])),
            rightEyeOpen: smoothValue(prev.rightEyeOpen, getEyeOpenRatio(lm, [263, 387, 385, 362, 380, 373])),
            mouthOpen: smoothValue(prev.mouthOpen, getMouthOpenRatio(lm)),
          }
          setDisplayState({ ...avatarStateRef.current })
          if (!isTrackingRef.current) { isTrackingRef.current = true; setTrackingStatus('tracking') }
        } else if (Date.now() - faceDetectedTimeRef.current > 2000) {
          setTrackingStatus('no-face')
        }
      })

      faceMeshRef.current = faceMesh
      isTrackingRef.current = true
      setTrackingStatus('tracking')

      const sendFrame = async () => {
        if (videoRef.current && faceMeshRef.current && isTrackingRef.current) {
          await faceMeshRef.current.send({ image: videoRef.current })
        }
        if (isTrackingRef.current) requestAnimationFrame(sendFrame)
      }
      sendFrame()

    } catch (err: any) {
      setTrackingStatus('error')
      if (err.name === 'NotAllowedError') setError('Camera denied. Tap lock icon → Allow camera.')
      else if (err.name === 'NotFoundError') setError('No camera found.')
      else if (err.name === 'NotReadableError') setError('Camera busy. Close other apps.')
      else setError(err.message)
    }
  }, [])

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setTrackingStatus('idle')
  }, [])

  return (
    <div className="w-full max-w-lg mx-auto">
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      
      {/* Avatar */}
      <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={400} height={400} className="w-full h-full" />
        <div className="absolute top-3 left-3">
          <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
            trackingStatus === 'tracking' ? 'bg-green-500 animate-pulse' :
            trackingStatus === 'no-face' ? 'bg-yellow-500' :
            trackingStatus === 'error' ? 'bg-red-500' :
            trackingStatus === 'initializing' ? 'bg-blue-500' : 'bg-gray-600'
          } text-white`}>
            {trackingStatus === 'tracking' ? '🟢 LIVE' :
             trackingStatus === 'no-face' ? '⚠️ NO FACE' :
             trackingStatus === 'initializing' ? '⏳ LOADING' :
             trackingStatus === 'error' ? '❌ ERROR' : '⚫ READY'}
          </span>
        </div>
      </div>

      {/* BIG START BUTTON */}
      <div className="mt-6">
        {trackingStatus === 'idle' || trackingStatus === 'error' ? (
          <button onClick={initFaceTracking} className="w-full py-6 bg-green-600 text-white rounded-2xl text-2xl font-bold active:scale-95 transition-transform shadow-xl">
            🎥 START TRACKING
          </button>
        ) : (
          <button onClick={stopTracking} className="w-full py-6 bg-red-600 text-white rounded-2xl text-2xl font-bold active:scale-95 transition-transform shadow-xl">
            ⏹ STOP
          </button>
        )}
      </div>

      {/* Debug Info */}
      {trackingStatus === 'tracking' && (
        <div className="mt-4 bg-gray-900 rounded-2xl p-4 border-2 border-green-500">
          <div className="grid grid-cols-2 gap-2 text-xl font-mono">
            <div>↔️ <span className="text-green-400">{displayState.headRotationY.toFixed(0)}°</span></div>
            <div>↕️ <span className="text-green-400">{displayState.headRotationX.toFixed(0)}°</span></div>
            <div>👁️ <span className="text-green-400">{(displayState.leftEyeOpen * 100).toFixed(0)}%</span></div>
            <div>👁️ <span className="text-green-400">{(displayState.rightEyeOpen * 100).toFixed(0)}%</span></div>
            <div className="col-span-2">👄 <span className="text-green-400">{(displayState.mouthOpen * 100).toFixed(0)}%</span></div>
          </div>
        </div>
      )}

      {error && <div className="mt-4 bg-red-900 rounded-2xl p-4 text-red-100 text-lg">{error}</div>}
    </div>
  )
}
