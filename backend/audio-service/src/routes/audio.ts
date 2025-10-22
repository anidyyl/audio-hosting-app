import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import multer from 'multer';
import { prisma } from '../utils/prisma';
import { extractAudioMetadata } from '../utils/audioMetadata';
import { uploadMultipleAudio } from '../utils/multer';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /audio - List all audio files for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const audioFiles = await prisma.userAudioFile.findMany({
      where: { user_id: userId },
      orderBy: { uploaded_at: 'desc' },
      select: {
        id: true,
        filename: true,
        original_filename: true,
        file_size: true,
        mime_type: true,
        duration_seconds: true,
        bitrate: true,
        sample_rate: true,
        title: true,
        artist: true,
        album: true,
        genre: true,
        year: true,
        description: true,
        tags: true,
        created_at: true,
        uploaded_at: true,
        last_accessed_at: true
      }
    });

    // Convert BigInt values to strings for JSON serialization
    const serializedAudioFiles = audioFiles.map(file => ({
      ...file,
      file_size: file.file_size.toString(),
      duration_seconds: file.duration_seconds?.toString() || null,
      bitrate: file.bitrate?.toString() || null,
      sample_rate: file.sample_rate?.toString() || null,
      year: file.year?.toString() || null
    }));

    res.json({
      success: true,
      data: serializedAudioFiles
    });
  } catch (error) {
    console.error('Error fetching audio files:', error);
    res.status(500).json({ error: 'Failed to fetch audio files' });
  }
});

// POST /audio - Upload one or more audio files
router.post('/', (req: Request, res: Response, next: any) => {
  uploadMultipleAudio(req, res, (err: any) => {
    if (err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files. Maximum 10 files allowed.' });
        }
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      } else if (err.message && err.message.includes('Invalid file type')) {
        // Handle file type validation errors
        return res.status(400).json({ error: "Invalid file type" });
      }
      // Handle other errors
      return res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const files = req.files as any[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No audio files provided' });
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Extract metadata from the uploaded file
        const metadata = await extractAudioMetadata(file.path);

        // Save file information to database
        const audioFile = await prisma.userAudioFile.create({
          data: {
            user_id: userId,
            filename: file.filename,
            original_filename: file.originalname,
            file_path: file.path,
            file_size: BigInt(file.size),
            mime_type: file.mimetype,
            duration_seconds: metadata.duration,
            bitrate: metadata.bitrate,
            sample_rate: metadata.sampleRate,
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            genre: metadata.genre,
            year: metadata.year,
            description: metadata.comment
          }
        });

        uploadedFiles.push({
          id: audioFile.id,
          filename: audioFile.filename,
          original_filename: audioFile.original_filename,
          file_size: audioFile.file_size.toString(),
          mime_type: audioFile.mime_type,
          duration_seconds: audioFile.duration_seconds,
          bitrate: audioFile.bitrate,
          sample_rate: audioFile.sample_rate,
          title: audioFile.title,
          artist: audioFile.artist,
          album: audioFile.album,
          genre: audioFile.genre,
          year: audioFile.year,
          description: audioFile.description,
          uploaded_at: audioFile.uploaded_at
        });
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        // Clean up the uploaded file if database insertion fails
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ error: 'Failed to process any audio files' });
    }

    // Convert BigInt values to strings for JSON serialization
    const serializedUploadedFiles = uploadedFiles.map(file => ({
      ...file,
      file_size: file.file_size.toString(),
      duration_seconds: file.duration_seconds?.toString() || null,
      bitrate: file.bitrate?.toString() || null,
      sample_rate: file.sample_rate?.toString() || null,
      year: file.year?.toString() || null
    }));

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} audio file(s)`,
      data: serializedUploadedFiles
    });
  } catch (error) {
    console.error('Error uploading audio files:', error);
    res.status(500).json({ error: 'Failed to upload audio files' });
  }
});

// GET /audio/:id - Get metadata for a single audio file
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const audioFile = await prisma.userAudioFile.findFirst({
      where: {
        id: fileId,
        user_id: userId
      },
      select: {
        id: true,
        filename: true,
        original_filename: true,
        file_path: true,
        file_size: true,
        mime_type: true,
        duration_seconds: true,
        bitrate: true,
        sample_rate: true,
        title: true,
        artist: true,
        album: true,
        genre: true,
        year: true,
        description: true,
        tags: true,
        created_at: true,
        uploaded_at: true,
        last_accessed_at: true
      }
    });

    if (!audioFile) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Update last accessed timestamp
    await prisma.userAudioFile.update({
      where: { id: fileId },
      data: { last_accessed_at: new Date() }
    });

    res.json({
      success: true,
      data: {
        ...audioFile,
        file_size: audioFile.file_size.toString(),
        duration_seconds: audioFile.duration_seconds?.toString() || null,
        bitrate: audioFile.bitrate?.toString() || null,
        sample_rate: audioFile.sample_rate?.toString() || null,
        year: audioFile.year?.toString() || null
      }
    });
  } catch (error) {
    console.error('Error fetching audio file:', error);
    res.status(500).json({ error: 'Failed to fetch audio file' });
  }
});

// PATCH /audio/:id - Update an audio file
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const { title, artist, album, genre, year, description, tags } = req.body;

    const audioFile = await prisma.userAudioFile.update({
      where: { id: fileId, user_id: userId },
      data: { title, artist, album, genre, year, description, tags }
    });

    res.json({ success: true, data: {
        ...audioFile,
        file_size: audioFile.file_size.toString(),
        duration_seconds: audioFile.duration_seconds?.toString() || null,
        bitrate: audioFile.bitrate?.toString() || null,
        sample_rate: audioFile.sample_rate?.toString() || null,
        year: audioFile.year?.toString() || null
    } });
  } catch (error) {
    console.error('Error updating audio file:', error);
    res.status(500).json({ error: 'Failed to update audio file' });
  }
});

// DELETE /audio/:id - Delete an audio file
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Find the file to get its path
    const audioFile = await prisma.userAudioFile.findFirst({
      where: {
        id: fileId,
        user_id: userId
      },
      select: {
        id: true,
        file_path: true,
        filename: true
      }
    });

    if (!audioFile) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Delete the file from filesystem
    try {
      await fs.unlink(audioFile.file_path);
    } catch (fileError) {
      console.warn(`Could not delete file ${audioFile.file_path}:`, fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.userAudioFile.delete({
      where: { id: fileId }
    });

    res.json({
      success: true,
      message: `Audio file "${audioFile.filename}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    res.status(500).json({ error: 'Failed to delete audio file' });
  }
});

export default router;
