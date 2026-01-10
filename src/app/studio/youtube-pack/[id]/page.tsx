'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Youtube,
  Hash,
  Tag,
  MessageSquare,
  Clock,
  Image,
  RefreshCw,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface YouTubePack {
  id: string
  titles: string[]
  description: string
  hashtags: string[]
  tags: string[]
  chapters: string | null
  pinnedComment: string | null
  thumbnailIdeas: string[]
}

interface Episode {
  id: string
  title: string
  description: string | null
  episodeNumber: number
  script: {
    content: string
  } | null
  youtubePack: YouTubePack | null
}

export default function YouTubePackPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [episode, setEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Editable state
  const [titles, setTitles] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [chapters, setChapters] = useState('')
  const [pinnedComment, setPinnedComment] = useState('')
  const [thumbnailIdeas, setThumbnailIdeas] = useState<string[]>([])

  useEffect(() => {
    async function fetchEpisode() {
      try {
        const response = await fetch(`/api/episodes/${params.id}?include=script,youtubePack`)
        if (!response.ok) throw new Error('Episode not found')
        const data = await response.json()
        setEpisode(data.episode)

        // Load existing pack if available
        if (data.episode.youtubePack) {
          const pack = data.episode.youtubePack
          setTitles(pack.titles || [])
          setDescription(pack.description || '')
          setHashtags(pack.hashtags || [])
          setTags(pack.tags || [])
          setChapters(pack.chapters || '')
          setPinnedComment(pack.pinnedComment || '')
          setThumbnailIdeas(pack.thumbnailIdeas || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load episode')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchEpisode()
  }, [params.id])

  const generatePack = async () => {
    if (!episode) return

    setGenerating(true)
    try {
      const response = await fetch('/api/ai/youtube-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: episode.id,
          title: episode.title,
          description: episode.description,
          script: episode.script?.content,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate YouTube pack')
      }

      const data = await response.json()
      const pack = data.youtubePack

      setTitles(pack.titles || [])
      setDescription(pack.description || '')
      setHashtags(pack.hashtags || [])
      setTags(pack.tags || [])
      setChapters(pack.chapters || '')
      setPinnedComment(pack.pinnedComment || '')
      setThumbnailIdeas(pack.thumbnailIdeas || [])

      toast({
        title: 'YouTube Pack Generated',
        description: 'AI has created your metadata. Review and edit as needed.',
      })
    } catch (err) {
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Could not generate pack.',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const savePack = async () => {
    if (!episode) return

    setSaving(true)
    try {
      const response = await fetch(`/api/episodes/${episode.id}/youtube-pack`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titles,
          description,
          hashtags,
          tags,
          chapters: chapters || null,
          pinnedComment: pinnedComment || null,
          thumbnailIdeas,
        }),
      })

      if (!response.ok) throw new Error('Failed to save')

      toast({
        title: 'Saved',
        description: 'Your YouTube pack has been saved.',
      })
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: 'Could not save changes.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard.`,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !episode) {
    return (
      <div className="container max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Episode Not Found</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/studio')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Studio
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/studio')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-sm text-muted-foreground">
          Episode {episode.episodeNumber}: {episode.title}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube Pack
          </CardTitle>
          <CardDescription>
            AI-generated metadata for your YouTube upload. Edit and copy what you need.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={generatePack} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : titles.length > 0 ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
            {titles.length > 0 && (
              <Button variant="outline" onClick={savePack} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {titles.length > 0 && (
        <Tabs defaultValue="titles" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="titles">Titles</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="more">More</TabsTrigger>
          </TabsList>

          <TabsContent value="titles">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  Title Options
                </CardTitle>
                <CardDescription>
                  Choose the title that best captures your episode.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {titles.map((title, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={title}
                      onChange={(e) => {
                        const newTitles = [...titles]
                        newTitles[index] = e.target.value
                        setTitles(newTitles)
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(title, `Title ${index + 1}`)}
                    >
                      {copied === `Title ${index + 1}` ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="description">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
                <CardDescription>
                  Your video description with links and context.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(description, 'Description')}
                >
                  {copied === 'Description' ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy Description
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hashtags">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Hashtags
                </CardTitle>
                <CardDescription>
                  Add to your title or description for discoverability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag, index) => (
                    <div
                      key={index}
                      className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        className="ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => setHashtags(hashtags.filter((_, i) => i !== index))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(hashtags.map((t) => `#${t}`).join(' '), 'Hashtags')
                  }
                >
                  {copied === 'Hashtags' ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy All Hashtags
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Video Tags
                </CardTitle>
                <CardDescription>
                  Keywords for YouTube's search algorithm.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="border px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        className="ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => setTags(tags.filter((_, i) => i !== index))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(tags.join(', '), 'Tags')}
                >
                  {copied === 'Tags' ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy All Tags
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chapters">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Chapters
                </CardTitle>
                <CardDescription>
                  Timestamp chapters for video navigation (add to description).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={chapters}
                  onChange={(e) => setChapters(e.target.value)}
                  rows={8}
                  placeholder="00:00 - Introduction&#10;01:30 - Main Topic&#10;05:00 - Conclusion"
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(chapters, 'Chapters')}
                  disabled={!chapters}
                >
                  {copied === 'Chapters' ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy Chapters
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="more">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Pinned Comment
                  </CardTitle>
                  <CardDescription>
                    First comment to pin for engagement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={pinnedComment}
                    onChange={(e) => setPinnedComment(e.target.value)}
                    rows={4}
                    placeholder="Thanks for watching! Drop a comment..."
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(pinnedComment, 'Pinned Comment')}
                    disabled={!pinnedComment}
                  >
                    {copied === 'Pinned Comment' ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    Copy Comment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Thumbnail Ideas
                  </CardTitle>
                  <CardDescription>
                    Text and visual concepts for your thumbnail.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {thumbnailIdeas.map((idea, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground text-sm">{index + 1}.</span>
                        <span className="text-sm">{idea}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
