import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '1024x1024' } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${prompt}, high quality, suitable for website background`,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: 'standard',
    })

    const imageUrl = response?.data?.[0]?.url

    if (!imageUrl) {
      throw new Error('Failed to generate image: no URL returned')
    }

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}
