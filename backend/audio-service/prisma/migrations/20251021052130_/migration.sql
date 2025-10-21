-- CreateTable
CREATE TABLE "audio_files" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "duration_seconds" INTEGER,
    "bitrate" INTEGER,
    "sample_rate" INTEGER,
    "title" VARCHAR(255),
    "artist" VARCHAR(255),
    "album" VARCHAR(255),
    "genre" VARCHAR(100),
    "year" INTEGER,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" TIMESTAMP(6),

    CONSTRAINT "audio_files_pkey" PRIMARY KEY ("id")
);
