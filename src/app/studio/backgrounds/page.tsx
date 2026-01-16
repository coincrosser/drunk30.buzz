'use client'

import { useState } from 'react'

export default function BackgroundGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [aiImage, setAiImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [color1, setColor1] = useState('#1a1a2e')
  const [color2, setColor2] = useState('#16213e')
  const [color3, setColor3] = useState('#0f3460')
  const [angle, setAngle] = useState(135)
  const [activeTab, setActiveTab] = useState<'ai' | 'gradient'>('ai')

  const gradientCSS = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 50%, ${color3} 100%)`

  const generateAIBackground = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size: '1792x1024' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate')
      setAiImage(data.imageUrl)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyGradientCSS = () => {
    navigator.clipboard.writeText(`background: ${gradientCSS};`)
    alert('Copied!')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Background Generator</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded ${activeTab === 'ai' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          AI Generated
        </button>
        <button
          onClick={() => setActiveTab('gradient')}
          className={`px-4 py-2 rounded ${activeTab === 'gradient' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Gradient Creator
        </button>
      </div>

      {activeTab === 'ai' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Generate AI Background</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Describe your background..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateAIBackground()}
              className="flex-1 px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
            />
            <button
              onClick={generateAIBackground}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 rounded disabled:opacity-50 hover:bg-blue-700"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {['dark abstract tech', 'cosmic nebula', 'neon city', 'ocean waves', 'minimalist geometric'].map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
              >
                {p}
              </button>
            ))}
          </div>
          
          {error && <p className="text-red-400 mb-4">{error}</p>}
          
          {aiImage && (
            <div>
              <div
                className="w-full h-64 rounded-lg bg-cover bg-center mb-4 border border-gray-600"
                style={{ backgroundImage: `url(${aiImage})` }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(aiImage, '_blank')}
                  className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
                >
                  Download
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiImage)
                    alert('URL copied!')
                  }}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                >
                  Copy URL
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'gradient' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create Gradient Background</h2>
          
          <div
            className="w-full h-48 rounded-lg mb-4 border border-gray-600"
            style={{ background: gradientCSS }}
          />
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm block mb-1">Color 1</label>
              <input
                type="color"
                value={color1}
                onChange={(e) => setColor1(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Color 2</label>
              <input
                type="color"
                value={color2}
                onChange={(e) => setColor2(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Color 3</label>
              <input
                type="color"
                value={color3}
                onChange={(e) => setColor3(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="text-sm block mb-1">Angle: {angle}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="bg-gray-900 p-3 rounded mb-4 font-mono text-sm overflow-x-auto">
            background: {gradientCSS};
          </div>
          
          <button
            onClick={copyGradientCSS}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Copy CSS
          </button>
          
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Presets:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Night', c1: '#0f0c29', c2: '#302b63', c3: '#24243e' },
                { name: 'Ocean', c1: '#2193b0', c2: '#6dd5ed', c3: '#2193b0' },
                { name: 'Sunset', c1: '#ee9ca7', c2: '#ffdde1', c3: '#ee9ca7' },
                { name: 'Forest', c1: '#134e5e', c2: '#71b280', c3: '#134e5e' },
                { name: 'Fire', c1: '#f12711', c2: '#f5af19', c3: '#f12711' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setColor1(preset.c1)
                    setColor2(preset.c2)
                    setColor3(preset.c3)
                  }}
                  className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
