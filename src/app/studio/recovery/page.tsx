'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Loader2,
  Heart,
  Calendar,
  Lock,
  Trash2,
  Edit2,
  Save,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface RecoveryEntry {
  id: string
  date: string
  mood: number
  content: string
  isPrivate: boolean
  createdAt: string
}

export default function RecoveryPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [entries, setEntries] = useState<RecoveryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // New entry form state
  const [newMood, setNewMood] = useState(5)
  const [newContent, setNewContent] = useState('')

  // Edit form state
  const [editMood, setEditMood] = useState(5)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    fetchEntries()
  }, [])

  async function fetchEntries() {
    try {
      const response = await fetch('/api/recovery')
      if (!response.ok) throw new Error('Failed to fetch entries')
      const data = await response.json()
      setEntries(data.entries)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load recovery entries.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createEntry = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: newMood,
          content: newContent,
          isPrivate: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to create entry')

      const data = await response.json()
      setEntries([data.entry, ...entries])
      setShowNewEntry(false)
      setNewMood(5)
      setNewContent('')

      toast({
        title: 'Entry Added',
        description: 'Your recovery entry has been saved.',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save entry.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (entry: RecoveryEntry) => {
    setEditingId(entry.id)
    setEditMood(entry.mood)
    setEditContent(entry.content)
  }

  const saveEdit = async () => {
    if (!editingId) return

    setSaving(true)
    try {
      const response = await fetch(`/api/recovery/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: editMood,
          content: editContent,
        }),
      })

      if (!response.ok) throw new Error('Failed to update entry')

      const data = await response.json()
      setEntries(entries.map((e) => (e.id === editingId ? data.entry : e)))
      setEditingId(null)

      toast({
        title: 'Updated',
        description: 'Your entry has been updated.',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update entry.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/recovery/${deleteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      setEntries(entries.filter((e) => e.id !== deleteId))
      setDeleteId(null)

      toast({
        title: 'Deleted',
        description: 'Entry has been removed.',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete entry.',
        variant: 'destructive',
      })
    }
  }

  const getMoodLabel = (mood: number) => {
    if (mood <= 2) return 'Struggling'
    if (mood <= 4) return 'Difficult'
    if (mood <= 6) return 'Okay'
    if (mood <= 8) return 'Good'
    return 'Great'
  }

  const getMoodColor = (mood: number) => {
    if (mood <= 2) return 'text-red-500'
    if (mood <= 4) return 'text-orange-500'
    if (mood <= 6) return 'text-yellow-500'
    if (mood <= 8) return 'text-green-500'
    return 'text-emerald-500'
  }

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/studio')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Recovery Journal
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Lock className="h-3 w-3" />
            Private. Only you can see these entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Entry Button */}
          {!showNewEntry && (
            <Button onClick={() => setShowNewEntry(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          )}

          {/* New Entry Form */}
          {showNewEntry && (
            <Card className="border-dashed">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>How are you feeling? (1-10)</Label>
                    <span className={getMoodColor(newMood)}>
                      {newMood} - {getMoodLabel(newMood)}
                    </span>
                  </div>
                  <Slider
                    value={[newMood]}
                    onValueChange={([v]) => setNewMood(v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>What's on your mind?</Label>
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Write honestly. This is just for you..."
                    rows={5}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createEntry} disabled={saving || !newContent.trim()}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Entry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewEntry(false)
                      setNewMood(5)
                      setNewContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entries List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No entries yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start journaling your recovery journey.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="pt-4">
                    {editingId === entry.id ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Mood (1-10)</Label>
                            <span className={getMoodColor(editMood)}>
                              {editMood} - {getMoodLabel(editMood)}
                            </span>
                          </div>
                          <Slider
                            value={[editMood]}
                            onValueChange={([v]) => setEditMood(v)}
                            min={1}
                            max={10}
                            step={1}
                          />
                        </div>
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`text-lg font-bold ${getMoodColor(entry.mood)}`}
                            >
                              {entry.mood}/10
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {getMoodLabel(entry.mood)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(entry.date)}
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(entry)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setDeleteId(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteEntry}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
