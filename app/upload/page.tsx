'use client';

import { useState, useRef, useEffect } from 'react';
import { finalizeUpload } from './actions';
import Image from 'next/image';

// Explicit State Constants
const STATE = {
  IDLE: 'UPLOAD_IDLE',
  PREVIEW: 'PREVIEW_MODE',
  UPLOADING: 'UPLOADING_PROGRESS',
  SUCCESS: 'UPLOAD_SUCCESS',
  ERROR: 'UPLOAD_ERROR',
} as const;

type UploadState = typeof STATE[keyof typeof STATE];
type ErrorTarget = 'artist' | 'title' | 'audio' | 'image' | 'generic' | null;

export default function UploadPage() {
  const [status, setStatus] = useState<UploadState>(STATE.IDLE);
  const [progress, setProgress] = useState(0);
  const [mediaType, setMediaType] = useState<'song' | 'dj set' | 'video' | 'image'>('song');
  const [errorTarget, setErrorTarget] = useState<ErrorTarget>(null);
  const [resultTileId, setResultTileId] = useState<string | null>(null);

  // Metadata State
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');

  // File State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // CLEANUP
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // HELPER: Rename File
  const renameFile = (file: File, newBaseName: string) => {
    const ext = file.name.split('.').pop() || '';
    return new File([file], `${newBaseName}.${ext}`, { type: file.type });
  };

  // --- HANDLERS ---
  const handleAudioSelect = (file: File) => {
    setAudioFile(renameFile(file, 'audio'));
    if (errorTarget === 'audio') setErrorTarget(null);
  };

  const handleVisualSelect = (file: File) => {
    const renamed = renameFile(file, 'visual');
    setImageFile(renamed);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(renamed));
    if (errorTarget === 'image') setErrorTarget(null);
  };

  // --- FILE INPUT TRIGGERS ---
  const onAudioClick = () => audioInputRef.current?.click();
  const onVisualClick = () => imageInputRef.current?.click();

  // --- ACTIONS ---
  const handlePreview = () => {
    let hasError = false;
    if (!artist.trim()) { setErrorTarget('artist'); hasError = true; }
    if (!title.trim()) { setErrorTarget('title'); hasError = true; }
    if (!audioFile) { setErrorTarget('audio'); hasError = true; }
    if (!imageFile) { setErrorTarget('image'); hasError = true; }

    if (hasError) return;

    setErrorTarget(null);
    setStatus(STATE.PREVIEW);
  };

  const handleCancelPreview = () => {
    setStatus(STATE.IDLE);
  };

  // --- CLIENT-SIDE UPLOAD ---
  const handlePostToArchive = async () => {
    if (!audioFile || !imageFile) return;

    setStatus(STATE.UPLOADING);
    setProgress(5);

    try {
      // 1. Get Presigned URLs
      const presignRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioExt: audioFile.name.split('.').pop() || 'mp3',
          imageExt: imageFile.name.split('.').pop() || 'jpg',
          audioType: audioFile.type,
          imageType: imageFile.type,
        }),
      });
      if (!presignRes.ok) throw new Error('Failed to get upload authorization');

      const { tileId, nextIndex, audioUrl, visualUrl } = await presignRes.json();
      setProgress(20);

      // 2. Upload to R2 (Parallel)
      // Convert to Blob to strip "filename" metadata that might trigger complex preflight
      const audioBlob = audioFile.slice(0, audioFile.size, audioFile.type);
      const imageBlob = imageFile.slice(0, imageFile.size, imageFile.type);

      const uploadAudio = fetch(audioUrl, {
        method: 'PUT',
        body: audioBlob,
        headers: {
          'Content-Type': audioFile.type
        }
      });
      const uploadImage = fetch(visualUrl, {
        method: 'PUT',
        body: imageBlob,
        headers: {
          'Content-Type': imageFile.type
        }
      });

      const [audioRes, imageRes] = await Promise.all([uploadAudio, uploadImage]);

      // CRITICAL: Prevent Ghost Tiles by ensuring R2 upload succeeded BEFORE DB Sync
      if (!audioRes.ok || !imageRes.ok) {
        throw new Error(`R2 Upload Failed: Audio(${audioRes.status}) Image(${imageRes.status})`);
      }

      setProgress(80);

      // 3. Finalize Metadata in DB (ONLY after successful R2 upload)
      // Use process.env.NEXT_PUBLIC_R2_URL logic implicitly by storing relative paths if needed, 
      // but here we just pass metadata. URL construction happens in Tile.tsx.
      const finalizeRes = await finalizeUpload({
        title,
        artist,
        tileIndex: nextIndex,
        tileId,
        audioExt: audioFile.name.split('.').pop() || 'mp3',
        imageExt: imageFile.name.split('.').pop() || 'jpg',
        mediaType: mediaType,
      });

      if (!finalizeRes.success) throw new Error(finalizeRes.error);

      // Success!
      setProgress(100);
      setResultTileId(finalizeRes.tileId || tileId);
      setStatus(STATE.SUCCESS);

      setTimeout(() => {
        setStatus(STATE.IDLE);
        setProgress(0);
        setAudioFile(null);
        setImageFile(null);
        setPreviewUrl(null);
        setTitle('');
        setArtist('');
        setResultTileId(null);
      }, 4000);

    } catch (error) {
      console.error('Upload Flow Error:', error);
      setStatus(STATE.ERROR);
      setErrorTarget('generic');

      setTimeout(() => setStatus(STATE.IDLE), 3000);
    }
  };

  // --- DROPDOWN STATE ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getShelfStyle = (target: ErrorTarget, current: ErrorTarget) => {
    // 1px Bottom Border (Shelf), no side borders
    const isError = current === target;
    // IMPROVEMENT 2 & 4: Visible focus state and subtle background
    return `w-full bg-[#ECEEDF]/5 p-4 font-mono text-[#ECEEDF] uppercase tracking-wider text-center focus:outline-none focus:ring-1 focus:ring-[#ECEEDF]/80 transition-all border-b ${isError ? 'border-[#cc0000]/50 placeholder-[#cc0000]/50' : 'border-[#ECEEDF]/20 placeholder-[#ECEEDF]/50 hover:border-[#ECEEDF]/40'
      }`;
  };

  if (status === STATE.SUCCESS) {
    return (
      <main className="flex-1 w-full min-h-screen bg-[#000000] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <span className="font-mono text-[#ECEEDF] text-2xl tracking-widest uppercase">
            DEPLOYMENT SUCCESSFUL
          </span>
          <span className="font-mono text-[#ECEEDF]/50 text-sm tracking-wider uppercase">
            ARCHIVED TO {resultTileId}
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full min-h-screen bg-[#000000] pt-[110px] pb-12 px-8 lg:px-16 flex justify-center">

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">

        {/* LEFT COLUMN: FORM (60%) */}
        <div className="w-full lg:col-span-7 flex flex-col gap-8">

          {/* SECTION 1: TYPE SELECTOR */}
          <div className="flex flex-col gap-4">
            {/* Header spacer (16px visual adj) */}
            <div className="h-4 hidden lg:block" />

            <div className="w-full flex flex-col gap-4">
              <div className="text-[#ECEEDF]/40 text-[11px] tracking-widest pl-3 mb-1 font-mono uppercase">[ TYPE ]</div>
              <div className="flex flex-col gap-2">
                {['song', 'dj set', 'video'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setMediaType(type as any);
                      setArtist('');
                      setTitle('');
                    }}
                    aria-pressed={mediaType === type}
                    className={`
                      flex items-center gap-3 px-4 py-3 font-mono text-[13px] text-left transition-all duration-200 border-none focus:outline-none focus:bg-[#ECEEDF]/10 rounded-sm
                      ${mediaType === type
                        ? 'text-[#ECEEDF] bg-[#ECEEDF]/10'
                        : 'text-[#ECEEDF]/50 hover:bg-[#ECEEDF]/5 hover:text-[#ECEEDF]/80'}
                    `}
                  >
                    <span className={`w-[12px] font-bold ${mediaType === type ? 'opacity-100' : 'opacity-0'}`}>&gt;</span>
                    <span className="uppercase tracking-wider">{type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: METADATA */}
          <div className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="ARTIST"
              aria-label="Artist Name"
              value={artist}
              onChange={(e) => { setArtist(e.target.value); if (errorTarget === 'artist') setErrorTarget(null); }}
              className={getShelfStyle('artist', errorTarget)}
            />
            <input
              type="text"
              placeholder="TITLE"
              aria-label="Title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (errorTarget === 'title') setErrorTarget(null); }}
              className={getShelfStyle('title', errorTarget)}
            />
          </div>

          {/* SECTION 3: FILES */}
          <div className="flex flex-col gap-6">
            {/* AUDIO INPUT */}
            <div className="flex justify-between items-center p-6 bg-white/[0.03] rounded-xl border border-white/10 transition-all hover:bg-white/5 hover:border-white/20">
              <span className="text-white/60 text-[11px] tracking-widest font-mono uppercase">
                [ AUDIO_SOURCE ]
              </span>
              <button
                onClick={() => audioInputRef.current?.click()}
                className="px-6 py-3 bg-transparent border border-white/30 rounded-lg text-white/70 cursor-pointer font-mono text-[11px] tracking-widest transition-all hover:bg-white/[0.08] hover:border-white/50 hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Select audio file"
              >
                {audioFile ? (
                  <span className="text-[#ECEEDF]">{audioFile.name}</span>
                ) : (
                  'SELECT FILE'
                )}
              </button>
              <input
                type="file"
                ref={audioInputRef}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAudioSelect(e.target.files[0])}
                accept="audio/*"
                aria-hidden="true"
              />
            </div>

            {/* VISUAL INPUT */}
            <div className="flex justify-between items-center p-6 bg-white/[0.03] rounded-xl border border-white/10 transition-all hover:bg-white/5 hover:border-white/20">
              <span className="text-white/60 text-[11px] tracking-widest font-mono uppercase">
                [ VISUAL_SOURCE ]
              </span>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="px-6 py-3 bg-transparent border border-white/30 rounded-lg text-white/70 cursor-pointer font-mono text-[11px] tracking-widest transition-all hover:bg-white/[0.08] hover:border-white/50 hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Select visual file"
              >
                {imageFile ? (
                  <span className="text-[#ECEEDF]">{imageFile.name}</span>
                ) : (
                  'SELECT FILE'
                )}
              </button>
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleVisualSelect(e.target.files[0])}
                accept="image/*"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* SECTION 4: ACTION (Spacing 48px from content) */}
          <div className="pt-12 pb-12 flex items-center gap-6">
            {status === STATE.UPLOADING ? (
              <span className="font-mono text-[#ECEEDF]/40 text-xs tracking-[0.4em] uppercase animate-pulse">
                SYNCING_DATA... {progress}%
              </span>
            ) : (
              <button
                onClick={handlePostToArchive}
                disabled={!artist || !title || !audioFile || !imageFile}
                aria-label="Upload"
                className={`
                    w-full md:w-auto font-mono text-[#ECEEDF] text-xl tracking-[0.2em] uppercase border border-[#ECEEDF]/20 px-12 py-4 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[#ECEEDF]
                    ${(!artist || !title || !audioFile || !imageFile)
                    ? 'opacity-40 cursor-not-allowed'
                    : 'opacity-100 hover:bg-[#ECEEDF] hover:text-black hover:-translate-y-[1px] active:translate-y-0'
                  }
                  `}
              >
                UPLOAD
              </button>
            )}
            {status === STATE.ERROR && (
              <span role="alert" className="font-mono text-[#cc0000] text-xs uppercase tracking-widest animate-pulse">
                UPLOAD FAILED
              </span>
            )}

            {/* Screen Reader Status Region */}
            <div role="status" aria-live="polite" className="sr-only">
              {audioFile && `Audio file selected: ${audioFile.name}`}
              {imageFile && `Image file selected: ${imageFile.name}`}
              {status === STATE.UPLOADING && 'Uploading files...'}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PREVIEW (40%) */}
        <div className="w-full lg:col-span-5 flex flex-col items-center lg:items-end justify-start relative sticky top-32">

          {/* Preview Container */}
          <div className="w-full max-w-[500px] flex flex-col items-center gap-8 p-8">
            <h2 className="font-mono text-[#ECEEDF]/40 text-sm tracking-[0.2em] uppercase">
              LIVE PREVIEW
            </h2>

            {/* TILE PREVIEW CARD */}
            <div className="relative w-full aspect-square bg-black border border-[#ECEEDF]/10 group overflow-hidden transition-all duration-500 shadow-2xl shadow-black/80">
              {/* Image */}
              <div className="absolute inset-0 w-full h-full bg-[#ECEEDF]/5">
                {previewUrl && (
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover opacity-80"
                  />
                )}
              </div>

              {/* Overlay Text */}
              {/* Exact Overlay Layout from Tile.tsx */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-100 z-10 pointer-events-none" />

              {/* Metadata */}
              <div className="absolute top-[24px] left-[12px] md:top-[32px] md:left-[20px] flex flex-col z-20 pointer-events-none">
                <span className="text-[15px] font-mono text-[#ECEEDF] lowercase leading-none tracking-normal text-left">
                  {artist || '—'}
                </span>
                <span className="text-[20px] md:text-[28px] uppercase leading-none tracking-tighter mt-1 text-[#ECEEDF] text-left">
                  {title || '—'}
                </span>
              </div>
            </div>

            <div className="text-[#ECEEDF]/20 text-[10px] font-mono text-center max-w-[280px]">
              PREVIEW MODE // REALTIME RENDER
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
