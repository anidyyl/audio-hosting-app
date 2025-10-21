import { parseFile } from 'music-metadata';
import { promises as fs } from 'fs';
import path from 'path';

export interface AudioMetadata {
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  comment?: string;
}

export async function extractAudioMetadata(filePath: string): Promise<AudioMetadata> {
  try {
    const metadata = await parseFile(filePath);

    return {
      duration: metadata.format.duration ? Math.round(metadata.format.duration) : undefined,
      bitrate: metadata.format.bitrate ? Math.round(metadata.format.bitrate) : undefined,
      sampleRate: metadata.format.sampleRate,
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      genre: metadata.common.genre?.[0],
      year: metadata.common.year,
      comment: metadata.common.comment?.[0]?.text
    };
  } catch (error) {
    console.warn(`Failed to extract metadata from ${filePath}:`, error);
    return {};
  }
}

export function generateUniqueFilename(originalFilename: string, userId: number): string {
  const timestamp = Date.now();
  const extension = path.extname(originalFilename);
  const basename = path.basename(originalFilename, extension);
  return `${userId}_${timestamp}_${basename}${extension}`;
}

export async function ensureAudioDirectory(audioDir: string = 'uploads/audio'): Promise<void> {
  try {
    await fs.access(audioDir);
  } catch {
    await fs.mkdir(audioDir, { recursive: true });
  }
}
