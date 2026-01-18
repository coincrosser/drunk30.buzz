/**
 * AI API Error Handling
 * Provides standardized error responses for all AI generator endpoints
 */

import { NextResponse } from 'next/server'

export class AIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AIError'
  }
}

export function handleAIError(error: unknown) {
  console.error('AI Generation Error:', error)

  if (error instanceof AIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        status: 'error',
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        error: 'Invalid JSON in request',
        code: 'INVALID_JSON',
        status: 'error',
      },
      { status: 400 }
    )
  }

  // Check for OpenAI API errors
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('OPENAI_API_KEY')) {
    return NextResponse.json(
      {
        error:
          'OpenAI API key is not configured. Set OPENAI_API_KEY in .env.local',
        code: 'MISSING_API_KEY',
        status: 'error',
      },
      { status: 503 }
    )
  }

  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
    return NextResponse.json(
      {
        error:
          'OpenAI API key is invalid. Check your .env.local OPENAI_API_KEY',
        code: 'INVALID_API_KEY',
        status: 'error',
      },
      { status: 401 }
    )
  }

  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return NextResponse.json(
      {
        error:
          'Rate limited by OpenAI. Wait a moment and try again.',
        code: 'RATE_LIMIT',
        status: 'error',
      },
      { status: 429 }
    )
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
    return NextResponse.json(
      {
        error:
          'Connection to OpenAI failed. Check your internet connection.',
        code: 'CONNECTION_ERROR',
        status: 'error',
      },
      { status: 503 }
    )
  }

  // Generic error
  return NextResponse.json(
    {
      error:
        process.env.NODE_ENV === 'development'
          ? errorMessage
          : 'Failed to generate content. Please try again.',
      code: 'GENERATION_FAILED',
      status: 'error',
    },
    { status: 500 }
  )
}

export function validateInput(data: Record<string, any>, requiredFields: string[]) {
  const missing = requiredFields.filter(field => !data[field])
  if (missing.length > 0) {
    throw new AIError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      'MISSING_FIELDS'
    )
  }
}
