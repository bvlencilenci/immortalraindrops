import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { deleteTile, updateTile, finalizeAssetUpdate } from '@/app/godmode/actions';
import ArchiveGrid from '@/components/ArchiveGrid';
import { Track } from '@/types';

export default function TrackList() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit State
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editForm, setEditForm] = useState({
    artist: '',
    title: '',
    genre: '',
    release_date: '',
  });

  // Asset Replacement State
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [uploadingAssets, setUploadingAssets] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

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

  const fetchTracks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tracks')
      .select('*')
      .order('tile_index', { ascending: true });

    if (data) {
      setTracks(data as Track[]);
    }
    setLoading(false);
  };

  const handleDelete = async (tileId: string, index: number, audioExt: string, imageExt: string) => {
    if (!confirm("Are you sure you want to delete this transmission?")) return;

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
    setNewAudioFile(null);
    setNewImageFile(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTrack) return;

    try {
      setUploadingAssets(true);
      setUploadProgress(10);

      const assetUpdates: { audio_url?: string; visual_url?: string } = {};

      // 1. Handle Asset Uploads if any
      if (newAudioFile || newImageFile) {
        const signRes = await fetch('/api/godmode/sign-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tileId: editingTrack.tile_id,
            audioExt: newAudioFile?.name.split('.').pop(),
            imageExt: newImageFile?.name.split('.').pop(),
            audioType: newAudioFile?.type,
            imageType: newImageFile?.type,
          }),
        });

        if (!signRes.ok) throw new Error('Failed to get sign authority');
        const { audioUrl, visualUrl, audioKey, visualKey } = await signRes.json();

        setUploadProgress(30);

        const uploads = [];
        if (newAudioFile && audioUrl) {
          uploads.push(fetch(audioUrl, { method: 'PUT', body: newAudioFile, headers: { 'Content-Type': newAudioFile.type } }));
          assetUpdates.audio_url = audioKey;
        }
        if (newImageFile && visualUrl) {
          uploads.push(fetch(visualUrl, { method: 'PUT', body: newImageFile, headers: { 'Content-Type': newImageFile.type } }));
          assetUpdates.visual_url = visualKey;
        }

        const results = await Promise.all(uploads);
        if (results.some(r => !r.ok)) throw new Error('File upload to R2 failed');

        setUploadProgress(70);

        // Finalize asset paths in DB
        const finalizeRes = await finalizeAssetUpdate(editingTrack.tile_id, assetUpdates);
        if (!finalizeRes.success) throw new Error(finalizeRes.error);
      }

      setUploadProgress(90);

      // 2. Update Metadata
      const res = await updateTile(editingTrack.tile_id, {
        artist: editForm.artist,
        title: editForm.title,
        genre: editForm.genre,
        release_date: editForm.release_date,
      });

      if (res.success) {
        setTracks(prev => prev.map(t =>
          t.tile_id === editingTrack.tile_id
            ? { ...t, ...editForm, ...assetUpdates }
            : t
        ));
        setEditingTrack(null);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      alert(`Failed to update: ${err.message}`);
    } finally {
      setUploadingAssets(false);
      setUploadProgress(0);
    }
  };

  if (loading) return <div className="text-[#ECEEDF] font-mono text-xs animate-pulse p-8">RETRIEVING_ASSETS...</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#ECEEDF]/5 p-4 border border-[#ECEEDF]/10 rounded-sm">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="SEARCH TRACKS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border-b border-[#ECEEDF]/20 text-[#ECEEDF] px-0 py-2 font-mono text-xs focus:outline-none focus:border-[#ECEEDF] placeholder-[#ECEEDF]/20"
          />
        </div>
        <div className="text-[#ECEEDF]/40 font-mono text-[10px] uppercase tracking-widest">
          {filteredTracks.length} TILES_LOCALIZED
        </div>
      </div>

      <ArchiveGrid
        tracks={filteredTracks}
        isAdmin={true}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* EDIT MODAL */}
      {editingTrack && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !uploadingAssets && setEditingTrack(null)}>
          <div className="bg-[#0A0A0A] border border-[#ECEEDF]/10 p-8 rounded-sm w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-[#ECEEDF] font-mono uppercase tracking-[0.2em] mb-8 border-b border-[#ECEEDF]/10 pb-4 text-xl">
              EDIT TILE: {editingTrack.tile_id}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: Metadata */}
              <div className="flex flex-col gap-5">
                <span className="text-[10px] font-mono text-[#ECEEDF]/30 uppercase tracking-[0.3em]">METADATA</span>

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

                <div>
                  <label className="text-[9px] font-mono text-[#ECEEDF]/50 uppercase mb-2 block tracking-widest">Genre</label>
                  <input
                    type="text"
                    value={editForm.genre}
                    onChange={e => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full bg-black border border-[#ECEEDF]/10 rounded-sm px-4 py-3 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF]/40 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Right Side: Assets */}
              <div className="flex flex-col gap-5 border-l border-[#ECEEDF]/5 pl-0 md:pl-8">
                <span className="text-[10px] font-mono text-[#ECEEDF]/30 uppercase tracking-[0.3em]">ASSETS</span>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[9px] font-mono text-[#ECEEDF]/50 uppercase mb-2 block tracking-widest">Audio Source</label>
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className={`w-full py-4 font-mono text-[10px] uppercase tracking-widest border transition-all ${newAudioFile ? 'border-[#ECEEDF] bg-[#ECEEDF]/10 text-[#ECEEDF]' : 'border-[#ECEEDF]/10 text-[#ECEEDF]/40 hover:border-[#ECEEDF]/30'}`}
                    >
                      {newAudioFile ? newAudioFile.name : '[ REPLACE AUDIO ]'}
                    </button>
                    <input type="file" ref={audioInputRef} className="hidden" onChange={e => e.target.files?.[0] && setNewAudioFile(e.target.files[0])} accept="audio/*" />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-[#ECEEDF]/50 uppercase mb-2 block tracking-widest">Visual Source</label>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className={`w-full py-4 font-mono text-[10px] uppercase tracking-widest border transition-all ${newImageFile ? 'border-[#ECEEDF] bg-[#ECEEDF]/10 text-[#ECEEDF]' : 'border-[#ECEEDF]/10 text-[#ECEEDF]/40 hover:border-[#ECEEDF]/30'}`}
                    >
                      {newImageFile ? newImageFile.name : '[ REPLACE VISUAL ]'}
                    </button>
                    <input type="file" ref={imageInputRef} className="hidden" onChange={e => e.target.files?.[0] && setNewImageFile(e.target.files[0])} accept="image/*" />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-[#ECEEDF]/2 border border-[#ECEEDF]/5 text-[9px] font-mono text-[#ECEEDF]/30 uppercase leading-relaxed">
                  NOTE: REPLACING ASSETS WILL PERMANENTLY OVERWRITE EXISTING FILES IN THE CLOUD BUFFER.
                </div>
              </div>
            </div>

            {uploadingAssets && (
              <div className="mt-8">
                <div className="w-full h-1 bg-white/5 overflow-hidden">
                  <div className="h-full bg-[#ECEEDF] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="text-[9px] font-mono text-[#ECEEDF]/50 uppercase tracking-widest mt-2">
                  UPLOADING_ASSETS: {uploadProgress}%
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-12 pt-8 border-t border-[#ECEEDF]/10">
              <button
                disabled={uploadingAssets}
                onClick={() => setEditingTrack(null)}
                className="flex-1 py-4 font-mono text-[10px] tracking-[0.3em] uppercase border border-[#ECEEDF]/10 text-[#ECEEDF]/40 hover:border-[#ECEEDF]/40 hover:text-[#ECEEDF] transition-all disabled:opacity-20"
              >
                CANCEL
              </button>
              <button
                disabled={uploadingAssets}
                onClick={handleSaveEdit}
                className="flex-1 py-4 font-mono text-[10px] tracking-[0.3em] uppercase bg-[#ECEEDF] text-black hover:bg-white transition-all disabled:opacity-50"
              >
                {uploadingAssets ? 'SYNCING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
