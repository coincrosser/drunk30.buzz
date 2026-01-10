'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function NewEpisodePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')

  const [generatedOutline, setGeneratedOutline] = useState('')
  const [generatedScript, setGeneratedScript] = useState('')

  const handleGenerateOutline = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, title }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate outline')
      }

      setGeneratedOutline(data.outline)
      if (!title && data.title) {
        setTitle(data.title)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate outline')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateScript = async () => {
    if (!generatedOutline.trim()) {
      setError('Please generate an outline first')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/ai/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outline: generatedOutline,
          title,
          topic,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate script')
      }

      setGeneratedScript(data.script)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate script')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreate = async (withScript = false) => {
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          topic,
          description,
          outline: generatedOutline || undefined,
          script: withScript ? generatedScript : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create episode')
      }

      router.push(`/studio/process/${data.episode.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create episode')
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create New Episode</h1>
        <p className="text-muted-foreground">
          Start with an idea and let AI help you build it out
        </p>
      </div>

      <Tabs defaultValue="idea" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="idea">1. Idea</TabsTrigger>
          <TabsTrigger value="outline" disabled={!topic}>2. Outline</TabsTrigger>
          <TabsTrigger value="script" disabled={!generatedOutline}>3. Script</TabsTrigger>
        </TabsList>

        <TabsContent value="idea">
          <Card>
            <CardHeader>
              <CardTitle>What&apos;s the episode about?</CardTitle>
              <CardDescription>
                Start with your topic or idea. AI will help expand it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic or Idea *</Label>
                <Textarea
                  id="topic"
                  placeholder="e.g., Why I'm building in public at 51, lessons from my first failed startup, how I'm using AI as leverage..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Episode Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="Leave blank to generate one"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description for the episode listing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateOutline}
                  disabled={isGenerating || !topic.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Outline
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCreate(false)}
                  disabled={isLoading || !title.trim()}
                >
                  Skip to Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outline">
          <Card>
            <CardHeader>
              <CardTitle>Episode Outline</CardTitle>
              <CardDescription>
                Review and edit the generated outline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="outline">Outline</Label>
                <Textarea
                  id="outline"
                  value={generatedOutline}
                  onChange={(e) => setGeneratedOutline(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateScript}
                  disabled={isGenerating || !generatedOutline.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Script
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCreate(false)}
                  disabled={isLoading}
                >
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script">
          <Card>
            <CardHeader>
              <CardTitle>Episode Script</CardTitle>
              <CardDescription>
                Review and edit the script before recording
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="script">Script</Label>
                <Textarea
                  id="script"
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  rows={20}
                  className="font-mono text-sm leading-relaxed"
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleCreate(true)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Episode
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
