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

  // Drag State (used for visual feedback only if needed)
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);


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

  // --- KEYBOARD & INPUT HANDLERS ---
  const onAudioClick = () => audioInputRef.current?.click();
  const onAudioKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAudioClick();
    }
  };
  const onAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    if (e.dataTransfer.files?.[0]?.type.startsWith('audio/')) {
      handleAudioSelect(e.dataTransfer.files[0]);
    } else {
      setErrorTarget('audio');
    }
  };

  const onVisualClick = () => imageInputRef.current?.click();
  const onVisualKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onVisualClick();
    }
  };
  const onVisualDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files?.[0]?.type.startsWith('image/')) {
      handleVisualSelect(e.dataTransfer.files[0]);
    } else {
      setErrorTarget('image');
    }
  };

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

      const { tileId, nextIndex, audioUrl, visualUrl, audioKey, visualKey } = await presignRes.json();
      setProgress(20);

      // 2. Upload to R2 (Parallel)
      const uploadAudio = fetch(audioUrl, {
        method: 'PUT',
        body: audioFile,
        headers: {
          'Content-Type': audioFile.type
        }
      });
      const uploadImage = fetch(visualUrl, {
        method: 'PUT',
        body: imageFile,
        headers: {
          'Content-Type': imageFile.type
        }
      });

      const results = await Promise.all([uploadAudio, uploadImage]);
      if (results.some(r => !r.ok)) throw new Error('Failed to upload files to storage');

      setProgress(80);

      // 3. Finalize Metadata in DB
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
      // alert(`UPLOAD ERROR: ${(error as Error).message}`); // Removed alert as per "Subtle Error Handling" request
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

  // Error Utilities
  const getBorderColor = (target: ErrorTarget, current: ErrorTarget) => {
    // Invisible inputs shouldn't have borders unless error
    if (current === target) return 'border-b border-[#cc0000]/50';
    return 'border-none';
  };

  const getShelfBorder = (target: ErrorTarget, current: ErrorTarget) => {
    if (current === target) return 'border-t border-b border-[#cc0000]/50';
    return 'border-t border-b border-[#ECEEDF]/10';
  };

  return (
    <main className="flex-1 w-full min-h-screen bg-[#000000] flex flex-col items-center justify-center p-8 pt-[120px] gap-12">

      {status === STATE.PREVIEW ? (
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

          <div className="flex gap-8 mt-4">
            <button
              onClick={handleCancelPreview}
              className="font-mono text-[#ECEEDF]/50 text-sm tracking-[0.2em] uppercase hover:text-[#ECEEDF] transition-colors border-b border-transparent hover:border-[#ECEEDF]"
            >
              CANCEL
            </button>
            <button
              onClick={handlePostToArchive}
              className="font-mono text-[#ECEEDF] text-xl tracking-[0.2em] uppercase border border-[#ECEEDF]/20 px-8 py-2 hover:bg-[#ECEEDF] hover:text-black transition-all"
            >
              POST TO ARCHIVE
            </button>
          </div>

        </div>
      ) : (
        /* --- INPUT MODE --- */
        <>
          {/* Metadata Inputs (Invisible look) */}
          <div className="w-full max-w-[800px] flex flex-col md:flex-row gap-8">
            <input
              type="text"
              placeholder="ARTIST"
              value={artist}
              onChange={(e) => { setArtist(e.target.value); if (errorTarget === 'artist') setErrorTarget(null); }}
              className={`flex-1 bg-transparent p-2 font-mono text-[#ECEEDF] placeholder-[#ECEEDF]/30 focus:outline-none focus:ring-0 transition-colors uppercase tracking-wider text-center ${getBorderColor('artist', errorTarget)}`}
            />
            <input
              type="text"
              placeholder="TITLE"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (errorTarget === 'title') setErrorTarget(null); }}
              className={`flex-1 bg-transparent p-2 font-mono text-[#ECEEDF] placeholder-[#ECEEDF]/30 focus:outline-none focus:ring-0 transition-colors uppercase tracking-wider text-center ${getBorderColor('title', errorTarget)}`}
            />
          </div>

          {/* File Selection Area (Shelf look) */}
          <div className="w-full max-w-[800px] flex flex-col md:flex-row gap-8 h-[250px]">

            {/* AUDIO BOX */}
            <div
              role="button"
              tabIndex={0}
              onClick={onAudioClick}
              onKeyDown={onAudioKeyDown}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingAudio(true); }}
              onDragLeave={() => setIsDraggingAudio(false)}
              onDrop={onAudioDrop}
              className={`
                flex-1 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group outline-none
                ${getShelfBorder('audio', errorTarget)}
                ${(audioFile || isDraggingAudio) ? 'bg-[#ECEEDF]/5' : 'hover:bg-[#ECEEDF]/5'}
                focus:bg-[#ECEEDF]/5
              `}
            >
              <input
                type="file"
                ref={audioInputRef}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAudioSelect(e.target.files[0])}
                accept="audio/*"
              />
              <div className="z-10 text-center space-y-2 pointer-events-none p-4">
                <span className={`font-mono text-[10px] tracking-[0.2em] uppercase block ${audioFile ? 'text-[#ECEEDF] opacity-100' : 'text-[#ECEEDF] opacity-40'}`}>
                  {audioFile ? 'AUDIO READY' : 'AUDIO'}
                </span>
                {audioFile && (
                  <span className="font-mono text-[#ECEEDF]/70 text-xs tracking-wider uppercase block truncate max-w-[200px]">
                    {audioFile.name}
                  </span>
                )}
              </div>
            </div>

            {/* IMAGE BOX */}
            <div
              role="button"
              tabIndex={0}
              onClick={onVisualClick}
              onKeyDown={onVisualKeyDown}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
              onDragLeave={() => setIsDraggingImage(false)}
              onDrop={onVisualDrop}
              className={`
                flex-1 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group outline-none
                ${getShelfBorder('image', errorTarget)}
                ${(imageFile || isDraggingImage) ? 'bg-[#ECEEDF]/5' : 'hover:bg-[#ECEEDF]/5'}
                focus:bg-[#ECEEDF]/5
              `}
            >
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleVisualSelect(e.target.files[0])}
                accept="image/*"
              />
              <div className="z-10 text-center space-y-2 pointer-events-none p-4">
                <span className={`font-mono text-[10px] tracking-[0.2em] uppercase block ${imageFile ? 'text-[#ECEEDF] opacity-100' : 'text-[#ECEEDF] opacity-40'}`}>
                  {imageFile ? 'VISUAL READY' : 'VISUAL'}
                </span>
                {imageFile && (
                  <span className="font-mono text-[#ECEEDF]/70 text-xs tracking-wider uppercase block truncate max-w-[200px]">
                    {imageFile.name}
                  </span>
                )}
              </div>
              {/* Bg Preview */}
              {previewUrl && (
                <div className="absolute inset-0 -z-10 opacity-20">
                  <Image src={previewUrl} alt="Preview" fill className="object-cover blur-sm" />
                </div>
              )}
            </div>
          </div>

          {/* Action / Status Area */}
          <div className="w-full max-w-[800px] h-[60px] flex items-center justify-center">
            {status === STATE.IDLE || status === STATE.ERROR ? (
              <button
                onClick={handlePreview}
                className={`
                  font-mono text-[#ECEEDF] text-xl tracking-[0.2em] uppercase transition-all duration-300 border px-8 py-2
                  ${(!artist || !title || !audioFile || !imageFile)
                    ? `border-transparent opacity-20 ${(errorTarget === 'generic') ? 'text-[#cc0000]' : ''}`
                    : `border-[#ECEEDF]/20 opacity-100 hover:bg-[#ECEEDF] hover:text-black hover:scale-105`
                  }
                  ${errorTarget === 'generic' ? 'border-[#cc0000]/50 text-[#cc0000]' : ''}
                `}
              >
                {status === STATE.ERROR ? 'RETRY' : 'PREVIEW TILE'}
              </button>
            ) : status === STATE.UPLOADING ? (
              <div className="flex flex-col items-center gap-2">
                <span className="font-mono text-[#ECEEDF] text-sm tracking-wider uppercase animate-pulse">
                  UPLOADING... {progress}%
                </span>
              </div>
            ) : null}
          </div>
        </>
      )}
    </main>
  );
}
