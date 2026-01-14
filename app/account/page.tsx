'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUIStore } from '@/store/useUIStore';
import { translations } from '@/lib/translations';

export default function AccountPage() {
  const router = useRouter();
  const { language } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isGodmode, setIsGodmode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const t = translations[language].account;

  useEffect(() => {
    setHydrated(true);
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || null);

      // Fetch Profile for Username & Godmode
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, is_godmode')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
        setIsGodmode(profile.is_godmode || false);
      }

      setLoading(false);
    };

    getUser();
  }, [router]);

  if (!hydrated) return <main className="min-h-screen bg-black" />;

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#ECEEDF] font-mono text-xs animate-pulse">{t.loading}</div>
      </main>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-12 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-mono text-[#ECEEDF] tracking-widest text-sm uppercase">
            {t.title}
          </span>
          <span className="font-mono text-[#ECEEDF]/50 text-xs tracking-widest uppercase">
            {t.subtitle}
          </span>
        </div>

        {/* User Info */}
        <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/5 p-6 rounded-sm flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-[#ECEEDF]/40 uppercase tracking-widest">{t.identity}</span>
            <span className="text-lg font-mono text-[#ECEEDF] uppercase tracking-wide">
              {username || t.unknown}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-[#ECEEDF]/40 uppercase tracking-widest">{t.email}</span>
            <span className="text-xs font-mono text-[#ECEEDF]/70 tracking-wide font-light">
              {email}
            </span>
          </div>

          {isGodmode && (
            <div className="mt-2 border border-[#ECEEDF]/20 bg-[#ECEEDF]/5 p-2 text-center">
              <span className="text-[10px] font-mono text-[#ECEEDF]/70 uppercase tracking-[0.2em]">
                {t.godmode_active}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex flex-col gap-4">
          <Link href="/upload" className="group">
            <div className="border border-[#ECEEDF]/20 p-4 flex items-center justify-between hover:bg-[#ECEEDF]/10 transition-colors">
              <span className="font-mono text-xs text-[#ECEEDF] uppercase tracking-widest">{t.upload}</span>
              <span className="font-mono text-xs text-[#ECEEDF]/30 group-hover:text-[#ECEEDF] transition-colors">→</span>
            </div>
          </Link>

          <Link href="/my-uploads" className="group">
            <div className="border border-[#ECEEDF]/20 p-4 flex items-center justify-between hover:bg-[#ECEEDF]/10 transition-colors">
              <span className="font-mono text-xs text-[#ECEEDF] uppercase tracking-widest">{t.my_uploads}</span>
              <span className="font-mono text-xs text-[#ECEEDF]/30 group-hover:text-[#ECEEDF] transition-colors">→</span>
            </div>
          </Link>

          <Link href="/settings" className="group">
            <div className="border border-[#ECEEDF]/20 p-4 flex items-center justify-between hover:bg-[#ECEEDF]/10 transition-colors">
              <span className="font-mono text-xs text-[#ECEEDF] uppercase tracking-widest">{t.settings}</span>
              <span className="font-mono text-xs text-[#ECEEDF]/30 group-hover:text-[#ECEEDF] transition-colors">→</span>
            </div>
          </Link>

          {isGodmode && (
            <Link href="/godmode" className="group">
              <div className="border border-red-500/20 p-4 flex items-center justify-between hover:bg-red-900/10 transition-colors">
                <span className="font-mono text-xs text-red-400 uppercase tracking-widest">{t.godmode_panel}</span>
                <span className="font-mono text-xs text-red-500/30 group-hover:text-red-400 transition-colors">→</span>
              </div>
            </Link>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-[#ECEEDF]/30 hover:text-red-400 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors text-center"
        >
          {t.logout}
        </button>

      </div>
    </main>
  );
}
