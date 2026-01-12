'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadFile } from './actions';
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

export default function UploadPage() {
  const [status, setStatus] = useState<UploadState>(STATE.IDLE);
  const [progress, setProgress] = useState(0);

  // Metadata State
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');

  // File State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Drag State
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // CLEANUP: Revoke object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Helper to rename
  const renameFile = (file: File, newBaseName: string) => {
    const ext = file.name.split('.').pop() || '';
    return new File([file], `${newBaseName}.${ext}`, { type: file.type });
  };

  // --- AUDIO HANDLERS ---
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(renameFile(e.target.files[0], 'audio'));
    }
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setAudioFile(renameFile(file, 'audio'));
      }
    }
  };

  // --- IMAGE HANDLERS ---
  const setVisualFile = (file: File) => {
    const renamed = renameFile(file, 'visual');
    setImageFile(renamed);
    // Create preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(renamed));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVisualFile(e.target.files[0]);
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setVisualFile(file);
      }
    }
  };

  // --- ACTIONS ---
  const handlePreview = () => {
    if (!artist || !title || !audioFile || !imageFile) {
      alert('PLEASE COMPLETE ALL FIELDS');
      return;
    }
    setStatus(STATE.PREVIEW);
  };

  const handleCancelPreview = () => {
    setStatus(STATE.IDLE);
  };

  const handlePostToArchive = async () => {
    if (!audioFile || !imageFile) return;

    setStatus(STATE.UPLOADING);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append('audioFile', audioFile);
      formData.append('imageFile', imageFile);
      formData.append('title', title);
      formData.append('artist', artist);

      // The server action fetches tile_index immediately before upload to prevent race conditions
      const result = await uploadFile(formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setStatus(STATE.SUCCESS);
        setTimeout(() => {
          // Reset all state after success
          setStatus(STATE.IDLE);
          setProgress(0);
          setAudioFile(null);
          setImageFile(null);
          setPreviewUrl(null);
          setTitle('');
          setArtist('');
        }, 3000);
      } else {
        setStatus(STATE.ERROR);
        console.error(result.error);
        alert(`UPLOAD FAILED: ${result.error}`);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setStatus(STATE.ERROR);
      console.error(error);
    }
  };

  if (status === STATE.SUCCESS) {
    return (
      <main className="flex-1 w-full min-h-screen bg-[#000000] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <span className="font-mono text-[#ECEEDF] text-3xl tracking-widest uppercase">
            DEPLOYMENT SUCCESSFUL
          </span>
          <span className="font-mono text-[#ECEEDF]/50 text-sm tracking-wider uppercase">
            TILE ADDED TO ARCHIVE
          </span>
        </div>
      </main>
    );
  }

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
              {/* Top: Artist */}
              <div className="w-full">
                <span className="font-mono text-[#ECEEDF] text-lg uppercase tracking-wider leading-none drop-shadow-md">
                  {artist}
                </span>
              </div>

              {/* Bottom: Title */}
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
          {/* 1. Metadata Inputs */}
          <div className="w-full max-w-[800px] flex flex-col md:flex-row gap-8">
            <input
              type="text"
              placeholder="ARTIST"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="flex-1 bg-transparent border-b border-[#ECEEDF]/40 p-2 font-mono text-[#ECEEDF] placeholder-[#ECEEDF]/40 focus:outline-none focus:border-[#ECEEDF] transition-colors uppercase tracking-wider text-center md:text-left"
            />
            <input
              type="text"
              placeholder="TITLE"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-transparent border-b border-[#ECEEDF]/40 p-2 font-mono text-[#ECEEDF] placeholder-[#ECEEDF]/40 focus:outline-none focus:border-[#ECEEDF] transition-colors uppercase tracking-wider text-center md:text-left"
            />
          </div>

          {/* 2. File Selection Area (Split View) */}
          <div className="w-full max-w-[800px] flex flex-col md:flex-row gap-8 h-[250px]">

            {/* AUDIO BOX */}
            <div
              onClick={() => audioInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingAudio(true); }}
              onDragLeave={() => setIsDraggingAudio(false)}
              onDrop={handleAudioDrop}
              className={`
                flex-1 border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group
                ${(audioFile || isDraggingAudio) ? 'border-[#ECEEDF]/40 bg-[#ECEEDF]/5' : 'border-[#ECEEDF]/10 hover:border-[#ECEEDF]/20'}
              `}
            >
              <input
                type="file"
                ref={audioInputRef}
                className="hidden"
                onChange={handleAudioSelect}
                accept="audio/*"
              />
              <div className="z-10 text-center space-y-2 pointer-events-none p-4">
                <span className={`font-mono text-lg tracking-widest uppercase block ${audioFile ? 'text-[#ECEEDF] opacity-100' : 'text-[#ECEEDF]/50'}`}>
                  {audioFile ? '[AUDIO SELECTED]' : '[SELECT AUDIO]'}
                </span>
                {audioFile && (
                  <span className="font-mono text-[#ECEEDF]/70 text-xs tracking-wider uppercase block truncate max-w-[200px]">
                    {audioFile.name}
                  </span>
                )}
                {status === STATE.UPLOADING && (
                  <span className="font-mono text-[#ECEEDF] text-xs tracking-widest block mt-2">
                    {progress}%
                  </span>
                )}
              </div>
            </div>

            {/* IMAGE BOX */}
            <div
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
              onDragLeave={() => setIsDraggingImage(false)}
              onDrop={handleImageDrop}
              className={`
                flex-1 border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group
                ${(imageFile || isDraggingImage) ? 'border-[#ECEEDF]/40 bg-[#ECEEDF]/5' : 'border-[#ECEEDF]/10 hover:border-[#ECEEDF]/20'}
              `}
            >
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                onChange={handleImageSelect}
                accept="image/*"
              />
              <div className="z-10 text-center space-y-2 pointer-events-none p-4">
                <span className={`font-mono text-lg tracking-widest uppercase block ${imageFile ? 'text-[#ECEEDF] opacity-100' : 'text-[#ECEEDF]/50'}`}>
                  {imageFile ? '[VISUAL SELECTED]' : '[SELECT VISUAL]'}
                </span>
                {imageFile && (
                  <span className="font-mono text-[#ECEEDF]/70 text-xs tracking-wider uppercase block truncate max-w-[200px]">
                    {imageFile.name}
                  </span>
                )}
                {status === STATE.UPLOADING && (
                  <span className="font-mono text-[#ECEEDF] text-xs tracking-widest block mt-2">
                    {progress}%
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

          {/* 3. Action / Status Area */}
          <div className="w-full max-w-[800px] h-[60px] flex items-center justify-center">
            {status === STATE.IDLE || status === STATE.ERROR ? (
              <button
                onClick={handlePreview}
                disabled={!artist || !title || !audioFile || !imageFile}
                className={`
                  font-mono text-[#ECEEDF] text-xl tracking-[0.2em] uppercase transition-all duration-300 border px-8 py-2
                  ${(!artist || !title || !audioFile || !imageFile)
                    ? 'border-transparent opacity-20 cursor-not-allowed'
                    : 'border-[#ECEEDF]/20 opacity-100 hover:bg-[#ECEEDF] hover:text-black hover:scale-105'
                  }
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
