'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AudioFile {
  id: string;
  filename: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: string;
  size?: number;
  uploadDate: string;
  url: string;
}

export default function DashboardPage() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const router = useRouter();

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  const fetchAudioFiles = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch('/api/audio/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming token storage
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAudioFiles(data.data || []);
      } else if (response.status === 401) {
        // Redirect to login if unauthorized
        router.push('/login');
      } else {
        setError('Failed to load audio files');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (duration: string) => {
    const seconds = parseFloat(duration);
    if (isNaN(seconds)) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setSelectedFiles([]);
    setUploadProgress({});
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFiles([]);
    setUploadProgress({});
  };

  const validateAudioFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'];
    if (!validTypes.includes(file.type)) {
      return false;
    }

    // Check file extension as fallback
    const validExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Validate files
    const validFiles = files.filter(file => {
      if (!validateAudioFile(file)) {
        alert(`${file.name} is not a valid audio file. Only MP3, WAV, OGG, FLAC, and AAC files are allowed.`);
        return false;
      }
      return true;
    });

    // Check for duplicates
    const existingNames = selectedFiles.map(f => f.name);
    const uniqueFiles = validFiles.filter(file => !existingNames.includes(file.name));

    if (uniqueFiles.length !== validFiles.length) {
      alert('Some files were skipped because they are already selected or have duplicate names.');
    }

    setSelectedFiles(prev => [...prev, ...uniqueFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      setIsUploading(false);
      return;
    }

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        const encodedFilename = encodeURIComponent(file.name);
        formData.append('audio', file, encodedFilename);

        const response = await fetch(`${process.env.NEXT_PUBLIC_AUDIO_SERVICE_URL}/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return response.json();
      });

      await Promise.all(uploadPromises);

      // Refresh the audio files list
      await fetchAudioFiles();
      closeUploadModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your audio files...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Audio<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Host</span>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={openUploadModal}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
              >
                Upload Audio
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/login');
                }}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Audio Library</h1>
          <p className="text-gray-300">Manage and play your uploaded audio files</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 mb-6">
            {error}
          </div>
        )}

        {audioFiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No audio files yet</h3>
            <p className="text-gray-300 mb-6">Upload your first audio file to get started</p>
            <button
              onClick={openUploadModal}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
            >
              Upload Audio
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            {audioFiles.map((file, index) => (
              <Link
                key={file.id}
                href={`/audio/${file.id}`}
                className={`flex items-center p-4 hover:bg-white/20 transition-all duration-300 group min-h-[80px] ${
                  index !== audioFiles.length - 1 ? 'border-b border-white/20' : ''
                }`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="text-2xl mr-4">🎵</div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors truncate">
                      {file.title || file.original_filename}
                    </h3>
                    
                    {(file.artist || file.album) ? (
                      <p className="text-gray-300 text-sm truncate">
                        {[file.artist, file.album].filter(Boolean).join(' • ')}
                      </p>
                    ) : (
                      <div className="h-4"></div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-400">
                  <span className="min-w-0">
                    {file.duration_seconds ? formatDuration(file.duration_seconds) : 'Unknown'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Upload Audio Files</h3>
              <button
                onClick={closeUploadModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* File Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">
                Select Audio Files (MP3, WAV, OGG, FLAC, AAC)
              </label>
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileSelect}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 transition-colors"
              />
              <p className="text-gray-400 text-xs mt-1">
                You can select multiple files at once. Only audio files are accepted.
              </p>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Selected Files ({selectedFiles.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/10 rounded-lg p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{file.name}</p>
                        <p className="text-gray-400 text-sm">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 ml-3 text-xl"
                        title="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeUploadModal}
                className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-6 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-500/30"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={uploadFiles}
                disabled={selectedFiles.length === 0 || isUploading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-all duration-300 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
