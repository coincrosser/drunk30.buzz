'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Settings2,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  Minus,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TeleprompterProps {
  script: string
  title?: string
}

export function Teleprompter({ script, title }: TeleprompterProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  const [fontSize, setFontSize] = useState(32)
  const [scrollSpeed, setScrollSpeed] = useState(50)
  const [mirrorMode, setMirrorMode] = useState(false)
  const [lineHeight, setLineHeight] = useState(1.8)

  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  const scrollText = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const delta = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      if (isPlaying && textRef.current) {
        const pixelsPerSecond = scrollSpeed * 2
        const scrollAmount = (pixelsPerSecond * delta) / 1000
        setScrollPosition((prev) => {
          const maxScroll = textRef.current!.scrollHeight - window.innerHeight + 200
          const newPos = Math.min(prev + scrollAmount, maxScroll)
          return newPos
        })
      }

      animationRef.current = requestAnimationFrame(scrollText)
    },
    [isPlaying, scrollSpeed]
  )

  useEffect(() => {
    animationRef.current = requestAnimationFrame(scrollText)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [scrollText])

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.transform = `translateY(-${scrollPosition}px)`
    }
  }, [scrollPosition])

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const reset = () => {
    setScrollPosition(0)
    setIsPlaying(false)
    lastTimeRef.current = 0
  }

  const handleTap = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black text-white overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-50' : 'min-h-[80vh] rounded-lg'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 p-8 overflow-hidden cursor-pointer',
          mirrorMode && 'teleprompter-mirror'
        )}
        onClick={handleTap}
      >
        <div
          ref={textRef}
          className="teleprompter-text transition-transform duration-100"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
          }}
        >
          {title && (
            <h1
              className="font-bold mb-8 text-center"
              style={{ fontSize: `${fontSize * 1.5}px` }}
            >
              {title}
            </h1>
          )}
          {script.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-6">
              {paragraph}
            </p>
          ))}
          <div className="h-[50vh]" />
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/30 pointer-events-none" />

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-white/10 hover:bg-white/20"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={reset}
            className="bg-white/10 hover:bg-white/20"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="bg-white/10 hover:bg-white/20"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleFullscreen}
            className="bg-white/10 hover:bg-white/20"
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {showSettings && (
        <div className="absolute top-4 right-4 bg-black/90 rounded-lg p-4 space-y-4 min-w-[250px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white text-sm">Font Size</Label>
              <span className="text-white/60 text-sm">{fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/10"
                onClick={() => setFontSize(Math.max(16, fontSize - 4))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Slider
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
                min={16}
                max={72}
                step={2}
                className="flex-1"
              />
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/10"
                onClick={() => setFontSize(Math.min(72, fontSize + 4))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white text-sm">Scroll Speed</Label>
              <span className="text-white/60 text-sm">{scrollSpeed}</span>
            </div>
            <Slider
              value={[scrollSpeed]}
              onValueChange={([v]) => setScrollSpeed(v)}
              min={10}
              max={150}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white text-sm">Line Height</Label>
              <span className="text-white/60 text-sm">{lineHeight.toFixed(1)}</span>
            </div>
            <Slider
              value={[lineHeight * 10]}
              onValueChange={([v]) => setLineHeight(v / 10)}
              min={12}
              max={30}
              step={1}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlipHorizontal className="h-4 w-4 text-white" />
              <Label className="text-white text-sm">Mirror Mode</Label>
            </div>
            <Switch checked={mirrorMode} onCheckedChange={setMirrorMode} />
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 text-white/40 text-sm">
        {isPlaying ? 'Tap to pause' : 'Tap to start'}
      </div>
    </div>
  )
}
