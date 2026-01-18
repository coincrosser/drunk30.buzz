-- CreateEnum
CREATE TYPE "EpisodeStatus" AS ENUM ('IDEA', 'OUTLINE', 'SCRIPT', 'READY_TO_RECORD', 'RECORDED', 'PROCESSING', 'PROCESSED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('TRANSCODE', 'GENERATE_THUMBNAIL', 'EXTRACT_AUDIO', 'GENERATE_SHORTS', 'PUBLISH_YOUTUBE');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('RAW_VIDEO', 'PROCESSED_VIDEO', 'AUDIO', 'THUMBNAIL', 'SHORT_CLIP', 'TRANSCRIPT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "episode_number" INTEGER,
    "description" TEXT,
    "topic" TEXT,
    "status" "EpisodeStatus" NOT NULL DEFAULT 'IDEA',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_outlines" (
    "id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "prompt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_outlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_scripts" (
    "id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "est_duration_ms" INTEGER NOT NULL DEFAULT 0,
    "prompt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recordings" (
    "id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "result" JSONB,
    "error_msg" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "run_after" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_packs" (
    "id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "title_options" TEXT[],
    "description" TEXT NOT NULL,
    "hashtags" TEXT[],
    "tags" TEXT[],
    "chapters" JSONB,
    "pinned_comment" TEXT,
    "thumbnail_ideas" TEXT[],
    "generation_prompt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youtube_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_clips" (
    "id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "title" TEXT,
    "start_ms" INTEGER NOT NULL,
    "end_ms" INTEGER NOT NULL,
    "storage_path" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_clips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_text" TEXT,
    "consent_ip" TEXT,
    "consent_datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[],
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mood" INTEGER,
    "sober_day" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "gratitude" TEXT,
    "triggers" TEXT[],
    "wins" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "episodes_user_id_idx" ON "episodes"("user_id");

-- CreateIndex
CREATE INDEX "episodes_status_idx" ON "episodes"("status");

-- CreateIndex
CREATE INDEX "episodes_is_public_published_at_idx" ON "episodes"("is_public", "published_at");

-- CreateIndex
CREATE INDEX "episodes_episode_number_idx" ON "episodes"("episode_number");

-- CreateIndex
CREATE UNIQUE INDEX "episode_outlines_episode_id_key" ON "episode_outlines"("episode_id");

-- CreateIndex
CREATE UNIQUE INDEX "episode_scripts_episode_id_key" ON "episode_scripts"("episode_id");

-- CreateIndex
CREATE INDEX "recordings_episode_id_idx" ON "recordings"("episode_id");

-- CreateIndex
CREATE INDEX "assets_episode_id_idx" ON "assets"("episode_id");

-- CreateIndex
CREATE INDEX "assets_type_idx" ON "assets"("type");

-- CreateIndex
CREATE INDEX "jobs_status_run_after_idx" ON "jobs"("status", "run_after");

-- CreateIndex
CREATE INDEX "jobs_episode_id_idx" ON "jobs"("episode_id");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_packs_episode_id_key" ON "youtube_packs"("episode_id");

-- CreateIndex
CREATE INDEX "short_clips_episode_id_idx" ON "short_clips"("episode_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_consent_given_idx" ON "leads"("consent_given");

-- CreateIndex
CREATE INDEX "recovery_entries_user_id_date_idx" ON "recovery_entries"("user_id", "date");

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_outlines" ADD CONSTRAINT "episode_outlines_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_scripts" ADD CONSTRAINT "episode_scripts_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_packs" ADD CONSTRAINT "youtube_packs_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_clips" ADD CONSTRAINT "short_clips_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_entries" ADD CONSTRAINT "recovery_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
