'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { deleteTile, updateTile } from './actions';
import ArchiveGrid from '../../components/ArchiveGrid';
import { Track } from '../../types';
import { useRouter } from 'next/navigation';

export default function GodModePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editForm, setEditForm] = useState({
    artist: '',
    title: '',
    genre: '',
    release_date: '',
  });

  // Load tracks when authenticated
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAuthenticated(true);
        // Fetch Tracks
        const { data } = await supabase
          .from('tracks')
          .select('*')
          .order('tile_index', { ascending: true });

        if (data) {
          setTracks(data as Track[]);
        }
        setLoading(false);
      } else {
        setError('ACCESS DENIED: ADMIN ROLE REQUIRED');
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  const handleDelete = async (tileId: string, index: number, audioExt: string, imageExt: string) => {
    const res = await deleteTile(tileId, index, audioExt, imageExt);
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

    const res = await updateTile(editingTrack.tile_id, {
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
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-[#ECEEDF] font-mono animate-pulse tracking-widest uppercase text-xs">
          SYSTEM_CHECK...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-red-500 font-mono tracking-widest uppercase text-xs border border-red-900/50 p-4 bg-red-900/10">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex flex-col pt-32 px-4 md:px-12 pb-12">
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <h1 className="text-[#ECEEDF] font-mono tracking-[0.2em] uppercase text-xl">
          [ ADMIN_GRID ]
        </h1>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="text-[#ECEEDF]/50 hover:text-[#ECEEDF] font-mono text-xs uppercase"
        >
          LOGOUT
        </button>
      </div>

      {loading ? (
        <div className="text-[#ECEEDF] font-mono animate-pulse">LOADING_ASSETS...</div>
      ) : (
        <ArchiveGrid
          tracks={tracks}
          isAdmin={true}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}

      {/* EDIT MODAL */}
      {editingTrack && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingTrack(null)}>
          <div className="bg-neutral-900 border border-white/10 p-8 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-[#ECEEDF] font-mono uppercase tracking-widest mb-6 border-b border-white/10 pb-2">
              EDIT TILE: {editingTrack.tile_id}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-mono text-[#ECEEDF]/50 uppercase mb-1 block">Artist Name</label>
                <input
                  type="text"
                  value={editForm.artist}
                  onChange={e => setEditForm(prev => ({ ...prev, artist: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#ECEEDF]/50 uppercase mb-1 block">Track Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#ECEEDF]/50 uppercase mb-1 block">Genre</label>
                <input
                  type="text"
                  value={editForm.genre}
                  onChange={e => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#ECEEDF]/50 uppercase mb-1 block">Release Date</label>
                <input
                  type="text"
                  value={editForm.release_date}
                  onChange={e => setEditForm(prev => ({ ...prev, release_date: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF] outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setEditingTrack(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-[#ECEEDF] font-mono text-xs uppercase py-3 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-[#ECEEDF] hover:bg-white text-black font-mono text-xs uppercase py-3 rounded transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
