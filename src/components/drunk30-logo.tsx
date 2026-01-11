'use client'

import { useEffect, useState } from 'react'

export function Drunk30Logo({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sizes = {
    sm: { width: 80, height: 80, fontSize: 24 },
    md: { width: 120, height: 120, fontSize: 36 },
    lg: { width: 180, height: 180, fontSize: 54 },
  }

  const { width, height, fontSize } = sizes[size]

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      className={`drunk30-logo ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Neon glow filters */}
        <filter id="neon-glow-pink" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="neon-glow-orange" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="neon-glow-yellow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient definitions */}
        <linearGradient id="neon-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(338, 100%, 60%)">
            <animate
              attributeName="stop-color"
              values="hsl(338, 100%, 60%); hsl(28, 100%, 55%); hsl(55, 100%, 50%); hsl(338, 100%, 60%)"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="hsl(28, 100%, 55%)">
            <animate
              attributeName="stop-color"
              values="hsl(28, 100%, 55%); hsl(55, 100%, 50%); hsl(338, 100%, 60%); hsl(28, 100%, 55%)"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="hsl(55, 100%, 50%)">
            <animate
              attributeName="stop-color"
              values="hsl(55, 100%, 50%); hsl(338, 100%, 60%); hsl(28, 100%, 55%); hsl(55, 100%, 50%)"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        <linearGradient id="neon-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(55, 100%, 50%)">
            <animate
              attributeName="stop-color"
              values="hsl(55, 100%, 50%); hsl(338, 100%, 60%); hsl(28, 100%, 55%); hsl(55, 100%, 50%)"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="hsl(28, 100%, 55%)">
            <animate
              attributeName="stop-color"
              values="hsl(28, 100%, 55%); hsl(55, 100%, 50%); hsl(338, 100%, 60%); hsl(28, 100%, 55%)"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* Radial gradient for center glow */}
        <radialGradient id="center-glow">
          <stop offset="0%" stopColor="hsl(338, 100%, 60%)" stopOpacity="0.8" />
          <stop offset="50%" stopColor="hsl(28, 100%, 55%)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background animated ring */}
      <circle cx="100" cy="100" r="85" fill="none" stroke="url(#neon-gradient-1)" strokeWidth="2" opacity="0.3">
        <animate attributeName="r" values="85;90;85" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Outer hexagon ring - rotating */}
      <g transform="translate(100, 100)" filter="url(#neon-glow-pink)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 0 0"
          to="360 0 0"
          dur="20s"
          repeatCount="indefinite"
        />
        <path
          d="M 0,-70 L 60.62,-35 L 60.62,35 L 0,70 L -60.62,35 L -60.62,-35 Z"
          fill="none"
          stroke="hsl(338, 100%, 60%)"
          strokeWidth="2"
          opacity="0.6"
        />
      </g>

      {/* Inner hexagon - counter-rotating */}
      <g transform="translate(100, 100)" filter="url(#neon-glow-orange)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 0 0"
          to="-360 0 0"
          dur="15s"
          repeatCount="indefinite"
        />
        <path
          d="M 0,-50 L 43.3,-25 L 43.3,25 L 0,50 L -43.3,25 L -43.3,-25 Z"
          fill="none"
          stroke="url(#neon-gradient-2)"
          strokeWidth="2.5"
          opacity="0.8"
        />
      </g>

      {/* Center circle with pulsing glow */}
      <circle cx="100" cy="100" r="40" fill="url(#center-glow)" opacity="0.4">
        <animate attributeName="r" values="40;45;40" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Main logo circle */}
      <circle
        cx="100"
        cy="100"
        r="35"
        fill="hsl(220, 13%, 9%)"
        stroke="url(#neon-gradient-1)"
        strokeWidth="3"
        filter="url(#neon-glow-pink)"
      >
        <animate attributeName="stroke-width" values="3;4;3" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* "30" text with split animation */}
      <text
        x="100"
        y="115"
        fontFamily="'Bebas Neue', sans-serif"
        fontSize="48"
        fontWeight="bold"
        textAnchor="middle"
        fill="url(#neon-gradient-1)"
        filter="url(#neon-glow-yellow)"
        letterSpacing="2"
      >
        <tspan>30</tspan>
        <animate attributeName="opacity" values="1;0.7;1" dur="3s" repeatCount="indefinite" />
      </text>

      {/* Orbiting particles */}
      <g filter="url(#neon-glow-pink)">
        <circle cx="100" cy="100" r="3" fill="hsl(338, 100%, 60%)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur="4s"
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-60; 0,0"
            dur="4s"
            repeatCount="indefinite"
            additive="sum"
          />
        </circle>
      </g>

      <g filter="url(#neon-glow-orange)">
        <circle cx="100" cy="100" r="2.5" fill="hsl(28, 100%, 55%)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="120 100 100"
            to="480 100 100"
            dur="5s"
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-55; 0,0"
            dur="5s"
            repeatCount="indefinite"
            additive="sum"
          />
        </circle>
      </g>

      <g filter="url(#neon-glow-yellow)">
        <circle cx="100" cy="100" r="2" fill="hsl(55, 100%, 50%)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="240 100 100"
            to="600 100 100"
            dur="6s"
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-65; 0,0"
            dur="6s"
            repeatCount="indefinite"
            additive="sum"
          />
        </circle>
      </g>

      {/* Corner accent lines */}
      <g opacity="0.5" stroke="url(#neon-gradient-1)" strokeWidth="2" fill="none">
        <line x1="10" y1="10" x2="30" y2="10">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="10" y1="10" x2="10" y2="30">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="0.5s" />
        </line>
        <line x1="190" y1="10" x2="170" y2="10">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="1s" />
        </line>
        <line x1="190" y1="10" x2="190" y2="30">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="1.5s" />
        </line>
        <line x1="10" y1="190" x2="30" y2="190">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="1s" />
        </line>
        <line x1="10" y1="190" x2="10" y2="170">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="1.5s" />
        </line>
        <line x1="190" y1="190" x2="170" y2="190">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin="0.5s" />
        </line>
        <line x1="190" y1="190" x2="190" y2="170">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        </line>
      </g>

      <style>{`
        .drunk30-logo {
          filter: drop-shadow(0 0 10px rgba(255, 0, 110, 0.5));
        }
      `}</style>
    </svg>
  )
}
