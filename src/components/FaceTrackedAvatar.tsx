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
  width = 400,
  height = 400,
}: FaceTrackedAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [avatarState, setAvatarState] = useState<AvatarState>({
    headRotationX: 0,
    headRotationY: 0,
    leftEyeOpen: 1,
    rightEyeOpen: 1,
    mouthOpen: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const faceMeshRef = useRef<any>(null)
  const animationRef = useRef<number | null>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)

  const smoothingFactor = 0.3

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
    
    return Math.min(1, Math.max(0, (verticalDist / horizontalDist) * 3))
  }

  const getMouthOpenRatio = (landmarks: any[]) => {
    const topLip = landmarks[13]
    const bottomLip = landmarks[14]
    const leftMouth = landmarks[78]
    const rightMouth = landmarks[308]
    
    const verticalDist = Math.sqrt(
      Math.pow(topLip.x - bottomLip.x, 2) + Math.pow(topLip.y - bottomLip.y, 2)
    )
    const horizontalDist = Math.sqrt(
      Math.pow(leftMouth.x - rightMouth.x, 2) + Math.pow(leftMouth.y - rightMouth.y, 2)
    )
    
    return Math.min(1, Math.max(0, (verticalDist / horizontalDist) * 2))
  }

  const getHeadRotation = (landmarks: any[]) => {
    const nose = landmarks[1]
    const leftEye = landmarks[33]
    const rightEye = landmarks[263]
    
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2,
    }
    const rotationY = (nose.x - eyeCenter.x) * 50
    const rotationX = (nose.y - eyeCenter.y) * 30
    
    return { rotationX, rotationY }
  }

  const initFaceTracking = useCallback(async () => {
    try {
      // Dynamically import MediaPipe from CDN
      if (!(window as any).FaceMesh) {
        // Load FaceMesh from CDN
        await new Promise((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'
          script.async = true
          script.onload = resolve
          document.head.appendChild(script)
        })
      }
      
      if (!(window as any).Camera) {
        // Load Camera from CDN
        await new Promise((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js'
          script.async = true
          script.onload = resolve
          document.head.appendChild(script)
        })
      }

      const FaceMesh = (window as any).FaceMesh
      const Camera = (window as any).Camera

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        },
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
        await camera.start()
        setIsTracking(true)
      }
    } catch (err: any) {
      console.error('Face tracking error:', err)
      setError(err.message || 'Failed to initialize face tracking')
    }
  }, [])

  const stopTracking = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setIsTracking(false)
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
        ctx.translate(width / 2, height / 2)
        
        // Subtle head rotation
        const rotateAmount = (avatarState.headRotationY * Math.PI) / 180 / 10
        ctx.rotate(rotateAmount)
        
        // Vertical shift based on head tilt
        const yOffset = avatarState.headRotationX / 8
        
        ctx.translate(-width / 2, -height / 2)
        
        // Draw base image
        ctx.drawImage(baseImgRef.current, 0, yOffset, width, height)
        
        // Eye blink overlay effect
        const blinkAmount = 1 - Math.min(avatarState.leftEyeOpen, avatarState.rightEyeOpen)
        if (blinkAmount > 0.3) {
          ctx.fillStyle = `rgba(0, 0, 0, ${blinkAmount * 0.5})`
          // Left eye area
          ctx.fillRect(width * 0.28, height * 0.35 + yOffset, width * 0.15, height * 0.05)
          // Right eye area
          ctx.fillRect(width * 0.57, height * 0.35 + yOffset, width * 0.15, height * 0.05)
        }
        
        ctx.restore()
      } else {
        // Placeholder
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = '#fff'
        ctx.font = '16px sans-serif'
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
    <div className="relative">
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg border border-gray-600"
      />
      
      {isTracking && (
        <div className="mt-2 text-xs text-gray-400 font-mono">
          <div>Head: X={avatarState.headRotationX.toFixed(1)}° Y={avatarState.headRotationY.toFixed(1)}°</div>
          <div>Eyes: L={avatarState.leftEyeOpen.toFixed(2)} R={avatarState.rightEyeOpen.toFixed(2)}</div>
          <div>Mouth: {avatarState.mouthOpen.toFixed(2)}</div>
        </div>
      )}
      
      {error && <div className="mt-2 text-red-400 text-sm">{error}</div>}
    </div>
  )
}
