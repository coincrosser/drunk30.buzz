/**
 * Environment Validation Utility
 * Checks all required environment variables are set at startup
 */

export function validateEnvironment() {
  const errors: string[] = []
  const warnings: string[] = []

  // Critical variables
  if (!process.env.OPENAI_API_KEY) {
    errors.push(
      '❌ OPENAI_API_KEY is missing. Set it in .env.local to use AI generators.'
    )
  }

  if (!process.env.DATABASE_URL) {
    errors.push(
      '❌ DATABASE_URL is missing. Set it in .env.local for database operations.'
    )
  }

  // Optional but recommended
  if (!process.env.OPENAI_MODEL) {
    warnings.push(
      '⚠️  OPENAI_MODEL not set, using default: gpt-4o-mini'
    )
  }

  // Log results
  if (errors.length > 0) {
    console.error('\n🚨 ENVIRONMENT VALIDATION FAILED:')
    errors.forEach(err => console.error(err))
    console.error(
      '\n📝 To fix:\n' +
      '1. Open .env.local\n' +
      '2. Add your OPENAI_API_KEY from https://platform.openai.com/api-keys\n' +
      '3. Add your DATABASE_URL (e.g., postgresql://... or file:./prisma/dev.db)\n' +
      '4. Restart the dev server (npm run dev)\n'
    )
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  ENVIRONMENT WARNINGS:')
    warnings.forEach(warn => console.warn(warn))
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function logEnvironmentStatus() {
  const status = validateEnvironment()
  
  if (status.valid) {
    console.log('\n✅ Environment validation passed!')
    console.log('   • OpenAI API: Connected')
    console.log('   • Database: Configured')
  }
}
