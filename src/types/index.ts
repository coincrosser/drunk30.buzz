import type { 
  Episode, 
  EpisodeOutline, 
  EpisodeScript, 
  Recording, 
  Asset, 
  Job, 
  YouTubePack, 
  Lead, 
  RecoveryEntry,
  EpisodeStatus,
  JobStatus,
  JobType,
  AssetType
} from '@prisma/client'

// Re-export Prisma types for convenience
export type {
  Episode,
  EpisodeOutline,
  EpisodeScript,
  Recording,
  Asset,
  Job,
  YouTubePack,
  Lead,
  RecoveryEntry,
  EpisodeStatus,
  JobStatus,
  JobType,
  AssetType
}

// Extended types with relations
export type EpisodeWithRelations = Episode & {
  outline?: EpisodeOutline | null
  script?: EpisodeScript | null
  recordings?: Recording[]
  assets?: Asset[]
  jobs?: Job[]
  youtubePack?: YouTubePack | null
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// YouTube Pack generation
export interface YouTubePackInput {
  title: string
  description?: string
  topic?: string
  scriptContent?: string
}

export interface GeneratedYouTubePack {
  titleOptions: string[]
  description: string
  hashtags: string[]
  tags: string[]
  chapters: ChapterMarker[]
  pinnedComment: string
  thumbnailIdeas: string[]
}

export interface ChapterMarker {
  timestamp: string
  title: string
}

// Outline generation
export interface OutlineInput {
  topic: string
  context?: string
  targetDuration?: number
}

export interface GeneratedOutline {
  title: string
  hook: string
  sections: OutlineSection[]
  callToAction: string
}

export interface OutlineSection {
  title: string
  points: string[]
  estimatedDuration: number
}

// Script generation
export interface ScriptInput {
  outline: string
  title: string
  targetDuration?: number
  tone?: string
}

// Lead capture
export interface LeadInput {
  email: string
  name?: string
  source?: string
  consentText: string
}

// Recording
export interface RecordingInput {
  episodeId: string
  blob: Blob
  mimeType: string
}

// Job queue
export interface CreateJobInput {
  episodeId: string
  type: JobType
  payload?: Record<string, unknown>
}

// Teleprompter settings
export interface TeleprompterSettings {
  fontSize: number
  scrollSpeed: number
  mirrorMode: boolean
  lineHeight: number
  textAlign: 'left' | 'center'
}

// Auth
export interface AuthUser {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}
