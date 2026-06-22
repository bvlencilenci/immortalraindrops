'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getPlaylistTracks,
  createPlaylistTrack,
  togglePlaylistFeatured,
  togglePlaylistActive,
  deletePlaylistTrack,
  type PlaylistTrack
} from '@/app/actions/playlist';

const ALLOWED_EXTENSIONS = ['mp3', 'wav', 'flac', 'm4a'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function PlaylistManager() {
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [search, setSearch] = useState('');

  // Upload form state
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [featured, setFeatured] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    const res = await getPlaylistTracks();
    if (res.success && res.tracks) {
      setTracks(res.tracks as PlaylistTrack[]);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      alert(`REJECTED: .${ext} format not accepted.\nAllowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(`REJECTED: File exceeds 100MB limit.`);
      return;
    }

    setSelectedFile(file);
    // Auto-populate title from filename if empty
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(nameWithoutExt);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      alert('TITLE and AUDIO FILE are required.');
      return;
    }

    setUploading(true);
    setUploadProgress('REQUESTING_CLEARANCE...');

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'mp3';

      // 1. Get presigned URL
      const signRes = await fetch('/api/godmode/sign-playlist-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ext,
          contentType: selectedFile.type,
          fileSize: selectedFile.size,
        }),
      });

      if (!signRes.ok) {
        const err = await signRes.json();
        throw new Error(err.error || 'Presign failed');
      }

      const { uploadUrl, audioKey } = await signRes.json();

      // 2. Upload directly to R2
      setUploadProgress('UPLOADING_TO_R2...');
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type },
      });

      if (!putRes.ok) throw new Error('R2 upload failed');

      // 3. Create database record
      setUploadProgress('WRITING_DB_RECORD...');
      const createRes = await createPlaylistTrack({
        title: title.trim(),
        artist_name: artistName.trim() || undefined,
        audio_url: audioKey,
        featured,
      });

      if (!createRes.success) throw new Error(createRes.error);

      // 4. Reset and refresh
      setUploadProgress('SYNCHRONIZED');
      setTitle('');
      setArtistName('');
      setFeatured(false);
      setSelectedFile(null);
      setShowUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchTracks();

    } catch (err: any) {
      alert(`UPLOAD_FAILED: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleToggleFeatured = async (track: PlaylistTrack) => {
    const res = await togglePlaylistFeatured(track.id!, track.featured || false);
    if (res.success) fetchTracks();
  };

  const handleToggleActive = async (track: PlaylistTrack) => {
    const res = await togglePlaylistActive(track.id!, track.active ?? true);
    if (res.success) fetchTracks();
  };

  const handleDelete = async (track: PlaylistTrack) => {
    if (!confirm(`CONFIRM DELETION: "${track.title}"?\nThis removes the track from radio rotation.`)) return;
    const res = await deletePlaylistTrack(track.id!);
    if (res.success) fetchTracks();
    else alert(`DELETE_FAILED: ${res.error}`);
  };

  // Filter tracks by search
  const filteredTracks = tracks.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.artist_name || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="text-[#ECEEDF] font-mono text-xs animate-pulse p-8">
        LOADING_RADIO_ROTATION...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-mono">

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#ECEEDF]/5 p-4 border border-[#ECEEDF]/10">
        <div className="flex items-center gap-4">
          <div className="text-[#ECEEDF]/40 text-[10px] uppercase tracking-widest">
            {tracks.length} TRACKS_IN_ROTATION
          </div>
          <div className="text-[#ECEEDF]/20 text-[10px]">
            {tracks.filter(t => t.featured).length} FEATURED
          </div>
          <div className="text-[#ECEEDF]/20 text-[10px]">
            {tracks.filter(t => t.active).length} ACTIVE
          </div>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-[#ECEEDF] text-black font-bold text-[10px] uppercase tracking-widest px-6 py-3 hover:bg-white transition-colors"
        >
          {showUpload ? '[ CANCEL ]' : '[ UPLOAD_TRACK ]'}
        </button>
      </div>

      {/* Upload Panel */}
      {showUpload && (
        <div className="border border-[#ECEEDF]/20 p-6 bg-black/40 flex flex-col gap-5">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-[#ECEEDF]/10 pb-3 text-[#ECEEDF]">
            NEW TRACK — RADIO ROTATION
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div>
              <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/50 mb-1.5 block">
                TITLE *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-black border border-[#ECEEDF]/20 p-2.5 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
                placeholder="Track title..."
              />
            </div>

            {/* Artist */}
            <div>
              <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/50 mb-1.5 block">
                ARTIST
              </label>
              <input
                type="text"
                value={artistName}
                onChange={e => setArtistName(e.target.value)}
                className="w-full bg-black border border-[#ECEEDF]/20 p-2.5 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
                placeholder="Artist name..."
              />
            </div>
          </div>

          {/* Audio File */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/50 mb-1.5 block">
              AUDIO FILE *
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border border-[#ECEEDF]/20 px-4 py-2 hover:bg-[#ECEEDF]/10 text-xs text-[#ECEEDF] transition-colors"
              >
                {selectedFile ? selectedFile.name : '[ SELECT_FILE ]'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept=".mp3,.wav,.flac,.m4a"
              />
              {selectedFile && (
                <span className="text-[9px] text-[#ECEEDF]/30">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB
                </span>
              )}
            </div>
          </div>

          {/* Featured Toggle */}
          <label className="flex items-center justify-between border border-[#ECEEDF]/20 p-3 bg-black/40 cursor-pointer w-fit gap-6">
            <span className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/80">
              FEATURED (PRIORITY ROTATION)
            </span>
            <input
              type="checkbox"
              checked={featured}
              onChange={e => setFeatured(e.target.checked)}
              className="w-4 h-4 accent-[#ECEEDF]"
            />
          </label>

          {/* Actions */}
          <div className="flex gap-4 border-t border-[#ECEEDF]/10 pt-4">
            <button
              onClick={() => {
                setShowUpload(false);
                setTitle('');
                setArtistName('');
                setFeatured(false);
                setSelectedFile(null);
              }}
              className="flex-1 border border-[#ECEEDF]/20 py-3 uppercase text-[10px] tracking-widest text-[#ECEEDF]/50 hover:bg-[#ECEEDF]/10"
              disabled={uploading}
            >
              CANCEL
            </button>
            <button
              onClick={handleUpload}
              className="flex-1 bg-[#ECEEDF] text-black py-3 uppercase text-[10px] font-bold tracking-widest hover:bg-white disabled:opacity-50"
              disabled={uploading || !selectedFile || !title.trim()}
            >
              {uploading ? uploadProgress : 'UPLOAD_TO_ROTATION'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-black border border-[#ECEEDF]/10 p-2.5 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]/40 font-mono"
          placeholder="SEARCH_ROTATION..."
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-[9px] text-[#ECEEDF]/30 hover:text-[#ECEEDF] uppercase tracking-widest"
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Track List */}
      <div className="border border-[#ECEEDF]/10 bg-black/40 p-4 md:p-6 flex flex-col gap-3">
        <h3 className="text-xs uppercase tracking-widest text-[#ECEEDF]/70 border-b border-[#ECEEDF]/10 pb-3">
          ROTATION_QUEUE
        </h3>

        {filteredTracks.length === 0 ? (
          <div className="text-[#ECEEDF]/30 text-xs py-8">
            {search ? 'NO MATCHING TRACKS.' : 'NO TRACKS IN ROTATION. UPLOAD TO BEGIN.'}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTracks.map(track => (
              <div
                key={track.id}
                className={`flex flex-col md:flex-row items-start md:items-center justify-between border p-4 hover:bg-[#ECEEDF]/5 transition-colors gap-3 ${
                  track.active === false
                    ? 'border-red-900/30 opacity-50'
                    : 'border-[#ECEEDF]/10'
                }`}
              >
                {/* Track Info */}
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#ECEEDF] truncate">
                      {track.title}
                    </span>
                    {track.artist_name && (
                      <span className="text-[9px] text-[#ECEEDF]/40 tracking-wider truncate">
                        — {track.artist_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {track.featured && (
                      <span className="text-[8px] bg-red-500 text-black font-bold px-1 uppercase">
                        FEATURED
                      </span>
                    )}
                    {track.active === false && (
                      <span className="text-[8px] border border-red-900/50 text-red-500 px-1 uppercase">
                        INACTIVE
                      </span>
                    )}
                    <span className="text-[8px] text-[#ECEEDF]/20 tracking-wider">
                      {track.created_at ? new Date(track.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleFeatured(track)}
                    className={`border text-[9px] tracking-widest uppercase px-3 py-2 transition-colors ${
                      track.featured
                        ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                        : 'border-[#ECEEDF]/20 text-[#ECEEDF]/40 hover:bg-[#ECEEDF]/10'
                    }`}
                  >
                    {track.featured ? 'FEATURED' : 'FEATURE'}
                  </button>
                  <button
                    onClick={() => handleToggleActive(track)}
                    className={`border text-[9px] tracking-widest uppercase px-3 py-2 transition-colors ${
                      track.active !== false
                        ? 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                        : 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                    }`}
                  >
                    {track.active !== false ? 'ACTIVE' : 'DISABLED'}
                  </button>
                  <button
                    onClick={() => handleDelete(track)}
                    className="border border-red-900/50 text-red-500 text-[9px] tracking-widest uppercase hover:bg-red-950/20 px-3 py-2"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
