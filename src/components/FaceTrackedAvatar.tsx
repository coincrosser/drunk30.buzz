'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface AvatarState {
  headRotationX: number
  headRotationY: number
  leftEyeOpen: number
  rightEyeOpen: number
  mouthOpen: number
  faceY: number
}

export default function FaceTrackedAvatar({ 
  baseImage, 
  width = 400, 
  height = 400 
}: { 
  baseImage: string
  width?: number
  height?: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [trackingStatus, setTrackingStatus] = useState<'idle' | 'initializing' | 'tracking' | 'no-face' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [showCamPreview, setShowCamPreview] = useState(true)
  
  const avatarStateRef = useRef<AvatarState>({
    headRotationX: 0, headRotationY: 0, leftEyeOpen: 1, rightEyeOpen: 1, mouthOpen: 0, faceY: 0.5
  })
  const [displayState, setDisplayState] = useState<AvatarState>(avatarStateRef.current)
  
  const faceMeshRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)
  const faceDetectedTimeRef = useRef(0)
  const isTrackingRef = useRef(false)

  const CANVAS_W = 400
  const CANVAS_H = 400

  const smoothValue = (current: number, target: number, factor = 0.5) => current + (target - current) * factor

  const getEyeOpenRatio = (landmarks: any[], indices: number[]) => {
    try {
      const top = landmarks[indices[1]], bottom = landmarks[indices[5]]
      const left = landmarks[indices[0]], right = landmarks[indices[3]]
      const v = Math.sqrt(Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2))
      const h = Math.sqrt(Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2))
      if (h === 0) return 1
      return Math.min(1, Math.max(0, (v / h) * 4.5))
    } catch { return 1 }
  }

  const getMouthOpenRatio = (landmarks: any[]) => {
    try {
      const upperInner = landmarks[13]
      const lowerInner = landmarks[14]
      const left = landmarks[61]
      const right = landmarks[291]
      
      const v = Math.sqrt(Math.pow(upperInner.x - lowerInner.x, 2) + Math.pow(upperInner.y - lowerInner.y, 2))
      const h = Math.sqrt(Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2))
      
      if (h === 0) return 0
      return Math.min(1, Math.max(0, (v / h) * 5))
    } catch { return 0 }
  }

  const getHeadRotation = (landmarks: any[]) => {
    try {
      const nose = landmarks[1], forehead = landmarks[10]
      const leftEye = landmarks[33], rightEye = landmarks[263], chin = landmarks[152]
      const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }
      const faceY = (nose.y + chin.y) / 2
      return { 
        rotationX: (forehead.y - nose.y) * 350,
        rotationY: (nose.x - eyeCenter.x) * 450,
        faceY
      }
    } catch { return { rotationX: 0, rotationY: 0, faceY: 0.5 } }
  }

  const drawAvatar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = avatarStateRef.current
    const w = CANVAS_W, h = CANVAS_H

    ctx.clearRect(0, 0, w, h)

    if (baseImgRef.current) {
      ctx.save()
      
      // HEAD MOVEMENT
      const rotateAngle = (state.headRotationY * Math.PI) / 180
      const hShift = state.headRotationY * 2.5
      const vShift = state.headRotationX * 1.5
      const scale = 1 + (Math.abs(state.headRotationY) / 35) * 0.12

      ctx.translate(w / 2, h / 2)
      ctx.rotate(rotateAngle)
      ctx.scale(scale, scale)
      ctx.translate(-w / 2 + hShift, -h / 2 + vShift)
      ctx.drawImage(baseImgRef.current, 0, 0, w, h)
      ctx.restore()

      // ====== EYE BLINK - FULL SCREEN DARKEN ======
      const avgEye = (state.leftEyeOpen + state.rightEyeOpen) / 2
      if (avgEye < 0.7) {
        const blinkAmount = (1 - avgEye) * 1.5
        // Darken whole image when blinking
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.8, blinkAmount)})`
        ctx.fillRect(0, 0, w, h)
      }

      // ====== MOUTH OPEN - COLOR TINT ======
      if (state.mouthOpen > 0.08) {
        // Red/warm tint when mouth opens - VERY visible
        const mouthAmount = Math.min(1, state.mouthOpen * 2)
        ctx.fillStyle = `rgba(255, 50, 50, ${mouthAmount * 0.4})`
        ctx.fillRect(0, 0, w, h)
        
        // Also draw mouth indicator at bottom
        ctx.fillStyle = `rgba(200, 0, 0, ${mouthAmount * 0.8})`
        const mouthSize = 20 + (state.mouthOpen * 60)
        ctx.beginPath()
        ctx.ellipse(w / 2, h * 0.85, mouthSize, mouthSize / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Tracking border
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
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }

      if (!(window as any).FaceMesh) {
        await new Promise((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'
          s.onload = res; s.onerror = rej; document.head.appendChild(s)
        })
      }

      const faceMesh = new (window as any).FaceMesh({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      })
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.4, minTrackingConfidence: 0.4 })

      faceMesh.onResults((results: any) => {
        if (results.multiFaceLandmarks?.[0]) {
          const lm = results.multiFaceLandmarks[0]
          faceDetectedTimeRef.current = Date.now()
          const { rotationX, rotationY, faceY } = getHeadRotation(lm)
          const prev = avatarStateRef.current
          
          avatarStateRef.current = {
            headRotationX: smoothValue(prev.headRotationX, rotationX),
            headRotationY: smoothValue(prev.headRotationY, rotationY),
            leftEyeOpen: smoothValue(prev.leftEyeOpen, getEyeOpenRatio(lm, [33, 160, 158, 133, 153, 144]), 0.7),
            rightEyeOpen: smoothValue(prev.rightEyeOpen, getEyeOpenRatio(lm, [263, 387, 385, 362, 380, 373]), 0.7),
            mouthOpen: smoothValue(prev.mouthOpen, getMouthOpenRatio(lm), 0.7),
            faceY: smoothValue(prev.faceY, faceY),
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
          try { await faceMeshRef.current.send({ image: videoRef.current }) } catch {}
        }
        if (isTrackingRef.current) requestAnimationFrame(sendFrame)
      }
      sendFrame()
    } catch (err: any) {
      setTrackingStatus('error')
      if (err.name === 'NotAllowedError') setError('Camera denied.')
      else if (err.name === 'NotFoundError') setError('No camera.')
      else if (err.name === 'NotReadableError') setError('Camera busy.')
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
    <div className="w-full px-2">
      {/* Camera preview - shows your actual face */}
      <video 
        ref={videoRef} 
        className={showCamPreview && trackingStatus === 'tracking' ? "w-24 h-24 rounded-xl object-cover absolute top-4 right-4 z-20 border-2 border-green-500" : "hidden"} 
        autoPlay 
        playsInline 
        muted 
      />
      
      {/* Avatar */}
      <div 
        className="relative mx-auto bg-black rounded-2xl overflow-hidden shadow-xl"
        style={{ width: '90vw', height: '90vw', maxWidth: '400px', maxHeight: '400px' }}
      >
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="absolute inset-0 w-full h-full" />
        
        {/* Status */}
        <div className="absolute top-2 left-2 z-10">
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
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

      {/* Controls */}
      <div className="mt-4">
        {trackingStatus === 'idle' || trackingStatus === 'error' ? (
          <button onClick={initFaceTracking} className="w-full py-5 bg-green-600 text-white rounded-xl text-xl font-bold active:scale-95 shadow-lg">
            🎥 START TRACKING
          </button>
        ) : (
          <button onClick={stopTracking} className="w-full py-5 bg-red-600 text-white rounded-xl text-xl font-bold active:scale-95 shadow-lg">
            ⏹ STOP
          </button>
        )}
      </div>

      {/* Expression meters - BIG and visible */}
      {trackingStatus === 'tracking' && (
        <div className="mt-4 space-y-3">
          {/* Eye meter */}
          <div className="bg-gray-900 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white font-bold">👁️ EYES</span>
              <span className="text-green-400 font-mono">{(displayState.leftEyeOpen * 100).toFixed(0)}%</span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${displayState.leftEyeOpen * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Blink to see screen darken</p>
          </div>
          
          {/* Mouth meter */}
          <div className="bg-gray-900 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white font-bold">👄 MOUTH</span>
              <span className="text-green-400 font-mono">{(displayState.mouthOpen * 100).toFixed(0)}%</span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-100"
                style={{ width: `${displayState.mouthOpen * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Open mouth to see red tint</p>
          </div>
          
          {/* Head rotation */}
          <div className="bg-gray-900 rounded-xl p-3">
            <div className="flex justify-between text-white font-bold">
              <span>↔️ {displayState.headRotationY.toFixed(0)}°</span>
              <span>↕️ {displayState.headRotationX.toFixed(0)}°</span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle camera preview */}
      {trackingStatus === 'tracking' && (
        <button 
          onClick={() => setShowCamPreview(!showCamPreview)}
          className="mt-3 w-full py-2 bg-gray-700 text-white rounded-xl text-sm"
        >
          {showCamPreview ? '👁️ Hide' : '👁️ Show'} Camera Preview
        </button>
      )}

      {error && <div className="mt-3 bg-red-900 rounded-xl p-3 text-red-100">{error}</div>}
    </div>
  )
}
