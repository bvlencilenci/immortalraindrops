'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { updateSubmissionStatus, approveToArchive, approveToPlaylist } from '@/app/godmode/actions';

const R2 = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art';

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] font-mono text-[11px] uppercase tracking-[0.25em] px-8 py-4 shadow-2xl border transition-all ${
      ok
        ? 'bg-[#ECEEDF] text-black border-[#ECEEDF]'
        : 'bg-red-600/90 text-white border-red-400/50 backdrop-blur-sm'
    }`}>
      {ok ? '✓ ' : '✗ '}{msg}
    </div>
  );
}

export default function SubmissionReview() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { fetchSubmissions(); }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (data) setSubmissions(data);
    setLoading(false);
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleReject = async (id: string, currentNotes: string) => {
    const notes = prompt('Rejection notes (optional):', currentNotes || '') ?? currentNotes;
    setBusy(id + ':reject');
    const res = await updateSubmissionStatus(id, 'rejected', notes);
    setBusy(null);
    if (res.success) {
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected', admin_notes: notes } : s));
      showToast('Submission rejected', true);
    } else {
      showToast(res.error || 'Failed to reject', false);
    }
  };

  const handleArchive = async (id: string) => {
    setBusy(id + ':archive');
    const res = await approveToArchive(id);
    setBusy(null);
    if (res.success) {
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
      showToast('Added to Archive', true);
    } else {
      showToast(res.error || 'Failed', false);
    }
  };

  const handlePlaylist = async (id: string) => {
    setBusy(id + ':playlist');
    const res = await approveToPlaylist(id);
    setBusy(null);
    if (res.success) {
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
      showToast('Added to Radio Playlist', true);
    } else {
      showToast(res.error || 'Failed', false);
    }
  };

  if (loading) return (
    <div className="text-[#ECEEDF]/40 p-12 font-mono tracking-[0.3em] text-xs animate-pulse uppercase">
      Loading submissions...
    </div>
  );

  const pending = submissions.filter(s => s.status === 'pending');
  const reviewed = submissions.filter(s => s.status !== 'pending');

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Header row */}
      <div className="flex items-center justify-between border-b border-[#ECEEDF]/10 pb-4">
        <div>
          <span className="text-[#ECEEDF]/30 font-mono text-[10px] uppercase tracking-[0.3em]">
            {pending.length} pending · {reviewed.length} reviewed
          </span>
        </div>
        <button
          onClick={fetchSubmissions}
          className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#ECEEDF]/30 hover:text-[#ECEEDF] border border-[#ECEEDF]/10 hover:border-[#ECEEDF]/30 px-4 py-2 transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Pending */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#ECEEDF]/40">
          Pending Review ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div className="border border-[#ECEEDF]/5 p-10 text-center">
            <p className="font-mono text-sm text-[#ECEEDF]/20 uppercase tracking-[0.3em]">Queue empty</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map(sub => (
              <div
                key={sub.id}
                className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/[0.02] hover:bg-[#ECEEDF]/[0.04] transition-colors p-5 md:p-6"
              >
                {/* Track identity */}
                <div className="flex justify-between items-start gap-4 mb-5">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <h3 className="font-mono text-base md:text-lg font-bold text-[#ECEEDF] tracking-tight truncate">
                      {sub.title}
                    </h3>
                    <p className="font-mono text-sm text-[#ECEEDF]/60 tracking-wide truncate">
                      {sub.artist_name}
                    </p>
                    <p className="font-mono text-[10px] text-[#ECEEDF]/25 uppercase tracking-[0.2em] mt-1">
                      {sub.email}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] px-2.5 py-1 border border-yellow-500/40 text-yellow-400/80 bg-yellow-500/5">
                    pending
                  </span>
                </div>

                {/* File review links */}
                {(sub.audio_url || sub.video_url || sub.image_url) && (
                  <div className="flex gap-5 mb-5 font-mono text-[10px] uppercase tracking-[0.2em]">
                    {sub.audio_url && (
                      <a
                        href={`https://${R2}/${sub.audio_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ECEEDF]/50 hover:text-[#ECEEDF] underline underline-offset-4 transition-colors"
                      >
                        Listen ↗
                      </a>
                    )}
                    {sub.video_url && (
                      <a
                        href={`https://${R2}/${sub.video_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ECEEDF]/50 hover:text-[#ECEEDF] underline underline-offset-4 transition-colors"
                      >
                        Video ↗
                      </a>
                    )}
                    {sub.image_url && (
                      <a
                        href={`https://${R2}/${sub.image_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ECEEDF]/50 hover:text-[#ECEEDF] underline underline-offset-4 transition-colors"
                      >
                        Artwork ↗
                      </a>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#ECEEDF]/5">
                  <button
                    onClick={() => handleArchive(sub.id)}
                    disabled={busy !== null}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2.5 border border-[#ECEEDF]/20 text-[#ECEEDF]/70 hover:bg-[#ECEEDF] hover:text-black hover:border-[#ECEEDF] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {busy === sub.id + ':archive' ? 'Saving…' : '+ Archive'}
                  </button>
                  <button
                    onClick={() => handlePlaylist(sub.id)}
                    disabled={busy !== null}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2.5 border border-[#ECEEDF]/20 text-[#ECEEDF]/70 hover:bg-[#ECEEDF] hover:text-black hover:border-[#ECEEDF] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {busy === sub.id + ':playlist' ? 'Adding…' : '+ Playlist'}
                  </button>
                  <button
                    onClick={() => handleReject(sub.id, sub.admin_notes)}
                    disabled={busy !== null}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2.5 border border-red-900/40 text-red-500/60 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed ml-auto"
                  >
                    {busy === sub.id + ':reject' ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>

                {sub.admin_notes && (
                  <p className="mt-3 font-mono text-[10px] text-[#ECEEDF]/30 uppercase tracking-widest">
                    Note: {sub.admin_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#ECEEDF]/25">
            Reviewed ({reviewed.length})
          </h2>
          <div className="flex flex-col gap-2">
            {reviewed.map(sub => (
              <div
                key={sub.id}
                className="border border-[#ECEEDF]/5 bg-[#ECEEDF]/[0.01] hover:bg-[#ECEEDF]/[0.03] transition-colors p-4"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm text-[#ECEEDF]/60 font-medium truncate">
                      {sub.artist_name} — {sub.title}
                    </p>
                    {sub.audio_url && (
                      <a
                        href={`https://${R2}/${sub.audio_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] text-[#ECEEDF]/25 hover:text-[#ECEEDF]/60 underline underline-offset-4 transition-colors"
                      >
                        Listen ↗
                      </a>
                    )}
                  </div>
                  <span className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border ${
                    sub.status === 'approved'
                      ? 'text-green-400/60 border-green-500/15'
                      : 'text-red-400/60 border-red-500/15'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                {/* Action buttons — always available regardless of review status */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleArchive(sub.id)}
                    disabled={busy !== null}
                    className="font-mono text-[9px] uppercase tracking-[0.2em] px-3 py-2 border border-[#ECEEDF]/15 text-[#ECEEDF]/40 hover:bg-[#ECEEDF] hover:text-black hover:border-[#ECEEDF] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {busy === sub.id + ':archive' ? 'Saving…' : '+ Archive'}
                  </button>
                  <button
                    onClick={() => handlePlaylist(sub.id)}
                    disabled={busy !== null}
                    className="font-mono text-[9px] uppercase tracking-[0.2em] px-3 py-2 border border-[#ECEEDF]/15 text-[#ECEEDF]/40 hover:bg-[#ECEEDF] hover:text-black hover:border-[#ECEEDF] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {busy === sub.id + ':playlist' ? 'Adding…' : '+ Playlist'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
