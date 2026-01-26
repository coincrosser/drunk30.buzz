'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// Expression states based on face tracking
type Expression = 'neutral' | 'talking' | 'blink' | 'wink' | 'angry' | 'happy'

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
  const [currentExpression, setCurrentExpression] = useState<Expression>('neutral')
  
  // Face tracking values
  const faceDataRef = useRef({
    mouthOpen: 0,
    leftEyeOpen: 1,
    rightEyeOpen: 1,
    headRotationX: 0,
    headRotationY: 0,
  })
  const [displayData, setDisplayData] = useState(faceDataRef.current)
  
  // Sprite images
  const spritesRef = useRef<{ [key: string]: HTMLImageElement }>({})
  const [spritesLoaded, setSpritesLoaded] = useState(false)
  
  const faceMeshRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const faceDetectedTimeRef = useRef(0)
  const isTrackingRef = useRef(false)

  const CANVAS_W = 400
  const CANVAS_H = 400

  // PUCK sprite mapping - adjust filenames to match your uploads
  const SPRITES = {
    neutral: '/puck/neutral.png',      // Both eyes open, mouth closed
    talking: '/puck/talking.png',      // Mouth open with tongue
    blink: '/puck/blink.png',          // Eyes closed/sleepy
    wink: '/puck/wink.png',            // One eye closed, tongue out
    angry: '/puck/angry.png',          // Frown face
    happy: '/puck/happy.png',          // Smile
  }

  // Load all sprite images
  useEffect(() => {
    const loadSprites = async () => {
      const entries = Object.entries(SPRITES)
      let loaded = 0
      
      for (const [key, src] of entries) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          spritesRef.current[key] = img
          loaded++
          if (loaded === entries.length) {
            setSpritesLoaded(true)
          }
        }
        img.onerror = () => {
          // Fallback to base image if sprite missing
          console.warn(`Sprite ${key} not found, using base`)
          const fallback = new Image()
          fallback.crossOrigin = 'anonymous'
          fallback.onload = () => {
            spritesRef.current[key] = fallback
            loaded++
            if (loaded === entries.length) {
              setSpritesLoaded(true)
            }
          }
          fallback.src = baseImage
        }
        img.src = src
      }
    }
    
    loadSprites()
  }, [baseImage])

  // Also load base image as fallback
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (!spritesRef.current.neutral) {
        spritesRef.current.neutral = img
      }
    }
    img.src = baseImage
  }, [baseImage])

  const smoothValue = (current: number, target: number, factor = 0.5) => 
    current + (target - current) * factor

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
      const upperInner = landmarks[13], lowerInner = landmarks[14]
      const left = landmarks[61], right = landmarks[291]
      const v = Math.sqrt(Math.pow(upperInner.x - lowerInner.x, 2) + Math.pow(upperInner.y - lowerInner.y, 2))
      const h = Math.sqrt(Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2))
      if (h === 0) return 0
      return Math.min(1, Math.max(0, (v / h) * 5))
    } catch { return 0 }
  }

  const getHeadRotation = (landmarks: any[]) => {
    try {
      const nose = landmarks[1], forehead = landmarks[10]
      const leftEye = landmarks[33], rightEye = landmarks[263]
      const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }
      return { 
        rotationX: (forehead.y - nose.y) * 300,
        rotationY: (nose.x - eyeCenter.x) * 400,
      }
    } catch { return { rotationX: 0, rotationY: 0 } }
  }

  // Determine which expression to show based on face data
  const determineExpression = useCallback((): Expression => {
    const data = faceDataRef.current
    const avgEye = (data.leftEyeOpen + data.rightEyeOpen) / 2
    
    // Priority: Blink > Talking > Wink > Neutral
    
    // Both eyes closed = blink
    if (avgEye < 0.4) {
      return 'blink'
    }
    
    // One eye closed = wink
    if (data.leftEyeOpen < 0.5 && data.rightEyeOpen > 0.6) {
      return 'wink'
    }
    if (data.rightEyeOpen < 0.5 && data.leftEyeOpen > 0.6) {
      return 'wink'
    }
    
    // Mouth open = talking
    if (data.mouthOpen > 0.2) {
      return 'talking'
    }
    
    // Default
    return 'neutral'
  }, [])

  const drawAvatar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const data = faceDataRef.current
    const w = CANVAS_W, h = CANVAS_H

    ctx.clearRect(0, 0, w, h)

    // Get current expression and sprite
    const expression = determineExpression()
    setCurrentExpression(expression)
    
    const sprite = spritesRef.current[expression] || spritesRef.current.neutral
    
    if (sprite) {
      ctx.save()
      
      // Apply head movement
      const rotateAngle = (data.headRotationY * Math.PI) / 180
      const hShift = data.headRotationY * 2
      const vShift = data.headRotationX * 1.5
      const scale = 1 + (Math.abs(data.headRotationY) / 40) * 0.08
      
      // Wobble when talking
      const wobble = data.mouthOpen > 0.2 ? Math.sin(Date.now() / 150) * 2 : 0

      ctx.translate(w / 2, h / 2)
      ctx.rotate(rotateAngle + (wobble * Math.PI / 180))
      ctx.scale(scale, scale)
      ctx.translate(-w / 2 + hShift, -h / 2 + vShift)
      
      // Draw the sprite
      ctx.drawImage(sprite, 0, 0, w, h)
      ctx.restore()

      // Green border when tracking
      if (isTrackingRef.current) {
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 3
        ctx.strokeRect(2, 2, w - 4, h - 4)
      }
    } else {
      // Loading state
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#888'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Loading PUCK...', w / 2, h / 2)
    }
  }, [determineExpression])

  // Animation loop
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
          const { rotationX, rotationY } = getHeadRotation(lm)
          const prev = faceDataRef.current
          
          faceDataRef.current = {
            headRotationX: smoothValue(prev.headRotationX, rotationX),
            headRotationY: smoothValue(prev.headRotationY, rotationY),
            leftEyeOpen: smoothValue(prev.leftEyeOpen, getEyeOpenRatio(lm, [33, 160, 158, 133, 153, 144]), 0.6),
            rightEyeOpen: smoothValue(prev.rightEyeOpen, getEyeOpenRatio(lm, [263, 387, 385, 362, 380, 373]), 0.6),
            mouthOpen: smoothValue(prev.mouthOpen, getMouthOpenRatio(lm), 0.6),
          }
          setDisplayData({ ...faceDataRef.current })
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
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      
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
        
        {/* Current expression */}
        {trackingStatus === 'tracking' && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-purple-600 text-white">
              {currentExpression.toUpperCase()}
            </span>
          </div>
        )}
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

      {/* Debug */}
      {trackingStatus === 'tracking' && (
        <div className="mt-3 bg-gray-900 rounded-xl p-3 border border-green-500">
          <div className="grid grid-cols-2 gap-2 text-base font-mono">
            <div>👁️L: <span className="text-green-400">{(displayData.leftEyeOpen * 100).toFixed(0)}%</span></div>
            <div>👁️R: <span className="text-green-400">{(displayData.rightEyeOpen * 100).toFixed(0)}%</span></div>
            <div>👄: <span className="text-green-400">{(displayData.mouthOpen * 100).toFixed(0)}%</span></div>
            <div>🎭: <span className="text-purple-400">{currentExpression}</span></div>
          </div>
        </div>
      )}

      {/* Sprites status */}
      <div className="mt-2 text-center text-sm text-gray-500">
        {spritesLoaded ? '✅ Sprites loaded' : '⏳ Loading sprites...'}
      </div>

      {error && <div className="mt-3 bg-red-900 rounded-xl p-3 text-red-100">{error}</div>}
    </div>
  )
}
