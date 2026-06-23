'use client';

import { useState, useEffect } from 'react';
import { getArchiveTracks, deleteTrackFromArchive } from '@/app/godmode/actions';

export default function ArchiveManager() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchTracks(); }, []);

  const fetchTracks = async () => {
    setLoading(true);
    const res = await getArchiveTracks();
    if (res.success) setTracks(res.tracks);
    setLoading(false);
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" from the archive? This cannot be undone.`)) return;
    setBusy(id);
    const res = await deleteTrackFromArchive(id);
    setBusy(null);
    if (res.success) {
      setTracks(prev => prev.filter(t => t.id !== id));
      showToast(`DELETED: ${title}`, true);
    } else {
      showToast(`ERROR: ${res.error}`, false);
    }
  };

  const filtered = tracks.filter(t =>
    search === '' ||
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.artist?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="text-[#ECEEDF] p-8 font-mono tracking-widest text-xs animate-pulse">
      LOADING_ARCHIVE...
    </div>
  );

  return (
    <div className="flex flex-col gap-6 font-mono text-[#ECEEDF]">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 font-mono text-[10px] uppercase tracking-[0.3em] px-6 py-3 border ${
          toast.ok
            ? 'bg-[#ECEEDF] text-black border-[#ECEEDF]'
            : 'bg-red-600 text-white border-red-400/50'
        } shadow-lg`}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#ECEEDF]/5 p-4 border border-[#ECEEDF]/10">
        <div className="text-[#ECEEDF]/40 text-[10px] uppercase tracking-widest">
          {tracks.length} TRACKS IN ARCHIVE
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="SEARCH..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-black/40 border border-[#ECEEDF]/20 px-3 py-1.5 text-[11px] text-[#ECEEDF] font-mono focus:outline-none focus:border-[#ECEEDF] w-48"
          />
          <button
            onClick={fetchTracks}
            className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 hover:text-[#ECEEDF] border border-[#ECEEDF]/10 hover:border-[#ECEEDF]/40 px-3 py-1.5 transition-colors"
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* Track List */}
      <div className="border border-[#ECEEDF]/10 bg-black/40">
        {filtered.length === 0 ? (
          <div className="text-[#ECEEDF]/30 text-xs p-8 text-center uppercase tracking-widest">
            {search ? 'NO MATCHES FOUND.' : 'ARCHIVE IS EMPTY.'}
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Column Headers */}
            <div className="grid grid-cols-[1fr_1fr_80px_80px_40px] gap-4 px-4 py-2 border-b border-[#ECEEDF]/10 text-[8px] uppercase tracking-widest text-[#ECEEDF]/30">
              <span>TITLE</span>
              <span>ARTIST</span>
              <span>TYPE</span>
              <span>ADDED</span>
              <span></span>
            </div>

            {filtered.map((track, idx) => (
              <div
                key={track.id}
                className={`grid grid-cols-[1fr_1fr_80px_80px_40px] gap-4 px-4 py-3 items-center text-[10px] border-b border-[#ECEEDF]/5 hover:bg-[#ECEEDF]/5 transition-colors ${
                  idx % 2 === 0 ? 'bg-black/20' : ''
                }`}
              >
                <span className="truncate font-bold text-[#ECEEDF]">{track.title}</span>
                <span className="truncate text-[#ECEEDF]/60">{track.artist}</span>
                <span className="text-[8px] uppercase tracking-widest text-[#ECEEDF]/40">
                  {track.media_type || 'song'}
                </span>
                <span className="text-[8px] text-[#ECEEDF]/30 font-mono">
                  {track.created_at ? new Date(track.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) : '—'}
                </span>
                <button
                  onClick={() => handleDelete(track.id, track.title)}
                  disabled={busy === track.id}
                  className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/40 w-8 h-8 flex items-center justify-center transition-all disabled:opacity-30 text-[11px]"
                  title="Delete from archive"
                >
                  {busy === track.id ? '…' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
