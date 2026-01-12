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

      const results = await Promise.all([uploadAudio, uploadImage]);
      if (results.some(r => !r.ok)) throw new Error('Failed to upload files to storage');

      setProgress(80);

      // 3. Finalize Metadata in DB (ONLY after successful R2 upload)
      const finalizeRes = await finalizeUpload({
        title,
        artist,
        tileIndex: nextIndex,
        tileId,
        audioExt: audioFile.name.split('.').pop() || 'mp3',
        imageExt: imageFile.name.split('.').pop() || 'jpg',
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

  // Helper for shelf styling
  const getShelfStyle = (target: ErrorTarget, current: ErrorTarget) => {
    // 1px Bottom Border (Shelf)
    const isError = current === target;
    return `w-full bg-transparent p-4 font-mono text-[#ECEEDF] uppercase tracking-wider text-center focus:outline-none transition-colors border-b ${isError ? 'border-[#cc0000]/50 placeholder-[#cc0000]/50' : 'border-[#ECEEDF]/10 placeholder-[#ECEEDF]/30 hover:border-[#ECEEDF]/20'
      }`;
  };

  return (
    <main className="flex-1 w-full min-h-screen bg-[#000000] flex flex-col items-center justify-center p-8 pt-[120px] gap-16">

      {status === STATE.PREVIEW || status === STATE.UPLOADING ? (
        /* --- PREVIEW MODE --- */
        <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">

          <h2 className="font-mono text-[#ECEEDF]/50 text-sm tracking-widest uppercase mb-4">
            PREVIEW TILE
          </h2>

          {/* TILE PREVIEW */}
          <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-black border border-[#ECEEDF]/10 group overflow-hidden">

            {/* Image */}
            {previewUrl && (
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover opacity-80"
                />
              </div>
            )}

            {/* Overlay Text */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 z-10 bg-black/20">
              <div className="w-full">
                <span className="font-mono text-[#ECEEDF] text-lg uppercase tracking-wider leading-none drop-shadow-md">
                  {artist}
                </span>
              </div>
              <div className="w-full text-right">
                <span className="font-mono text-[#ECEEDF] text-lg uppercase tracking-wider leading-none drop-shadow-md">
                  {title}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-8 mt-4 items-center">
            <button
              onClick={handleCancelPreview}
              disabled={status === STATE.UPLOADING}
              className={`font-mono text-[#ECEEDF]/50 text-sm tracking-[0.2em] uppercase hover:text-[#ECEEDF] transition-colors border-b border-transparent hover:border-[#ECEEDF] ${status === STATE.UPLOADING ? 'opacity-20 cursor-not-allowed' : ''}`}
            >
              CANCEL
            </button>

            {status === STATE.UPLOADING ? (
              <span className="font-mono text-[#ECEEDF]/60 text-xs tracking-[0.3em] uppercase animate-pulse">
                UPLOADING... {progress}%
              </span>
            ) : (
              <button
                onClick={handlePostToArchive}
                className="font-mono text-[#ECEEDF] text-xl tracking-[0.2em] uppercase border border-[#ECEEDF]/20 px-8 py-2 hover:bg-[#ECEEDF] hover:text-black transition-all"
              >
                POST TO ARCHIVE
              </button>
            )}

          </div>

        </div>
      ) : (
        /* --- INPUT MODE (SHELF AESTHETIC) --- */
        <div className="w-full max-w-[600px] flex flex-col gap-12">

          {/* Metadata Shelves */}
          <div className="flex flex-col gap-8">
            <input
              type="text"
              placeholder="ARTIST"
              value={artist}
              onChange={(e) => { setArtist(e.target.value); if (errorTarget === 'artist') setErrorTarget(null); }}
              className={getShelfStyle('artist', errorTarget)}
            />
            <input
              type="text"
              placeholder="TITLE"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (errorTarget === 'title') setErrorTarget(null); }}
              className={getShelfStyle('title', errorTarget)}
            />
          </div>

          {/* File Shelves */}
          <div className="flex flex-col gap-8">

            {/* AUDIO */}
            <div
              onClick={onAudioClick}
              className={`${getShelfStyle('audio', errorTarget)} cursor-pointer flex justify-between items-center group`}
            >
              <span className="text-[#ECEEDF]/40 text-sm tracking-widest group-hover:text-[#ECEEDF]/60 transition-colors">
                [ AUDIO_SOURCE ]
              </span>
              <span className={`text-xs ${audioFile ? 'text-[#ECEEDF]' : 'text-[#ECEEDF]/20'}`}>
                {audioFile ? audioFile.name : 'SELECT FILE'}
              </span>
              <input
                type="file"
                ref={audioInputRef}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAudioSelect(e.target.files[0])}
                accept="audio/*"
              />
            </div>

            {/* VISUAL */}
            <div
              onClick={onVisualClick}
              className={`${getShelfStyle('image', errorTarget)} cursor-pointer flex justify-between items-center group`}
            >
              <span className="text-[#ECEEDF]/40 text-sm tracking-widest group-hover:text-[#ECEEDF]/60 transition-colors">
                [ VISUAL_SOURCE ]
              </span>
              <span className={`text-xs ${imageFile ? 'text-[#ECEEDF]' : 'text-[#ECEEDF]/20'}`}>
                {imageFile ? imageFile.name : 'SELECT FILE'}
              </span>
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleVisualSelect(e.target.files[0])}
                accept="image/*"
              />
            </div>

          </div>

          {/* Preview Button */}
          <div className="flex justify-center pt-8">
            <button
              onClick={handlePreview}
              className={`
                 font-mono text-[#ECEEDF] text-xl tracking-[0.2em] uppercase transition-all duration-300 px-8 py-2 border border-transparent hover:border-[#ECEEDF]/20
                 ${(!artist || !title || !audioFile || !imageFile)
                  ? `opacity-20 cursor-not-allowed`
                  : `opacity-100 hover:tracking-[0.3em]`
                }
                 ${errorTarget === 'generic' ? 'text-[#cc0000]' : ''}
               `}
            >
              {status === STATE.ERROR ? 'RETRY' : 'PREVIEW TILE'}
            </button>
          </div>

        </div>
      )}
    </main>
  );
}
