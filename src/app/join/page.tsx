'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const CONSENT_TEXT = `I agree to receive email updates about new episodes and content from drunk30.buzz. I understand I can unsubscribe at any time.`

export default function JoinPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!consentChecked) {
      setError('Please check the consent box to continue.')
      return
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          source: 'join-page',
          consentText: CONSENT_TEXT,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="container max-w-lg py-8 md:py-12">
        <Card>
          <CardContent className="flex flex-col items-center text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">You&apos;re In!</h1>
            <p className="text-muted-foreground">
              Thanks for joining. You&apos;ll get an email when new episodes drop.
              <br />
              No spam. Just updates.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-lg py-8 md:py-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join the Journey</CardTitle>
          <CardDescription>
            Get notified when new episodes drop. No spam, no selling your email.
            Just updates from someone building, recovering, and shipping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="What should I call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="consent"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
                disabled={isLoading}
              />
              <label htmlFor="consent" className="text-sm text-muted-foreground">
                {CONSENT_TEXT}
              </label>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join the List'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>
              Your email is stored securely and will never be sold.
              <br />
              Unsubscribe anytime with one click.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">What you&apos;ll get:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>New episode notifications</li>
          <li>Behind-the-scenes of building</li>
          <li>Honest updates on the recovery journey</li>
        </ul>
      </div>
    </div>
  )
}
