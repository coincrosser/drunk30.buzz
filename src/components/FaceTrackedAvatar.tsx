'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface AvatarState {
  headRotationX: number
  headRotationY: number
  leftEyeOpen: number
  rightEyeOpen: number
  mouthOpen: number
}

interface FaceTrackedAvatarProps {
  baseImage: string
  width?: number
  height?: number
}

export default function FaceTrackedAvatar({
  baseImage,
  width = 800,
  height = 600,
}: FaceTrackedAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const webcamCanvasRef = useRef<HTMLCanvasElement>(null)
  const [trackingStatus, setTrackingStatus] = useState<'initializing' | 'tracking' | 'no-face' | 'error'>('initializing')
  const [avatarState, setAvatarState] = useState<AvatarState>({
    headRotationX: 0,
    headRotationY: 0,
    leftEyeOpen: 1,
    rightEyeOpen: 1,
    mouthOpen: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const faceMeshRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const animationRef = useRef<number | null>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)
  const faceDetectedTimeRef = useRef(0)

  const smoothingFactor = 0.4 // Increased for more responsive tracking

  const smoothValue = (current: number, target: number) => {
    return current + (target - current) * smoothingFactor
  }

  const getEyeOpenRatio = (landmarks: any[], eyeIndices: number[]) => {
    // eyeIndices: [LEFT, TOP_LEFT, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT]
    const top = landmarks[eyeIndices[1]]
    const bottom = landmarks[eyeIndices[5]]
    const left = landmarks[eyeIndices[0]]
    const right = landmarks[eyeIndices[3]]
    
    const verticalDist = Math.sqrt(
      Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2)
    )
    const horizontalDist = Math.sqrt(
      Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2)
    )
    
    // Higher ratio = more open; clamp between 0 and 1
    const ratio = (verticalDist / horizontalDist) * 5
    return Math.min(1, Math.max(0, ratio))
  }

  const getMouthOpenRatio = (landmarks: any[]) => {
    // Use more reliable mouth landmarks
    const innerLipTop = landmarks[13]
    const innerLipBottom = landmarks[14]
    const mouthLeftCorner = landmarks[61]
    const mouthRightCorner = landmarks[291]
    
    const verticalDist = Math.sqrt(
      Math.pow(innerLipTop.x - innerLipBottom.x, 2) + 
      Math.pow(innerLipTop.y - innerLipBottom.y, 2)
    )
    const horizontalDist = Math.sqrt(
      Math.pow(mouthLeftCorner.x - mouthRightCorner.x, 2) + 
      Math.pow(mouthLeftCorner.y - mouthRightCorner.y, 2)
    )
    
    const ratio = (verticalDist / horizontalDist) * 4
    return Math.min(1, Math.max(0, ratio))
  }

  const getHeadRotation = (landmarks: any[]) => {
    const nose = landmarks[1]
    const forehead = landmarks[10]
    const leftEye = landmarks[33]
    const rightEye = landmarks[263]
    
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2,
    }
    
    // Horizontal rotation (left/right head turn) - increased multiplier for more dramatic effect
    const rotationY = (nose.x - eyeCenter.x) * 120
    
    // Vertical rotation (up/down head tilt) - increased multiplier
    const rotationX = (forehead.y - nose.y) * 80
    
    return { rotationX, rotationY }
  }

  const initFaceTracking = useCallback(async () => {
    try {
      setTrackingStatus('initializing')
      setError(null)
      console.log('📹 Starting face tracking...')

      // Dynamically import MediaPipe from CDN
      if (!(window as any).FaceMesh) {
        console.log('📥 Loading FaceMesh from CDN...')
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'
          script.async = true
          script.onload = resolve
          script.onerror = () => reject(new Error('Failed to load FaceMesh'))
          document.head.appendChild(script)
        })
        console.log('✅ FaceMesh loaded')
      }
      
      if (!(window as any).Camera) {
        console.log('📥 Loading Camera utils from CDN...')
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js'
          script.async = true
          script.onload = resolve
          script.onerror = () => reject(new Error('Failed to load Camera utils'))
          document.head.appendChild(script)
        })
        console.log('✅ Camera utils loaded')
      }

      const FaceMesh = (window as any).FaceMesh
      const Camera = (window as any).Camera

      if (!FaceMesh) throw new Error('FaceMesh not available after loading')
      if (!Camera) throw new Error('Camera not available after loading')

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        },
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      })

      faceMesh.onResults((results: any) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0]
          faceDetectedTimeRef.current = Date.now()
          
          const leftEyeIndices = [33, 160, 158, 133, 153, 144]
          const rightEyeIndices = [263, 387, 385, 362, 380, 373]
          
          const leftEyeOpen = getEyeOpenRatio(landmarks, leftEyeIndices)
          const rightEyeOpen = getEyeOpenRatio(landmarks, rightEyeIndices)
          const mouthOpen = getMouthOpenRatio(landmarks)
          const { rotationX, rotationY } = getHeadRotation(landmarks)
          
          setAvatarState((prev) => ({
            headRotationX: smoothValue(prev.headRotationX, rotationX),
            headRotationY: smoothValue(prev.headRotationY, rotationY),
            leftEyeOpen: smoothValue(prev.leftEyeOpen, leftEyeOpen),
            rightEyeOpen: smoothValue(prev.rightEyeOpen, rightEyeOpen),
            mouthOpen: smoothValue(prev.mouthOpen, mouthOpen),
          }))
          
          setTrackingStatus('tracking')
        } else {
          // No face detected
          if (Date.now() - faceDetectedTimeRef.current > 2000) {
            setTrackingStatus('no-face')
          }
        }
      })

      faceMeshRef.current = faceMesh

      if (videoRef.current) {
        console.log('📷 Requesting camera access...')
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && faceMeshRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current })
            }
          },
          width: 640,
          height: 480,
        })
        
        cameraRef.current = camera
        await camera.start()
        console.log('✅ Camera started successfully')
      }
    } catch (err: any) {
      console.error('❌ Face tracking error:', err)
      setTrackingStatus('error')
      setError(err.message || 'Failed to initialize face tracking. Check browser console.')
    }
  }, [])

  const stopTracking = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop()
      cameraRef.current = null
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setTrackingStatus('initializing')
  }, [])

  // Load base image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = baseImage
    img.onload = () => {
      baseImgRef.current = img
    }
  }, [baseImage])

  // Auto-start face tracking on mount
  useEffect(() => {
    initFaceTracking()
    return () => stopTracking()
  }, [])

  // Draw avatar
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      
      if (baseImgRef.current) {
        ctx.save()
        
        // Dramatic head rotation (4x more visible than before)
        const rotateAmount = (avatarState.headRotationY * Math.PI) / 180 / 3
        const scaleX = 1 + (Math.abs(avatarState.headRotationY) / 100) * 0.15 // Slight zoom on turn
        
        ctx.translate(width / 2, height / 2)
        ctx.rotate(rotateAmount)
        ctx.scale(scaleX, 1)
        
        // Vertical shift based on head tilt (more pronounced)
        const yOffset = avatarState.headRotationX / 4
        
        ctx.translate(-width / 2, -height / 2 + yOffset)
        
        // Draw base image
        ctx.drawImage(baseImgRef.current, 0, 0, width, height)
        
        ctx.restore()
        
        // Eye blink overlay effect (more prominent)
        const blinkAmount = 1 - Math.min(avatarState.leftEyeOpen, avatarState.rightEyeOpen)
        if (blinkAmount > 0.1) {
          ctx.fillStyle = `rgba(0, 0, 0, ${blinkAmount * 0.8})`
          // Left eye area
          ctx.fillRect(width * 0.28, height * 0.35, width * 0.15, height * 0.08)
          // Right eye area
          ctx.fillRect(width * 0.57, height * 0.35, width * 0.15, height * 0.08)
        }
        
        // Mouth open effect with color change
        if (avatarState.mouthOpen > 0.2) {
          ctx.fillStyle = `rgba(200, 100, 100, ${avatarState.mouthOpen * 0.6})`
          ctx.fillRect(width * 0.3, height * 0.65, width * 0.4, height * 0.05)
        }
      } else {
        // Placeholder
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = '#666'
        ctx.font = `${height * 0.08}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Loading avatar...', width / 2, height / 2)
      }
      
      animationRef.current = requestAnimationFrame(draw)
    }
    
    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [width, height, avatarState])

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg border border-gray-600 overflow-hidden" style={{ width, height }}>
        <video ref={videoRef} className="hidden" autoPlay playsInline muted />
        
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full"
        />
        
        {/* Status overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <div className={`px-3 py-1 rounded text-sm font-mono ${
            trackingStatus === 'tracking' ? 'bg-green-600' :
            trackingStatus === 'no-face' ? 'bg-yellow-600' :
            trackingStatus === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          } text-white`}>
            {trackingStatus === 'tracking' && '✓ Tracking active'}
            {trackingStatus === 'no-face' && '⚠ No face detected'}
            {trackingStatus === 'initializing' && '⏳ Initializing...'}
            {trackingStatus === 'error' && '✕ Error'}
          </div>
        </div>
      </div>

      {/* Debug info */}
      {trackingStatus === 'tracking' && (
        <div className="bg-slate-900 rounded p-3 text-xs text-gray-300 font-mono space-y-1">
          <div className="text-gray-400">← Left/Right: {avatarState.headRotationY.toFixed(1)}°</div>
          <div className="text-gray-400">↑ Up/Down: {avatarState.headRotationX.toFixed(1)}°</div>
          <div className="text-gray-400">Left Eye: {(avatarState.leftEyeOpen * 100).toFixed(0)}% | Right Eye: {(avatarState.rightEyeOpen * 100).toFixed(0)}%</div>
          <div className="text-gray-400">Mouth: {(avatarState.mouthOpen * 100).toFixed(0)}%</div>
        </div>
      )}

      {trackingStatus === 'no-face' && (
        <div className="bg-yellow-900 border border-yellow-600 rounded p-3 text-sm text-yellow-100">
          <p>Face not detected. Make sure:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
            <li>Your face is visible in the camera</li>
            <li>Lighting is adequate</li>
            <li>You're facing the camera directly</li>
          </ul>
        </div>
      )}

      {trackingStatus === 'error' && error && (
        <div className="bg-red-900 border border-red-600 rounded p-3 text-sm text-red-100">
          <p className="font-semibold">Error: {error}</p>
          <p className="text-xs mt-1">Check browser console (F12) for details.</p>
        </div>
      )}
    </div>
  )
}
