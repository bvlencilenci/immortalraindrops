'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import PlaylistManager from '@/components/admin/PlaylistManager';

export default function PlaylistPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_godmode')
        .eq('id', user.id)
        .single();

      if (profile?.is_godmode) {
        setIsAuthenticated(true);
        setLoading(false);
      } else {
        setError('ACCESS DENIED: GODMODE REQUIRED');
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

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

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-black flex flex-col pt-32 px-4 md:px-12 pb-12 overflow-x-hidden">
      <div className="flex flex-col gap-6 mb-8 md:gap-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-[#ECEEDF] font-mono tracking-[0.2em] uppercase text-2xl md:text-3xl font-bold">
            RADIO PLAYLIST
          </h1>
          <button
            onClick={() => router.push('/godmode')}
            className="text-[#ECEEDF]/40 font-mono text-[10px] uppercase tracking-widest border border-[#ECEEDF]/10 px-4 py-2 hover:border-[#ECEEDF]/40 hover:text-[#ECEEDF] transition-colors"
          >
            ← GODMODE
          </button>
        </div>
        <div className="text-[#ECEEDF]/30 font-mono text-[10px] uppercase tracking-widest">
          PIRATE RADIO ROTATION MANAGEMENT — ADMIN ONLY
        </div>
      </div>

      <PlaylistManager />

      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
        <button
          onClick={() => router.push('/')}
          className="bg-black/80 backdrop-blur-md text-red-500 font-mono text-[10px] uppercase tracking-widest px-5 py-3 md:px-6 md:py-3 hover:bg-red-900/20 border border-red-900/50 transition-all shadow-lg active:scale-95"
        >
          EXIT_GODMODE
        </button>
      </div>
    </main>
  );
}
