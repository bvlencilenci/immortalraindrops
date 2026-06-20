'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [artistName, setArtistName] = useState('');
  const [title, setTitle] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile) {
      setError('Primary media file is required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const mediaExt = mediaFile.name.split('.').pop();
      const imageExt = imageFile ? imageFile.name.split('.').pop() : null;

      // 1. Get Presigned URLs and DB row
      const res = await fetch('/api/submissions/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          artist_name: artistName,
          title,
          mediaExt,
          mediaType: mediaFile.type,
          imageExt,
          imageType: imageFile?.type || null
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to initialize submission');
      }
      const data = await res.json();

      // 2. Upload files
      if (data.mediaUrl) {
        await fetch(data.mediaUrl, {
          method: 'PUT',
          headers: { 'Content-Type': mediaFile.type },
          body: mediaFile
        });
      }
      if (data.imageUrl && imageFile) {
        await fetch(data.imageUrl, {
          method: 'PUT',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile
        });
      }

      // 3. Redirect to status
      router.push(`/status/${data.status_token}`);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4 pt-[15vh]">
      <div className="w-full max-w-md bg-black/50 border border-[#ECEEDF]/20 p-8">
        <h1 className="text-2xl font-mono text-[#ECEEDF] uppercase tracking-widest mb-6 text-center">
          SUBMIT_TRANSMISSION
        </h1>
        {error && <div className="text-red-500 font-mono text-xs p-3 border border-red-500/50 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-mono">
          <input type="email" placeholder="EMAIL" required value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent border-b border-[#ECEEDF]/30 text-[#ECEEDF] p-2 focus:outline-none focus:border-[#ECEEDF]" />
          <input type="text" placeholder="ARTIST NAME" required value={artistName} onChange={e => setArtistName(e.target.value)} className="bg-transparent border-b border-[#ECEEDF]/30 text-[#ECEEDF] p-2 focus:outline-none focus:border-[#ECEEDF]" />
          <input type="text" placeholder="TRACK/VIDEO TITLE" required value={title} onChange={e => setTitle(e.target.value)} className="bg-transparent border-b border-[#ECEEDF]/30 text-[#ECEEDF] p-2 focus:outline-none focus:border-[#ECEEDF]" />
          
          <div className="flex flex-col gap-2">
            <label className="text-[#ECEEDF]/50 text-xs tracking-widest uppercase">AUDIO OR VIDEO FILE *</label>
            <input type="file" accept="audio/*,video/*" required onChange={e => setMediaFile(e.target.files?.[0] || null)} className="text-[#ECEEDF] text-xs" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#ECEEDF]/50 text-xs tracking-widest uppercase">COVER ART (OPTIONAL)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="text-[#ECEEDF] text-xs" />
          </div>

          <button type="submit" disabled={loading} className="mt-4 bg-[#ECEEDF] text-black font-bold p-3 uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-colors">
            {loading ? 'UPLOADING...' : 'SUBMIT'}
          </button>
        </form>
      </div>
    </main>
  );
}
