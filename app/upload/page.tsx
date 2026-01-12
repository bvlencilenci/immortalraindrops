'use client';

import { useState, useRef } from 'react';
import { uploadFile } from './actions';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  // Metadata State
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!artist.trim() || !title.trim()) {
      alert('PLEASE ENTER ARTIST AND TITLE');
      return;
    }

    setStatus('uploading');
    setFileName(file.name);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('artist', artist);

      const result = await uploadFile(formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          setProgress(0);
          setFileName(null);
          setTitle('');
          setArtist('');
        }, 3000);
      } else {
        setStatus('error');
        console.error(result.error);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setStatus('error');
      console.error(error);
    }
  };

  return (
    <main className="flex-1 w-full min-h-screen bg-[#000000] flex flex-col items-center justify-center p-8 pt-[120px]">

      {/* Metadata Inputs */}
      <div className="w-full max-w-[800px] mb-8 flex flex-col md:flex-row gap-8">
        <input
          type="text"
          placeholder="ARTIST"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="flex-1 bg-transparent border-b border-[#ECEEDF]/20 p-2 font-mono text-[#ECEEDF] placeholder-[#ECEEDF]/30 focus:outline-none focus:border-[#ECEEDF] transition-colors uppercase tracking-wider text-center md:text-left"
        />
        <input
          type="text"
          placeholder="TITLE"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-transparent border-b border-[#ECEEDF]/20 p-2 font-mono text-[#ECEEDF] placeholder-[#ECEEDF]/30 focus:outline-none focus:border-[#ECEEDF] transition-colors uppercase tracking-wider text-center md:text-left"
        />
      </div>

      {/* Upload Container */}
      <div
        className={`
          w-full max-w-[800px] h-[400px] 
          border-2 border-dashed 
          flex flex-col items-center justify-center 
          transition-all duration-300 relative overflow-hidden
          ${isDragging
            ? 'border-[#ECEEDF] bg-[#ECEEDF]/5'
            : 'border-[#ECEEDF]/20 hover:border-[#ECEEDF]/40'
          }
          ${(!artist || !title) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (artist && title) {
            fileInputRef.current?.click();
          } else {
            alert('PLEASE ENTER ARTIST AND TITLE FIRST');
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="audio/*"
        />

        {/* Content */}
        <div className="z-10 text-center space-y-4 pointer-events-none">
          {status === 'idle' && (
            <h1 className="font-mono text-[#ECEEDF] text-xl md:text-2xl tracking-widest uppercase opacity-80">
              Click or Drag Tracks
            </h1>
          )}

          {status === 'uploading' && (
            <div className="flex flex-col items-center gap-4 w-full px-12">
              <span className="font-mono text-[#ECEEDF] text-sm tracking-wider uppercase animate-pulse">
                Uploading: {fileName}
              </span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-[#ECEEDF] text-3xl tracking-widest uppercase">
                SUCCESS
              </span>
              <span className="font-mono text-[#ECEEDF]/50 text-xs tracking-widest uppercase">
                {fileName}
              </span>
            </div>
          )}

          {status === 'error' && (
            <span className="font-mono text-red-500 text-xl tracking-widest uppercase">
              UPLOAD FAILED
            </span>
          )}
        </div>

        {/* Progress Bar (Bottom) */}
        {status === 'uploading' && (
          <div className="absolute bottom-0 left-0 h-[1px] bg-[#ECEEDF] transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        )}

        {/* Background Fill on Success */}
        {status === 'success' && (
          <div className="absolute inset-0 bg-[#ECEEDF]/5 animate-pulse pointer-events-none" />
        )}

      </div>

    </main>
  );
}
