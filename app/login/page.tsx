'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { resolveEmailFromUsername } from '@/app/auth/actions';

export default function LoginPage() {
  const router = useRouter();
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Login Attempt for:', usernameInput);

    try {
      // 1. Resolve Username -> Email
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await resolveEmailFromUsername(usernameInput);
      console.log('Resolution Response:', response);

      if (!response.success || !response.email) {
        console.warn('Resolution failed or no email found');
        setError('Invalid credentials');
        setLoading(false);
        return;
      }

      const email = response.email;
      const isVerified = response.isVerified;
      console.log('Resolved Email:', email, 'Verified:', isVerified);

      if (!isVerified) {
        setError('Email not verified. Please check your inbox.');
        setLoading(false);
        return;
      }

      // 2. Sign In with Resolved Email
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Supabase Auth Error:', authError);
        setError(authError.message);
        setLoading(false);
      } else {
        console.log('Login Success:', data);
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Login Exception:', err);
      setError('An unexpected error occurred.');
      setLoading(false);
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
            type="text"
            placeholder="USERNAME"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
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

        <div className="text-center flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            className="text-[#ECEEDF]/30 text-[10px] font-mono hover:text-[#ECEEDF] transition-colors uppercase tracking-widest"
          >
            [ FORGOT_PASSWORD? ]
          </button>
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
