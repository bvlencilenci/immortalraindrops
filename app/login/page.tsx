'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[#ECEEDF] tracking-widest text-sm uppercase">
            IMMORTAL RAINDROPS
          </span>
          <span className="font-mono text-[#ECEEDF]/50 text-xs tracking-widest uppercase">
            [ MEMBER ACCESS ]
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent border-b border-[#ECEEDF]/20 text-[#ECEEDF] px-0 py-2 font-mono text-sm focus:outline-none focus:border-[#ECEEDF] placeholder-[#ECEEDF]/30"
          />
          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent border-b border-[#ECEEDF]/20 text-[#ECEEDF] px-0 py-2 font-mono text-sm focus:outline-none focus:border-[#ECEEDF] placeholder-[#ECEEDF]/30"
          />
        </div>

        {error && (
          <div className="text-red-500 font-mono text-xs text-center border border-red-900/50 p-2 bg-red-900/10">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 border border-[#ECEEDF]/20 text-[#ECEEDF] font-mono text-xs uppercase tracking-widest py-3 hover:bg-[#ECEEDF] hover:text-black transition-colors disabled:opacity-50"
        >
          {loading ? 'AUTHENTICATING...' : 'ENTER'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="text-[#ECEEDF]/30 text-[10px] font-mono hover:text-[#ECEEDF] transition-colors uppercase tracking-widest"
          >
            Request Access / Sign Up
          </button>
        </div>
      </form>
    </main>
  );
}
