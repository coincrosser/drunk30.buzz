'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface AvatarState {
  headRotationX: number
  headRotationY: number
  leftEyeOpen: number
  rightEyeOpen: number
  mouthOpen: number
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
  
  const avatarStateRef = useRef<AvatarState>({
    headRotationX: 0, headRotationY: 0, leftEyeOpen: 1, rightEyeOpen: 1, mouthOpen: 0
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

  // Character feature positions (percentage of image)
  // Adjust these for different characters!
  const CHARACTER = {
    // Left eye (bearing) position
    leftEye: { x: 0.28, y: 0.36, width: 0.14, height: 0.12 },
    // Right eye (glass) position  
    rightEye: { x: 0.52, y: 0.40, width: 0.12, height: 0.10 },
    // Mouth position
    mouth: { x: 0.43, y: 0.56, width: 0.08, height: 0.04 },
    // Eyelid color (match the purple fur)
    eyelidColor: '#9B4D96',
    // Mouth interior color
    mouthColor: '#2a0a2a',
  }

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
      const leftEye = landmarks[33], rightEye = landmarks[263]
      const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }
      return { 
        rotationX: (forehead.y - nose.y) * 350,
        rotationY: (nose.x - eyeCenter.x) * 450,
      }
    } catch { return { rotationX: 0, rotationY: 0 } }
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
      
      // HEAD MOVEMENT + WOBBLE
      const rotateAngle = (state.headRotationY * Math.PI) / 180
      const hShift = state.headRotationY * 2
      const vShift = state.headRotationX * 1.5
      const wobble = Math.sin(Date.now() / 200) * (state.mouthOpen * 3) // Wobble when talking
      const scale = 1 + (Math.abs(state.headRotationY) / 40) * 0.1

      ctx.translate(w / 2, h / 2)
      ctx.rotate(rotateAngle + (wobble * Math.PI / 180))
      ctx.scale(scale, scale)
      ctx.translate(-w / 2 + hShift, -h / 2 + vShift)
      
      // Draw base image
      ctx.drawImage(baseImgRef.current, 0, 0, w, h)
      ctx.restore()

      // ====== ANIMATED EYELIDS ======
      const leftEyeClosed = 1 - state.leftEyeOpen
      const rightEyeClosed = 1 - state.rightEyeOpen
      
      // Left eye eyelid (closes from top)
      if (leftEyeClosed > 0.15) {
        const eye = CHARACTER.leftEye
        const lidHeight = eye.height * w * leftEyeClosed
        
        ctx.fillStyle = CHARACTER.eyelidColor
        ctx.beginPath()
        ctx.ellipse(
          eye.x * w + (eye.width * w / 2),
          eye.y * h,
          eye.width * w / 2,
          lidHeight,
          0, 0, Math.PI
        )
        ctx.fill()
        
        // Add subtle shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.beginPath()
        ctx.ellipse(
          eye.x * w + (eye.width * w / 2),
          eye.y * h + lidHeight * 0.8,
          eye.width * w / 2,
          3,
          0, 0, Math.PI * 2
        )
        ctx.fill()
      }
      
      // Right eye eyelid
      if (rightEyeClosed > 0.15) {
        const eye = CHARACTER.rightEye
        const lidHeight = eye.height * w * rightEyeClosed
        
        ctx.fillStyle = CHARACTER.eyelidColor
        ctx.beginPath()
        ctx.ellipse(
          eye.x * w + (eye.width * w / 2),
          eye.y * h,
          eye.width * w / 2,
          lidHeight,
          0, 0, Math.PI
        )
        ctx.fill()
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.beginPath()
        ctx.ellipse(
          eye.x * w + (eye.width * w / 2),
          eye.y * h + lidHeight * 0.8,
          eye.width * w / 2,
          3,
          0, 0, Math.PI * 2
        )
        ctx.fill()
      }

      // ====== ANIMATED MOUTH ======
      if (state.mouthOpen > 0.05) {
        const mouth = CHARACTER.mouth
        const openAmount = state.mouthOpen
        
        // Mouth interior (dark)
        ctx.fillStyle = CHARACTER.mouthColor
        ctx.beginPath()
        ctx.ellipse(
          mouth.x * w + (mouth.width * w / 2),
          mouth.y * h + (openAmount * h * 0.04),
          mouth.width * w / 2 + (openAmount * w * 0.03),
          mouth.height * h + (openAmount * h * 0.08),
          0, 0, Math.PI * 2
        )
        ctx.fill()
        
        // Tongue hint when mouth wide open
        if (openAmount > 0.4) {
          ctx.fillStyle = '#cc6666'
          ctx.beginPath()
          ctx.ellipse(
            mouth.x * w + (mouth.width * w / 2),
            mouth.y * h + (openAmount * h * 0.06),
            mouth.width * w / 3,
            openAmount * h * 0.03,
            0, 0, Math.PI * 2
          )
          ctx.fill()
        }
      }

      // Tracking indicator
      if (isTrackingRef.current) {
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 3
        ctx.strokeRect(2, 2, w - 4, h - 4)
      }
    } else {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#888'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Loading PUCK...', w / 2, h / 2)
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
          const { rotationX, rotationY } = getHeadRotation(lm)
          const prev = avatarStateRef.current
          
          avatarStateRef.current = {
            headRotationX: smoothValue(prev.headRotationX, rotationX),
            headRotationY: smoothValue(prev.headRotationY, rotationY),
            leftEyeOpen: smoothValue(prev.leftEyeOpen, getEyeOpenRatio(lm, [33, 160, 158, 133, 153, 144]), 0.7),
            rightEyeOpen: smoothValue(prev.rightEyeOpen, getEyeOpenRatio(lm, [263, 387, 385, 362, 380, 373]), 0.7),
            mouthOpen: smoothValue(prev.mouthOpen, getMouthOpenRatio(lm), 0.7),
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
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      
      {/* Avatar */}
      <div 
        className="relative mx-auto bg-black rounded-2xl overflow-hidden shadow-xl"
        style={{ width: '90vw', height: '90vw', maxWidth: '400px', maxHeight: '400px' }}
      >
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="absolute inset-0 w-full h-full" />
        
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

      {/* Debug */}
      {trackingStatus === 'tracking' && (
        <div className="mt-3 bg-gray-900 rounded-xl p-3 border border-green-500">
          <div className="grid grid-cols-2 gap-2 text-base font-mono">
            <div>👁️ Eyes: <span className="text-green-400">{((displayState.leftEyeOpen + displayState.rightEyeOpen) / 2 * 100).toFixed(0)}%</span></div>
            <div>👄 Mouth: <span className="text-green-400">{(displayState.mouthOpen * 100).toFixed(0)}%</span></div>
            <div>↔️ <span className="text-green-400">{displayState.headRotationY.toFixed(0)}°</span></div>
            <div>↕️ <span className="text-green-400">{displayState.headRotationX.toFixed(0)}°</span></div>
          </div>
        </div>
      )}

      {error && <div className="mt-3 bg-red-900 rounded-xl p-3 text-red-100">{error}</div>}
    </div>
  )
}
