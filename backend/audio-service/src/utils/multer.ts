import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { generateUniqueFilename, ensureAudioDirectory } from './audioMetadata';

// Allowed audio file types
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', // .mp3
  'audio/wav',  // .wav
  'audio/flac', // .flac
  'audio/ogg',  // .ogg
  'audio/aac',  // .aac
  'audio/mp4',  // .m4a
  'audio/webm'  // .webm
];

// File size limit (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

// Create multer storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureAudioDirectory('uploads/audio');
      cb(null, 'uploads/audio');
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    if (!userId) {
      cb(new Error('User not authenticated'), '');
      return;
    }

    const uniqueFilename = generateUniqueFilename(file.originalname, userId);
    cb(null, uniqueFilename);
  }
});

// File filter to only allow audio files
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only audio files are allowed. Received: ${file.mimetype}`));
  }
};

// Create multer upload instance
export const uploadAudio = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Allow up to 10 files per upload
  }
});

// Middleware for handling single file upload
export const uploadSingleAudio = uploadAudio.single('audio');

// Middleware for handling multiple file uploads
export const uploadMultipleAudio = uploadAudio.array('audio', 10);
