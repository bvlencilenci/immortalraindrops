'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import TrackList from '@/components/admin/TrackList';
import UserList from '@/components/admin/UserList';
import SystemSettings from '@/components/admin/SystemSettings';

export default function GodModePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'tracks' | 'users' | 'system'>('tracks');

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

  const tabs = [
    { id: 'tracks', label: 'TRACKS' },
    { id: 'users', label: 'USERS' },
    { id: 'system', label: 'SETTINGS' },
  ];

  return (
    <main className="min-h-screen bg-black flex flex-col pt-32 px-4 md:px-12 pb-12 overflow-x-hidden">

      {/* Admin Header */}
      <div className="flex flex-col gap-8 mb-12">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-red-500 tracking-[0.4em] text-xs uppercase animate-pulse">
            ● GOD_MODE_ACTIVE
          </span>
          <h1 className="text-[#ECEEDF] font-mono tracking-[0.2em] uppercase text-3xl font-bold">
            ADMIN PANEL
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-4 pb-8 border-b border-[#ECEEDF]/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`font-mono text-[10px] uppercase tracking-[0.3em] px-6 py-3 transition-all border ${activeTab === tab.id
                ? 'bg-[#ECEEDF] text-black border-[#ECEEDF]'
                : 'text-[#ECEEDF]/40 border-[#ECEEDF]/10 hover:border-[#ECEEDF]/40 hover:text-[#ECEEDF]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeTab === 'tracks' && <TrackList />}
        {activeTab === 'users' && <UserList />}
        {activeTab === 'system' && <SystemSettings />}
      </div>

      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => router.push('/')}
          className="bg-red-500 text-black font-mono text-[10px] uppercase tracking-widest px-6 py-3 hover:bg-black hover:text-red-500 border border-red-500 transition-all shadow-[0_0_20px_rgba(239,44,44,0.3)]"
        >
          EXIT_GODMODE
        </button>
      </div>
    </main>
  );
}

