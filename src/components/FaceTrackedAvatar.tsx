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
  const [trackingStatus, setTrackingStatus] = useState<'idle' | 'initializing' | 'tracking' | 'no-face' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  
  // Use refs for animation state to avoid re-render issues
  const avatarStateRef = useRef<AvatarState>({
    headRotationX: 0,
    headRotationY: 0,
    leftEyeOpen: 1,
    rightEyeOpen: 1,
    mouthOpen: 0,
  })
  const [displayState, setDisplayState] = useState<AvatarState>(avatarStateRef.current)
  
  const faceMeshRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const animationRef = useRef<number | null>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)
  const faceDetectedTimeRef = useRef(0)
  const isTrackingRef = useRef(false)

  const smoothingFactor = 0.5

  const smoothValue = (current: number, target: number) => {
    return current + (target - current) * smoothingFactor
  }

  const getEyeOpenRatio = (landmarks: any[], eyeIndices: number[]) => {
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

    const ratio = (verticalDist / horizontalDist) * 5
    return Math.min(1, Math.max(0, ratio))
  }

  const getMouthOpenRatio = (landmarks: any[]) => {
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

    const rotationY = (nose.x - eyeCenter.x) * 150
    const rotationX = (forehead.y - nose.y) * 100

    return { rotationX, rotationY }
  }

  // Separate drawing function that reads from ref
  const drawAvatar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = avatarStateRef.current

    ctx.clearRect(0, 0, width, height)

    if (baseImgRef.current) {
      ctx.save()

      // Head rotation - MORE DRAMATIC
      const rotateAmount = (state.headRotationY * Math.PI) / 180 / 2.5
      const scaleX = 1 + (Math.abs(state.headRotationY) / 80) * 0.2
      const yOffset = state.headRotationX / 3

      ctx.translate(width / 2, height / 2)
      ctx.rotate(rotateAmount)
      ctx.scale(scaleX, 1)
      ctx.translate(-width / 2, -height / 2 + yOffset)

      ctx.drawImage(baseImgRef.current, 0, 0, width, height)
      ctx.restore()

      // Eye blink - black bars over eyes when blinking
      const avgEyeOpen = (state.leftEyeOpen + state.rightEyeOpen) / 2
      if (avgEyeOpen < 0.7) {
        const blinkAmount = 1 - avgEyeOpen
        ctx.fillStyle = `rgba(0, 0, 0, ${blinkAmount})`
        // Left eye
        ctx.fillRect(width * 0.25, height * 0.32, width * 0.18, height * 0.1)
        // Right eye  
        ctx.fillRect(width * 0.55, height * 0.32, width * 0.18, height * 0.1)
      }

      // Mouth open indicator
      if (state.mouthOpen > 0.15) {
        ctx.fillStyle = `rgba(80, 20, 20, ${Math.min(state.mouthOpen * 0.8, 0.7)})`
        const mouthHeight = height * 0.03 + (state.mouthOpen * height * 0.05)
        ctx.fillRect(width * 0.35, height * 0.68, width * 0.3, mouthHeight)
      }
    } else {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#888'
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Loading avatar image...', width / 2, height / 2)
    }
  }, [width, height])

  // Animation loop - runs continuously
  useEffect(() => {
    let running = true
    
    const animate = () => {
      if (!running) return
      drawAvatar()
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      running = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [drawAvatar])

  // Load base image
  useEffect(() => {
    console.log('Loading avatar image:', baseImage)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      baseImgRef.current = img
      console.log('✅ Avatar image loaded successfully')
    }
    img.onerror = (e) => {
      console.error('❌ Failed to load avatar image:', e)
    }
    img.src = baseImage
  }, [baseImage])

  const initFaceTracking = useCallback(async () => {
    try {
      setTrackingStatus('initializing')
      setError(null)
      console.log('🎥 Starting face tracking...')

      // Load MediaPipe scripts
      if (!(window as any).FaceMesh) {
        console.log('📦 Loading FaceMesh...')
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'
          script.onload = resolve
          script.onerror = () => reject(new Error('Failed to load FaceMesh'))
          document.head.appendChild(script)
        })
      }

      if (!(window as any).Camera) {
        console.log('📦 Loading Camera utils...')
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js'
          script.onload = resolve
          script.onerror = () => reject(new Error('Failed to load Camera'))
          document.head.appendChild(script)
        })
      }

      const FaceMesh = (window as any).FaceMesh
      const Camera = (window as any).Camera

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
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

          // Update ref directly for smooth animation
          const prev = avatarStateRef.current
          avatarStateRef.current = {
            headRotationX: smoothValue(prev.headRotationX, rotationX),
            headRotationY: smoothValue(prev.headRotationY, rotationY),
            leftEyeOpen: smoothValue(prev.leftEyeOpen, leftEyeOpen),
            rightEyeOpen: smoothValue(prev.rightEyeOpen, rightEyeOpen),
            mouthOpen: smoothValue(prev.mouthOpen, mouthOpen),
          }

          // Update display state less frequently for UI
          setDisplayState({ ...avatarStateRef.current })
          
          if (!isTrackingRef.current) {
            isTrackingRef.current = true
            setTrackingStatus('tracking')
          }
        } else {
          if (Date.now() - faceDetectedTimeRef.current > 2000) {
            setTrackingStatus('no-face')
          }
        }
      })

      faceMeshRef.current = faceMesh

      if (videoRef.current) {
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
        console.log('✅ Camera started!')
      }
    } catch (err: any) {
      console.error('❌ Face tracking error:', err)
      setTrackingStatus('error')
      setError(err.message)
    }
  }, [])

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false
    if (cameraRef.current) {
      cameraRef.current.stop()
      cameraRef.current = null
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
    }
    setTrackingStatus('idle')
  }, [])

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ width, height }}>
        <video ref={videoRef} className="hidden" autoPlay playsInline muted />
        <canvas ref={canvasRef} width={width} height={height} />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <div className={`px-3 py-1 rounded text-sm font-bold ${
            trackingStatus === 'tracking' ? 'bg-green-500' :
            trackingStatus === 'no-face' ? 'bg-yellow-500' :
            trackingStatus === 'error' ? 'bg-red-500' :
            trackingStatus === 'initializing' ? 'bg-blue-500' :
            'bg-gray-500'
          } text-white`}>
            {trackingStatus === 'tracking' && '● TRACKING'}
            {trackingStatus === 'no-face' && '⚠ NO FACE'}
            {trackingStatus === 'initializing' && '⏳ LOADING...'}
            {trackingStatus === 'error' && '✕ ERROR'}
            {trackingStatus === 'idle' && '○ READY'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {trackingStatus === 'idle' || trackingStatus === 'error' ? (
          <button
            onClick={initFaceTracking}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >
            🎥 Start Face Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
          >
            ⏹ Stop Tracking
          </button>
        )}
      </div>

      {/* Debug panel */}
      {trackingStatus === 'tracking' && (
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
          <div className="grid grid-cols-2 gap-2 text-green-400">
            <div>↔ Head Turn: {displayState.headRotationY.toFixed(1)}°</div>
            <div>↕ Head Tilt: {displayState.headRotationX.toFixed(1)}°</div>
            <div>👁 Left Eye: {(displayState.leftEyeOpen * 100).toFixed(0)}%</div>
            <div>👁 Right Eye: {(displayState.rightEyeOpen * 100).toFixed(0)}%</div>
            <div className="col-span-2">👄 Mouth: {(displayState.mouthOpen * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-500 rounded-lg p-4 text-red-100">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}
