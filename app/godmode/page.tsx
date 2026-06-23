'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import SubmissionReview from '@/components/admin/SubmissionReview';
import UserList from '@/components/admin/UserList';
import SystemSettings from '@/components/admin/SystemSettings';
import NewsManager from '@/components/admin/NewsManager';
import HomepageManager from '@/components/admin/HomepageManager';
import BroadcastControls from '@/components/admin/BroadcastControls';

export default function GodModePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'submissions' | 'users' | 'system' | 'broadcast'>('submissions');

  const [needsLogin, setNeedsLogin] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Load tracks when authenticated
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_godmode')
        .eq('id', user.id)
        .single();

      if (profile?.is_godmode) {
        setIsAuthenticated(true);
        setNeedsLogin(false);
        setLoading(false);
      } else {
        setError('ACCESS DENIED: GODMODE REQUIRED');
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    let actualEmail = login;

    // If it's not an email, lookup by username
    if (!login.includes('@')) {
      const { data, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', login)
        .single();

      if (data?.email) {
        actualEmail = data.email;
      } else {
        setError('OPERATOR NOT FOUND');
        setIsLoggingIn(false);
        return;
      }
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email: actualEmail, password });
    if (authError) {
      setError(authError.message);
      setIsLoggingIn(false);
    } else {
      window.location.reload();
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

  if (needsLogin) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
        <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-6 p-8 border border-[#ECEEDF]/20 bg-black/50 backdrop-blur-md">
          <div className="text-center text-[#ECEEDF] tracking-[0.2em] uppercase text-xl font-bold mb-4">
            SYSTEM_LOGIN
          </div>
          {error && (
            <div className="text-red-500 text-xs text-center border border-red-500/30 p-2 bg-red-500/10 mb-2">
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="LOGIN_ID"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full bg-transparent border border-[#ECEEDF]/20 text-[#ECEEDF] p-3 text-sm focus:outline-none focus:border-[#ECEEDF] transition-colors uppercase tracking-widest placeholder:text-[#ECEEDF]/30"
            required
          />
          <input
            type="password"
            placeholder="ACCESS_CODE"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border border-[#ECEEDF]/20 text-[#ECEEDF] p-3 text-sm focus:outline-none focus:border-[#ECEEDF] transition-colors tracking-widest placeholder:text-[#ECEEDF]/30"
            required
          />
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-[#ECEEDF] text-black font-bold uppercase tracking-[0.2em] p-3 text-sm hover:bg-white transition-colors disabled:opacity-50 mt-2"
          >
            {isLoggingIn ? 'AUTHENTICATING...' : 'ENTER'}
          </button>
        </form>
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
    { id: 'submissions', label: 'SUBMISSIONS' },
    { id: 'playlist', label: 'PLAYLIST', href: '/godmode/playlist' },
    { id: 'broadcast', label: 'BROADCAST' },
    { id: 'users', label: 'USERS' },
    { id: 'system', label: 'PREFERENCES' },
  ];

  return (
    <main className="min-h-screen bg-black flex flex-col pt-32 px-4 md:px-12 pb-12 overflow-x-hidden">

      {/* Admin Header */}
      <div className="flex flex-col gap-6 mb-8 md:gap-8 md:mb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#ECEEDF] font-mono tracking-[0.2em] uppercase text-2xl md:text-3xl font-bold">
            ADMIN PANEL
          </h1>
        </div>

        {/* Tab Navigation - Scrollable on Mobile */}
        <div className="flex overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 border-b border-[#ECEEDF]/10">
          <div className="flex gap-3 md:gap-4 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if ('href' in tab && tab.href) {
                    router.push(tab.href);
                  } else {
                    setActiveTab(tab.id as any);
                  }
                }}
                className={`font-mono text-[10px] uppercase tracking-[0.3em] px-4 py-3 md:px-6 md:py-3 transition-all border whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-[#ECEEDF] text-black border-[#ECEEDF]'
                  : 'text-[#ECEEDF]/40 border-[#ECEEDF]/10 hover:border-[#ECEEDF]/40 hover:text-[#ECEEDF]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 mt-6">
        {activeTab === 'submissions' && <SubmissionReview />}
        {activeTab === 'broadcast' && <BroadcastControls />}
        {activeTab === 'users' && <UserList />}
        {activeTab === 'system' && <SystemSettings />}
      </div>

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

