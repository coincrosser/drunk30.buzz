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
  width = 800,
  height = 600,
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

  const smoothingFactor = 0.6

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

    // MASSIVE multipliers - 4x previous values
    const rotationY = (nose.x - eyeCenter.x) * 500
    const rotationX = (forehead.y - nose.y) * 400

    return { rotationX, rotationY }
  }

  const drawAvatar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = avatarStateRef.current

    ctx.clearRect(0, 0, width, height)

    if (baseImgRef.current) {
      ctx.save()

      // SUPER DRAMATIC movement
      const rotateAngle = (state.headRotationY * Math.PI) / 180  // Full degree conversion
      const horizontalShift = state.headRotationY * 3
      const verticalShift = state.headRotationX * 2
      const scale = 1 + (Math.abs(state.headRotationY) / 30) * 0.15

      ctx.translate(width / 2, height / 2)
      ctx.rotate(rotateAngle)
      ctx.scale(scale, scale)
      ctx.translate(-width / 2 + horizontalShift, -height / 2 + verticalShift)

      ctx.drawImage(baseImgRef.current, 0, 0, width, height)
      ctx.restore()

      // EYE BLINK
      const avgEyeOpen = (state.leftEyeOpen + state.rightEyeOpen) / 2
      if (avgEyeOpen < 0.85) {
        const blinkOpacity = Math.min(1, (1 - avgEyeOpen) * 2.5)
        ctx.fillStyle = `rgba(0, 0, 0, ${blinkOpacity})`
        ctx.fillRect(width * 0.20, height * 0.26, width * 0.25, height * 0.14)
        ctx.fillRect(width * 0.50, height * 0.26, width * 0.25, height * 0.14)
      }

      // MOUTH
      if (state.mouthOpen > 0.08) {
        const mouthOpacity = Math.min(0.95, state.mouthOpen * 2)
        ctx.fillStyle = `rgba(40, 5, 5, ${mouthOpacity})`
        const mouthHeight = height * 0.02 + (state.mouthOpen * height * 0.1)
        ctx.beginPath()
        ctx.ellipse(width * 0.5, height * 0.73, width * 0.14, mouthHeight, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Green border when tracking
      if (isTrackingRef.current) {
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 6
        ctx.strokeRect(3, 3, width - 6, height - 6)
      }

    } else {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#888'
      ctx.font = '28px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Loading avatar...', width / 2, height / 2)
    }
  }, [width, height])

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
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [drawAvatar])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      baseImgRef.current = img
      console.log('Avatar loaded!')
    }
    img.onerror = () => console.error('Avatar load failed')
    img.src = baseImage
  }, [baseImage])

  const initFaceTracking = useCallback(async () => {
    try {
      setTrackingStatus('initializing')
      setError(null)

      if (!(window as any).FaceMesh) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      if (!(window as any).Camera) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js'
          script.onload = resolve
          script.onerror = reject
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
        if (results.multiFaceLandmarks?.[0]) {
          const landmarks = results.multiFaceLandmarks[0]
          faceDetectedTimeRef.current = Date.now()

          const leftEyeIndices = [33, 160, 158, 133, 153, 144]
          const rightEyeIndices = [263, 387, 385, 362, 380, 373]

          const leftEyeOpen = getEyeOpenRatio(landmarks, leftEyeIndices)
          const rightEyeOpen = getEyeOpenRatio(landmarks, rightEyeIndices)
          const mouthOpen = getMouthOpenRatio(landmarks)
          const { rotationX, rotationY } = getHeadRotation(landmarks)

          const prev = avatarStateRef.current
          avatarStateRef.current = {
            headRotationX: smoothValue(prev.headRotationX, rotationX),
            headRotationY: smoothValue(prev.headRotationY, rotationY),
            leftEyeOpen: smoothValue(prev.leftEyeOpen, leftEyeOpen),
            rightEyeOpen: smoothValue(prev.rightEyeOpen, rightEyeOpen),
            mouthOpen: smoothValue(prev.mouthOpen, mouthOpen),
          }

          setDisplayState({ ...avatarStateRef.current })
          
          if (!isTrackingRef.current) {
            isTrackingRef.current = true
            setTrackingStatus('tracking')
          }
        } else if (Date.now() - faceDetectedTimeRef.current > 2000) {
          setTrackingStatus('no-face')
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
      }
    } catch (err: any) {
      console.error('Error:', err)
      setTrackingStatus('error')
      setError(err.message)
    }
  }, [])

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false
    cameraRef.current?.stop()
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

        <div className="absolute top-3 left-3">
          <div className={`px-4 py-2 rounded font-bold text-lg ${
            trackingStatus === 'tracking' ? 'bg-green-500 animate-pulse' :
            trackingStatus === 'no-face' ? 'bg-yellow-500' :
            trackingStatus === 'error' ? 'bg-red-500' :
            trackingStatus === 'initializing' ? 'bg-blue-500' :
            'bg-gray-600'
          } text-white`}>
            {trackingStatus === 'tracking' && '🟢 LIVE'}
            {trackingStatus === 'no-face' && '⚠️ NO FACE'}
            {trackingStatus === 'initializing' && '⏳ LOADING'}
            {trackingStatus === 'error' && '❌ ERROR'}
            {trackingStatus === 'idle' && '⚫ READY'}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {trackingStatus === 'idle' || trackingStatus === 'error' ? (
          <button
            onClick={initFaceTracking}
            className="px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-xl hover:bg-green-700"
          >
            🎥 START
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-xl hover:bg-red-700"
          >
            ⏹ STOP
          </button>
        )}
      </div>

      {trackingStatus === 'tracking' && (
        <div className="bg-black rounded-lg p-4 font-mono text-xl border-2 border-green-500">
          <div className="grid grid-cols-2 gap-3 text-green-400">
            <div>↔️ <span className="text-white">{displayState.headRotationY.toFixed(0)}°</span></div>
            <div>↕️ <span className="text-white">{displayState.headRotationX.toFixed(0)}°</span></div>
            <div>👁️ <span className="text-white">{(displayState.leftEyeOpen * 100).toFixed(0)}%</span></div>
            <div>👁️ <span className="text-white">{(displayState.rightEyeOpen * 100).toFixed(0)}%</span></div>
            <div className="col-span-2">👄 <span className="text-white">{(displayState.mouthOpen * 100).toFixed(0)}%</span></div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900 border-2 border-red-500 rounded-lg p-4 text-red-100">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}
