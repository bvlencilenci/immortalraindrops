'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { updateSubmissionStatus, approveToArchive } from '@/app/godmode/actions';

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
    setTimeout(() => setToast(null), 3000);
  };

  const handleReject = async (id: string, currentNotes: string) => {
    const notes = prompt('Rejection notes (optional):', currentNotes || '') ?? currentNotes;
    setBusy(id + '-reject');
    const res = await updateSubmissionStatus(id, 'rejected', notes);
    setBusy(null);
    if (res.success) {
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected', admin_notes: notes } : s));
      showToast('SUBMISSION REJECTED', true);
    } else {
      showToast(`ERROR: ${res.error}`, false);
    }
  };

  const handleApproveArchive = async (id: string, addToFeatured: boolean) => {
    setBusy(id + (addToFeatured ? '-feat' : '-arch'));
    const res = await approveToArchive(id, { addToFeatured });
    setBusy(null);
    if (res.success) {
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
      showToast(addToFeatured ? 'APPROVED + QUEUED TO FEATURED RADIO' : 'APPROVED + ADDED TO ARCHIVE', true);
    } else {
      showToast(`ERROR: ${res.error}`, false);
    }
  };

  if (loading) return (
    <div className="text-[#ECEEDF] p-8 font-mono tracking-widest text-xs animate-pulse">
      RETRIEVING_TRANSMISSIONS...
    </div>
  );

  const pending = submissions.filter(s => s.status === 'pending');
  const reviewed = submissions.filter(s => s.status !== 'pending');

  return (
    <div className="flex flex-col gap-6 font-mono text-[#ECEEDF] animate-in fade-in duration-500">

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
          {pending.length} PENDING · {reviewed.length} REVIEWED
        </div>
        <button
          onClick={fetchSubmissions}
          className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 hover:text-[#ECEEDF] border border-[#ECEEDF]/10 hover:border-[#ECEEDF]/40 px-3 py-1.5 transition-colors"
        >
          REFRESH
        </button>
      </div>

      {/* Pending Queue */}
      <div className="border border-[#ECEEDF]/10 bg-black/40 p-4 md:p-6 flex flex-col gap-3">
        <h3 className="text-xs uppercase tracking-widest text-[#ECEEDF]/70 border-b border-[#ECEEDF]/10 pb-3">
          PENDING_REVIEW ({pending.length})
        </h3>

        {pending.length === 0 ? (
          <div className="text-[#ECEEDF]/30 text-xs py-8 text-center">QUEUE EMPTY — ALL TRANSMISSIONS REVIEWED.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map(sub => (
              <div key={sub.id} className="border border-[#ECEEDF]/10 p-4 bg-black/50 hover:bg-[#ECEEDF]/5 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#ECEEDF] mb-1">{sub.title}</div>
                    <div className="text-[10px] text-[#ECEEDF]/70 uppercase tracking-widest">— {sub.artist_name}</div>
                    <div className="text-[9px] mt-2 opacity-40 uppercase tracking-widest">FROM: {sub.email}</div>
                  </div>
                  <div className="px-2 py-1 uppercase tracking-widest text-[8px] border text-yellow-500 border-yellow-500/50 bg-yellow-500/10">
                    [PENDING]
                  </div>
                </div>

                <div className="flex gap-4 my-4 text-[9px] uppercase tracking-widest">
                  {sub.audio_url && (
                    <a href={`https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${sub.audio_url}`}
                      target="_blank" className="underline hover:text-white transition-colors">
                      REVIEW_AUDIO
                    </a>
                  )}
                  {sub.video_url && (
                    <a href={`https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${sub.video_url}`}
                      target="_blank" className="underline hover:text-white transition-colors">
                      REVIEW_VIDEO
                    </a>
                  )}
                  {sub.image_url && (
                    <a href={`https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${sub.image_url}`}
                      target="_blank" className="underline hover:text-white transition-colors">
                      REVIEW_ART
                    </a>
                  )}
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap gap-2 border-t border-[#ECEEDF]/10 pt-4">
                  <button
                    onClick={() => handleApproveArchive(sub.id, false)}
                    disabled={busy !== null}
                    className="px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/40 hover:bg-green-500 hover:text-black transition-colors text-[9px] uppercase tracking-widest disabled:opacity-30"
                  >
                    {busy === sub.id + '-arch' ? 'SAVING...' : '✓ APPROVE → ARCHIVE'}
                  </button>
                  <button
                    onClick={() => handleApproveArchive(sub.id, true)}
                    disabled={busy !== null}
                    className="px-3 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/40 hover:bg-purple-500 hover:text-white transition-colors text-[9px] uppercase tracking-widest disabled:opacity-30"
                  >
                    {busy === sub.id + '-feat' ? 'QUEUING...' : '★ APPROVE → ARCHIVE + FEATURED RADIO'}
                  </button>
                  <button
                    onClick={() => handleReject(sub.id, sub.admin_notes)}
                    disabled={busy !== null}
                    className="px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-black transition-colors text-[9px] uppercase tracking-widest disabled:opacity-30"
                  >
                    {busy === sub.id + '-reject' ? 'REJECTING...' : '✗ REJECT'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div className="border border-[#ECEEDF]/10 bg-black/40 p-4 md:p-6 flex flex-col gap-3">
          <h3 className="text-xs uppercase tracking-widest text-[#ECEEDF]/40 border-b border-[#ECEEDF]/10 pb-3">
            REVIEWED ({reviewed.length})
          </h3>
          <div className="flex flex-col gap-2">
            {reviewed.map(sub => (
              <div key={sub.id} className="flex justify-between items-center border-b border-[#ECEEDF]/5 py-2 text-[10px] opacity-50">
                <span className="truncate max-w-[60%]">{sub.artist_name} — {sub.title}</span>
                <span className={`uppercase tracking-widest text-[8px] ${
                  sub.status === 'approved' ? 'text-green-500' : 'text-red-500'
                }`}>[{sub.status}]</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
