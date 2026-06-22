import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { updateSubmissionStatus } from '@/app/godmode/actions';

export default function SubmissionReview() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (data) setSubmissions(data);
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string, currentNotes: string) => {
    const notes = prompt('Add admin notes (optional):', currentNotes || '') ?? currentNotes;
    const res = await updateSubmissionStatus(id, newStatus, notes);
    if (res.success) {
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, admin_notes: notes } : s));
    } else {
      alert(`Failed: ${res.error}`);
    }
  };

  if (loading) return <div className="text-[#ECEEDF] p-8 font-mono tracking-widest text-xs animate-pulse">RETRIEVING_TRANSMISSIONS...</div>;

  return (
    <div className="flex flex-col gap-6 font-mono text-[#ECEEDF] animate-in fade-in duration-500">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#ECEEDF]/5 p-4 border border-[#ECEEDF]/10">
        <div className="text-[#ECEEDF]/40 text-[10px] uppercase tracking-widest">
          {submissions.length} TRANSMISSIONS_INDEXED
        </div>
      </div>

      <div className="border border-[#ECEEDF]/10 bg-black/40 p-4 md:p-6 flex flex-col gap-3">
        <h3 className="text-xs uppercase tracking-widest text-[#ECEEDF]/70 border-b border-[#ECEEDF]/10 pb-3">
          TRANSMISSION_QUEUE
        </h3>
        
        {submissions.length === 0 ? (
          <div className="text-[#ECEEDF]/30 text-xs py-8">NO SUBMISSIONS FOUND.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {submissions.map(sub => (
              <div key={sub.id} className="border border-[#ECEEDF]/10 p-4 bg-black/50 hover:bg-[#ECEEDF]/5 transition-colors gap-3">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#ECEEDF] mb-1">{sub.title}</div>
                    <div className="text-[10px] text-[#ECEEDF]/70 uppercase tracking-widest">— {sub.artist_name}</div>
                    <div className="text-[9px] mt-2 opacity-40 uppercase tracking-widest">FROM: {sub.email}</div>
                  </div>
                  <div className={`px-2 py-1 uppercase tracking-widest text-[8px] border ${
                    sub.status === 'approved' ? 'text-green-500 border-green-500/50 bg-green-500/10' :
                    sub.status === 'rejected' ? 'text-red-500 border-red-500/50 bg-red-500/10' :
                    'text-yellow-500 border-yellow-500/50 bg-yellow-500/10'
                  }`}>
                    [{sub.status}]
                  </div>
                </div>
                
                <div className="flex gap-4 my-4 text-[9px] uppercase tracking-widest">
                  {sub.audio_url && <a href={`https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${sub.audio_url}`} target="_blank" className="underline hover:text-white transition-colors">REVIEW_AUDIO</a>}
                  {sub.video_url && <a href={`https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${sub.video_url}`} target="_blank" className="underline hover:text-white transition-colors">REVIEW_VIDEO</a>}
                  {sub.image_url && <a href={`https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${sub.image_url}`} target="_blank" className="underline hover:text-white transition-colors">REVIEW_ART</a>}
                </div>

                <div className="flex gap-3 border-t border-[#ECEEDF]/10 pt-4 items-center">
                  {sub.status !== 'approved' && (
                    <button onClick={() => handleStatusChange(sub.id, 'approved', sub.admin_notes)} className="px-3 py-2 bg-green-500/10 text-green-500 border border-green-500/50 hover:bg-green-500 hover:text-black transition-colors text-[9px] uppercase tracking-widest">
                      APPROVE
                    </button>
                  )}
                  {sub.status !== 'rejected' && (
                    <button onClick={() => handleStatusChange(sub.id, 'rejected', sub.admin_notes)} className="px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-black transition-colors text-[9px] uppercase tracking-widest">
                      REJECT
                    </button>
                  )}
                  {sub.status === 'pending' && (
                    <span className="text-[9px] opacity-30 uppercase tracking-widest ml-auto">ACTION_REQUIRED</span>
                  )}
                </div>
                {sub.admin_notes && (
                  <div className="mt-4 text-[9px] text-[#ECEEDF]/50 uppercase tracking-widest bg-black/40 p-2 border border-[#ECEEDF]/5">
                    NOTES: {sub.admin_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
