'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { verifyLogin, deleteTile, updateTile } from './actions';
import ArchiveGrid from '../../components/ArchiveGrid';
import { Track } from '../../types';

export default function GodModePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    if (isAuthenticated) {
      const fetchTracks = async () => {
        const { data } = await supabase
          .from('tracks')
          .select('*')
          .order('tile_index', { ascending: true });

        if (data) {
          setTracks(data as Track[]);
        }
        setLoading(false);
      };

      fetchTracks();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await verifyLogin(username, password);
    if (result.success) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError(result.error || 'Login failed');
    }
  };

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

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-sm p-8 border border-white/10 rounded-lg bg-white/[0.02]">
          <h1 className="text-[#ECEEDF] font-mono tracking-widest text-center mb-4 uppercase text-sm">
            [ SYSTEM ADMIN ]
          </h1>

          <input
            type="text"
            placeholder="USER_ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-transparent border border-white/20 rounded px-4 py-2 font-mono text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
          />
          <input
            type="password"
            placeholder="ACCESS_KEY"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent border border-white/20 rounded px-4 py-2 font-mono text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
          />

          {error && (
            <div className="text-red-500 font-mono text-xs text-center">
              {error.toUpperCase()}
            </div>
          )}

          <button
            type="submit"
            className="mt-4 bg-[#ECEEDF]/10 hover:bg-[#ECEEDF]/20 text-[#ECEEDF] font-mono py-2 rounded uppercase tracking-widest text-xs transition-colors"
          >
            Authenticate
          </button>
        </form>
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
