import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data, error } = await supabase
    .from('submissions')
    .select('title, artist_name, status, admin_notes, submitted_at')
    .eq('status_token', resolvedParams.token)
    .single();

  if (error || !data) {
    return notFound();
  }

  const getStatusColor = () => {
    switch(data.status) {
      case 'approved': return 'text-green-500 border-green-500';
      case 'rejected': return 'text-red-500 border-red-500';
      default: return 'text-yellow-500 border-yellow-500';
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/50 border border-[#ECEEDF]/20 p-8 font-mono">
        <h1 className="text-xl text-[#ECEEDF] uppercase tracking-widest mb-8 text-center border-b border-[#ECEEDF]/20 pb-4">
          TRANSMISSION_STATUS
        </h1>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <span className="text-[#ECEEDF]/40 text-[10px] tracking-widest uppercase">TRACK/VIDEO</span>
            <span className="text-[#ECEEDF] text-lg">{data.title}</span>
            <span className="text-[#ECEEDF]/70 text-sm">{data.artist_name}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#ECEEDF]/40 text-[10px] tracking-widest uppercase mb-1">STATUS</span>
            <div className={`uppercase tracking-widest text-sm inline-block px-3 py-1 border ${getStatusColor()} self-start`}>
              [{data.status}]
            </div>
          </div>

          {data.admin_notes && (
            <div className="flex flex-col mt-4">
              <span className="text-[#ECEEDF]/40 text-[10px] tracking-widest uppercase mb-1">NOTES_FROM_ADMIN</span>
              <div className="text-[#ECEEDF] text-sm italic border-l border-[#ECEEDF]/30 pl-3 py-1">
                "{data.admin_notes}"
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-[#ECEEDF]/20 text-center">
             <Link href="/" className="text-[#ECEEDF]/50 hover:text-[#ECEEDF] text-[10px] uppercase tracking-widest transition-colors">
               [ RETURN_TO_BASE ]
             </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
