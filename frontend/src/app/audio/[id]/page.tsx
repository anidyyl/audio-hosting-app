'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AudioMetadata {
  id: string;
  filename: string;
  original_filename?: string;
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  description?: string;
  tags?: string[];
  duration: number;
  size: number;
  uploadDate: string;
  url: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
}

interface AudioPlayerPageProps {
  params: {
    id: string;
  };
}

export default function AudioPlayerPage({ params }: AudioPlayerPageProps) {
  const resolvedParams = use(params);
  const [audioData, setAudioData] = useState<AudioMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<AudioMetadata>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchAudioData();
    }
  }, [resolvedParams?.id]);

  const fetchAudioData = async () => {
    if (!resolvedParams?.id) return;

    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUDIO_SERVICE_URL}/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAudioData(data.data);
      } else if (response.status === 401) {
        router.push('/login');
      } else if (response.status === 404) {
        setError('Audio file not found');
      } else {
        setError('Failed to load audio file');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const startEditing = () => {
    if (audioData) {
      setEditData({
        title: audioData.title,
        artist: audioData.artist || '',
        album: audioData.album || '',
        genre: audioData.genre || '',
        description: audioData.description || '',
        tags: audioData.tags ? [...audioData.tags] : []
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
  };

  const saveChanges = async () => {
    if (!audioData || !resolvedParams?.id) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUDIO_SERVICE_URL}/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setAudioData(updatedData.data);
        setIsEditing(false);
        setEditData({});
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update audio details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const updateEditData = (field: keyof AudioMetadata, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !editData.tags?.includes(tag.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!audioData || !resolvedParams?.id) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUDIO_SERVICE_URL}/${resolvedParams.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete audio file');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading audio file...</div>
      </div>
    );
  }

  if (error || !audioData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-gray-300 mb-6">{error || 'Audio file not found'}</p>
          <Link 
            href="/dashboard"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-white">
              Audio<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Host</span>
            </Link>
            <Link 
              href="/dashboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Audio Player */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-8">
            <audio
              ref={audioRef}
              src={`${process.env.NEXT_PUBLIC_AUDIO_FILE_URL}/${audioData.filename}`}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />

            {/* Track Info */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">{audioData.title}</h1>
              {audioData.artist && (
                <p className="text-xl text-gray-300 mb-4">{audioData.artist}</p>
              )}
              {audioData.album && (
                <p className="text-lg text-gray-400">{audioData.album}</p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={togglePlayPause}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-full text-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center w-16 h-16"
              >
                {isPlaying ? (
                  <span className="flex space-x-1">
                    <div className="w-1 h-6 bg-white"></div>
                    <div className="w-1 h-6 bg-white"></div>
                  </span>
                ) : (
                  <div className="ml-1">▶</div>
                )}
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center gap-4">
              <span className="text-gray-300">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-32 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-gray-300">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          {/* Audio Details */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Audio Details</h2>
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Edit Details
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEditing}
                    className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm">Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.title || ''}
                    onChange={(e) => updateEditData('title', e.target.value)}
                    className="w-full mt-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-white font-medium">{audioData.title || 'Unknown'}</p>
                )}
              </div>

              <div>
                <label className="text-gray-300 text-sm">Artist</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.artist || ''}
                    onChange={(e) => updateEditData('artist', e.target.value)}
                    className="w-full mt-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter artist name"
                  />
                ) : (
                  <p className="text-white font-medium">{audioData.artist || 'Unknown'}</p>
                )}
              </div>

              <div>
                <label className="text-gray-300 text-sm">Album</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.album || ''}
                    onChange={(e) => updateEditData('album', e.target.value)}
                    className="w-full mt-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter album name"
                  />
                ) : (
                  <p className="text-white font-medium">{audioData.album || 'Unknown'}</p>
                )}
              </div>

              <div>
                <label className="text-gray-300 text-sm">Genre</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.genre || ''}
                    onChange={(e) => updateEditData('genre', e.target.value)}
                    className="w-full mt-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter genre"
                  />
                ) : (
                  <p className="text-white font-medium">{audioData.genre || 'Unknown'}</p>
                )}
              </div>

              <div>
                <label className="text-gray-300 text-sm">Description</label>
                {isEditing ? (
                  <textarea
                    value={editData.description || ''}
                    onChange={(e) => updateEditData('description', e.target.value)}
                    className="w-full mt-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Enter description"
                  />
                ) : (
                  <p className="text-white font-medium">{audioData.description || 'No description available'}</p>
                )}
              </div>

              <div>
                <label className="text-gray-300 text-sm">Tags</label>
                {isEditing ? (
                  <div className="mt-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {editData.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-purple-400 hover:text-purple-200 text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a tag"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addTag(input.value);
                          input.value = '';
                        }}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {audioData.tags && audioData.tags.length > 0 ? (
                      audioData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">No tags</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delete Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={openDeleteModal}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-6 py-3 rounded-lg text-sm font-medium transition-colors border border-red-500/30 hover:border-red-500/50"
            >
              Delete Audio File
            </button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Audio File</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete <span className="font-semibold text-white">"{audioData?.title || audioData?.original_filename}"</span>?
                This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-500/30"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-500/30 hover:border-red-500/50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
