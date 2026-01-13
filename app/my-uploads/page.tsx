'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { deleteMyTrack, updateMyTrack } from './actions';
import ArchiveGrid from '@/components/ArchiveGrid';
import { Track } from '@/types';
import { useRouter } from 'next/navigation';

export default function MyUploadsPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Edit State
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editForm, setEditForm] = useState({
    artist: '',
    title: '',
    genre: '',
    release_date: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      fetchMyTracks(user.id);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const term = search.toLowerCase();
    setFilteredTracks(
      tracks.filter(t =>
        t.artist?.toLowerCase().includes(term) ||
        t.title?.toLowerCase().includes(term) ||
        t.genre?.toLowerCase().includes(term)
      )
    );
  }, [search, tracks]);

  const fetchMyTracks = async (uid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('tracks')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (data) {
      setTracks(data as Track[]);
    }
    setLoading(false);
  };

  const handleDelete = async (tileId: string, index: number, audioExt: string, imageExt: string) => {
    if (!confirm("Permanently delete this transmission from your archive?")) return;

    const res = await deleteMyTrack(tileId, audioExt, imageExt);
    if (res.success) {
      setTracks(prev => prev.filter(t => t.tile_id !== tileId));
    } else {
      alert(`Failed to delete: ${res.error}`);
    }
  };

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setEditForm({
      artist: track.artist || '',
      title: track.title || '',
      genre: track.genre || '',
      release_date: track.release_date || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTrack) return;
    setUpdating(true);

    const res = await updateMyTrack(editingTrack.tile_id, {
      artist: editForm.artist,
      title: editForm.title,
      genre: editForm.genre,
      release_date: editForm.release_date,
    });

    if (res.success) {
      setTracks(prev => prev.map(t =>
        t.tile_id === editingTrack.tile_id
          ? { ...t, ...editForm }
          : t
      ));
      setEditingTrack(null);
    } else {
      alert(`Failed to update: ${res.error}`);
    }
    setUpdating(false);
  };

  if (loading) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-[#ECEEDF] font-mono text-xs animate-pulse p-8 uppercase tracking-widest">
        RETRIEVING_USER_ARCHIVE...
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-black flex flex-col pt-24 px-4 md:px-8 pb-32">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-end border-b border-[#ECEEDF]/10 pb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-[#ECEEDF] font-mono text-3xl tracking-[0.3em] uppercase italic">MY_TRANSMISSIONS</h1>
            <p className="text-[#ECEEDF]/40 font-mono text-[10px] uppercase tracking-widest">
              PERSONAL_DATABANK // {tracks.length} TILES_LOCALIZED
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="SEARCH_PERSONAL_ARCHIVE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border-b border-[#ECEEDF]/20 text-[#ECEEDF] px-0 py-2 font-mono text-xs focus:outline-none focus:border-[#ECEEDF] placeholder-[#ECEEDF]/20 transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-8 border border-dashed border-[#ECEEDF]/10 rounded-sm">
            <div className="flex flex-col gap-2 text-center">
              <span className="font-mono text-[#ECEEDF]/40 text-xs uppercase tracking-widest">NO_DATA_RECOVERED</span>
              <p className="font-mono text-[#ECEEDF]/20 text-[10px] uppercase tracking-widest">YOU HAVE NOT CONTRIBUTED TO THE ARCHIVE YET</p>
            </div>
            <button
              onClick={() => router.push('/upload')}
              className="px-8 py-3 bg-[#ECEEDF] text-black font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-colors"
            >
              [ INITIALIZE_UPLOAD ]
            </button>
          </div>
        ) : (
          <ArchiveGrid
            tracks={filteredTracks}
            isAdmin={true} // Enabling Edit/Delete for own tiles
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </div>

      {/* EDIT MODAL */}
      {editingTrack && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !updating && setEditingTrack(null)}>
          <div className="bg-[#0A0A0A] border border-[#ECEEDF]/10 p-8 rounded-sm w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-[#ECEEDF] font-mono uppercase tracking-[0.2em] mb-8 border-b border-[#ECEEDF]/10 pb-4 text-xl">
              EDIT_TRANSMISSION
            </h2>

            <div className="flex flex-col gap-6">
              <div>
                <label className="text-[9px] font-mono text-[#ECEEDF]/50 uppercase mb-2 block tracking-widest">Artist Name</label>
                <input
                  type="text"
                  value={editForm.artist}
                  onChange={e => setEditForm(prev => ({ ...prev, artist: e.target.value }))}
                  className="w-full bg-black border border-[#ECEEDF]/10 rounded-sm px-4 py-3 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF]/40 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-[#ECEEDF]/50 uppercase mb-2 block tracking-widest">Track Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-black border border-[#ECEEDF]/10 rounded-sm px-4 py-3 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF]/40 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono text-[#ECEEDF]/50 uppercase mb-2 block tracking-widest">Genre</label>
                  <input
                    type="text"
                    value={editForm.genre}
                    onChange={e => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full bg-black border border-[#ECEEDF]/10 rounded-sm px-4 py-3 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF]/40 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-[#ECEEDF]/50 uppercase mb-2 block tracking-widest">Release Date</label>
                  <input
                    type="text"
                    value={editForm.release_date}
                    onChange={e => setEditForm(prev => ({ ...prev, release_date: e.target.value }))}
                    className="w-full bg-black border border-[#ECEEDF]/10 rounded-sm px-4 py-3 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF]/40 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-[#ECEEDF]/2 border border-[#ECEEDF]/5 text-[9px] font-mono text-[#ECEEDF]/30 uppercase leading-relaxed">
                NOTE: METADATA UPDATES WILL BE REFLECTED INSTANTLY ACROSS THE GLOBAL ARCHIVE.
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-[#ECEEDF]/10">
              <button
                disabled={updating}
                onClick={() => setEditingTrack(null)}
                className="flex-1 py-3 font-mono text-[10px] tracking-[0.3em] uppercase border border-[#ECEEDF]/10 text-[#ECEEDF]/40 hover:border-[#ECEEDF]/40 hover:text-[#ECEEDF] transition-all disabled:opacity-20"
              >
                CANCEL
              </button>
              <button
                disabled={updating}
                onClick={handleSaveEdit}
                className="flex-1 py-3 font-mono text-[10px] tracking-[0.3em] uppercase bg-[#ECEEDF] text-black hover:bg-white transition-all disabled:opacity-50"
              >
                {updating ? 'SYNCING...' : 'SAVE_CHANGES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
