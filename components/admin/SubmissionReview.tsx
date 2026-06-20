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
      <h2 className="text-xl uppercase tracking-widest border-b border-[#ECEEDF]/20 pb-4">Transmission Queue</h2>
      {submissions.length === 0 && <div className="opacity-50">NO SUBMISSIONS FOUND.</div>}
      
      {submissions.map(sub => (
        <div key={sub.id} className="border border-[#ECEEDF]/20 p-6 bg-black/50 hover:bg-[#ECEEDF]/5 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xl font-bold uppercase tracking-widest mb-1">{sub.title}</div>
              <div className="text-sm text-[#ECEEDF]/70">{sub.artist_name}</div>
              <div className="text-[10px] mt-2 opacity-40 uppercase">FROM: {sub.email}</div>
            </div>
            <div className={`px-3 py-1 uppercase tracking-widest text-xs border ${
              sub.status === 'approved' ? 'text-green-500 border-green-500' :
              sub.status === 'rejected' ? 'text-red-500 border-red-500' :
              'text-yellow-500 border-yellow-500'
            }`}>
              [{sub.status}]
            </div>
          </div>
          
          <div className="flex gap-6 my-6 text-xs uppercase tracking-widest">
            {sub.audio_url && <a href={`https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${sub.audio_url}`} target="_blank" className="underline hover:text-white transition-colors">Review Audio</a>}
            {sub.video_url && <a href={`https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${sub.video_url}`} target="_blank" className="underline hover:text-white transition-colors">Review Video</a>}
            {sub.image_url && <a href={`https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${sub.image_url}`} target="_blank" className="underline hover:text-white transition-colors">Review Art</a>}
          </div>

          <div className="flex gap-4 border-t border-[#ECEEDF]/10 pt-4">
            {sub.status !== 'approved' && (
              <button onClick={() => handleStatusChange(sub.id, 'approved', sub.admin_notes)} className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500 hover:bg-green-500 hover:text-black transition-colors text-xs uppercase tracking-widest">
                Approve
              </button>
            )}
            {sub.status !== 'rejected' && (
              <button onClick={() => handleStatusChange(sub.id, 'rejected', sub.admin_notes)} className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500 hover:bg-red-500 hover:text-black transition-colors text-xs uppercase tracking-widest">
                Reject
              </button>
            )}
            {sub.status === 'pending' && (
              <span className="text-[10px] opacity-30 uppercase tracking-widest self-center ml-4">ACTION_REQUIRED</span>
            )}
          </div>
          {sub.admin_notes && (
             <div className="mt-4 text-xs text-[#ECEEDF]/50 italic">
               Notes: {sub.admin_notes}
             </div>
          )}
        </div>
      ))}
    </div>
  );
}
