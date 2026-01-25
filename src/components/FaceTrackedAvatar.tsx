'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface AvatarState {
  headRotationX: number
  headRotationY: number
  leftEyeOpen: number
  rightEyeOpen: number
  mouthOpen: number
  faceY: number // Track vertical face position
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
  const [facePosition, setFacePosition] = useState<'good' | 'too-high' | 'too-low' | 'none'>('none')
  
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

  // Improved eye detection - works better off-center
  const getEyeOpenRatio = (landmarks: any[], indices: number[]) => {
    try {
      const top = landmarks[indices[1]], bottom = landmarks[indices[5]]
      const left = landmarks[indices[0]], right = landmarks[indices[3]]
      const v = Math.sqrt(Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2))
      const h = Math.sqrt(Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2))
      if (h === 0) return 1
      const ratio = (v / h) * 4.5
      return Math.min(1, Math.max(0, ratio))
    } catch {
      return 1
    }
  }

  // Improved mouth detection - more sensitive, works off-center
  const getMouthOpenRatio = (landmarks: any[]) => {
    try {
      // Use multiple landmark pairs for better accuracy
      const upperLipTop = landmarks[13]
      const lowerLipBottom = landmarks[14]
      const upperLipBottom = landmarks[78]
      const lowerLipTop = landmarks[308]
      const mouthLeft = landmarks[61]
      const mouthRight = landmarks[291]
      
      // Inner mouth opening
      const innerV = Math.sqrt(
        Math.pow(upperLipBottom.x - lowerLipTop.x, 2) + 
        Math.pow(upperLipBottom.y - lowerLipTop.y, 2)
      )
      
      // Outer mouth opening
      const outerV = Math.sqrt(
        Math.pow(upperLipTop.x - lowerLipBottom.x, 2) + 
        Math.pow(upperLipTop.y - lowerLipBottom.y, 2)
      )
      
      const h = Math.sqrt(
        Math.pow(mouthLeft.x - mouthRight.x, 2) + 
        Math.pow(mouthLeft.y - mouthRight.y, 2)
      )
      
      if (h === 0) return 0
      
      // Combine both measurements, weight inner more
      const ratio = ((innerV * 6) + (outerV * 3)) / h
      return Math.min(1, Math.max(0, ratio))
    } catch {
      return 0
    }
  }

  const getHeadRotation = (landmarks: any[]) => {
    try {
      const nose = landmarks[1]
      const forehead = landmarks[10]
      const leftEye = landmarks[33]
      const rightEye = landmarks[263]
      const chin = landmarks[152]
      
      const eyeCenter = { 
        x: (leftEye.x + rightEye.x) / 2, 
        y: (leftEye.y + rightEye.y) / 2 
      }
      
      // Face vertical position (0 = top, 1 = bottom)
      const faceY = (nose.y + chin.y) / 2
      
      return { 
        rotationX: (forehead.y - nose.y) * 350,
        rotationY: (nose.x - eyeCenter.x) * 450,
        faceY
      }
    } catch {
      return { rotationX: 0, rotationY: 0, faceY: 0.5 }
    }
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

      // Eye blink overlay
      const avgEye = (state.leftEyeOpen + state.rightEyeOpen) / 2
      if (avgEye < 0.8) {
        const blinkOpacity = Math.min(1, (1 - avgEye) * 2)
        ctx.fillStyle = `rgba(0,0,0,${blinkOpacity})`
        ctx.fillRect(w * 0.18, h * 0.26, w * 0.26, h * 0.12)
        ctx.fillRect(w * 0.52, h * 0.26, w * 0.26, h * 0.12)
      }

      // Mouth open overlay - more sensitive
      if (state.mouthOpen > 0.05) {
        const mouthOpacity = Math.min(0.9, state.mouthOpen * 1.8)
        ctx.fillStyle = `rgba(30,5,5,${mouthOpacity})`
        const mouthHeight = h * 0.015 + (state.mouthOpen * h * 0.12)
        ctx.beginPath()
        ctx.ellipse(w * 0.5, h * 0.72, w * 0.13, mouthHeight, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Green border when tracking
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

      // Request camera - prefer front camera, lower resolution for speed
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 480 }, 
          height: { ideal: 360 } 
        },
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
          s.onload = res
          s.onerror = rej
          document.head.appendChild(s)
        })
      }

      const faceMesh = new (window as any).FaceMesh({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      })
      
      faceMesh.setOptions({ 
        maxNumFaces: 1, 
        refineLandmarks: true, 
        minDetectionConfidence: 0.4, // Lower threshold for off-center faces
        minTrackingConfidence: 0.4 
      })

      faceMesh.onResults((results: any) => {
        if (results.multiFaceLandmarks?.[0]) {
          const lm = results.multiFaceLandmarks[0]
          faceDetectedTimeRef.current = Date.now()
          
          const { rotationX, rotationY, faceY } = getHeadRotation(lm)
          const prev = avatarStateRef.current
          
          // Update face position indicator
          if (faceY < 0.35) {
            setFacePosition('too-high')
          } else if (faceY > 0.65) {
            setFacePosition('too-low')
          } else {
            setFacePosition('good')
          }
          
          avatarStateRef.current = {
            headRotationX: smoothValue(prev.headRotationX, rotationX),
            headRotationY: smoothValue(prev.headRotationY, rotationY),
            leftEyeOpen: smoothValue(prev.leftEyeOpen, getEyeOpenRatio(lm, [33, 160, 158, 133, 153, 144])),
            rightEyeOpen: smoothValue(prev.rightEyeOpen, getEyeOpenRatio(lm, [263, 387, 385, 362, 380, 373])),
            mouthOpen: smoothValue(prev.mouthOpen, getMouthOpenRatio(lm), 0.6), // Faster mouth response
            faceY: smoothValue(prev.faceY, faceY),
          }
          
          setDisplayState({ ...avatarStateRef.current })
          
          if (!isTrackingRef.current) { 
            isTrackingRef.current = true
            setTrackingStatus('tracking') 
          }
        } else {
          if (Date.now() - faceDetectedTimeRef.current > 2000) {
            setTrackingStatus('no-face')
            setFacePosition('none')
          }
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
      if (err.name === 'NotAllowedError') setError('Camera denied. Tap lock icon → Allow.')
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
    setFacePosition('none')
  }, [])

  return (
    <div className="w-full px-2">
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      
      {/* Avatar container */}
      <div 
        className="relative mx-auto bg-black rounded-2xl overflow-hidden shadow-xl"
        style={{ width: '90vw', height: '90vw', maxWidth: '400px', maxHeight: '400px' }}
      >
        <canvas 
          ref={canvasRef} 
          width={CANVAS_W} 
          height={CANVAS_H}
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Status badge */}
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
        
        {/* Face position guide */}
        {trackingStatus === 'tracking' && facePosition !== 'good' && facePosition !== 'none' && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-orange-500 text-white">
              {facePosition === 'too-high' ? '⬇️ Move DOWN' : '⬆️ Move UP'}
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

      {/* Debug info */}
      {trackingStatus === 'tracking' && (
        <div className="mt-3 bg-gray-900 rounded-xl p-3 border border-green-500">
          <div className="grid grid-cols-2 gap-2 text-base font-mono">
            <div>↔️ <span className="text-green-400">{displayState.headRotationY.toFixed(0)}°</span></div>
            <div>↕️ <span className="text-green-400">{displayState.headRotationX.toFixed(0)}°</span></div>
            <div>👁️ <span className="text-green-400">{(displayState.leftEyeOpen*100).toFixed(0)}%</span></div>
            <div>👄 <span className="text-green-400">{(displayState.mouthOpen*100).toFixed(0)}%</span></div>
          </div>
        </div>
      )}

      {error && <div className="mt-3 bg-red-900 rounded-xl p-3 text-red-100">{error}</div>}
    </div>
  )
}
