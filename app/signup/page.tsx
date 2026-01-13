'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';


export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // 1. Sign Up (Trigger will create Profile)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    console.log('Signup Attempt:', { email, username });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Success - Redirect to Verification
    router.push(`/verify?email=${encodeURIComponent(email)}`);
    router.refresh();
    // Force redirect if router fails
    // window.location.href = '/verify';
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleSignup} className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[#ECEEDF] tracking-widest text-sm uppercase">
            IMMORTAL RAINDROPS
          </span>
          <span className="font-mono text-[#ECEEDF]/50 text-xs tracking-widest uppercase">
            [ NEW OPERATOR ]
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="USERNAME"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-transparent border-b border-[#ECEEDF]/20 text-[#ECEEDF] px-0 py-2 font-mono text-sm focus:outline-none focus:border-[#ECEEDF] placeholder-[#ECEEDF]/30"
            required
          />
          <input
            type="email"
            placeholder="EMAIL (PRIVATE)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent border-b border-[#ECEEDF]/20 text-[#ECEEDF] px-0 py-2 font-mono text-sm focus:outline-none focus:border-[#ECEEDF] placeholder-[#ECEEDF]/30"
            required
          />
          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent border-b border-[#ECEEDF]/20 text-[#ECEEDF] px-0 py-2 font-mono text-sm focus:outline-none focus:border-[#ECEEDF] placeholder-[#ECEEDF]/30"
            required
          />
        </div>

        {error && (
          <div className="text-red-500 font-mono text-xs text-center border border-red-900/50 p-2 bg-red-900/10">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !username || !email || !password}
          className="mt-4 border border-[#ECEEDF]/20 text-[#ECEEDF] font-mono text-xs uppercase tracking-widest py-3 hover:bg-[#ECEEDF] hover:text-black transition-colors disabled:opacity-50"
        >
          {loading ? 'INITIALIZING...' : 'CREATE ACCOUNT'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-[#ECEEDF]/30 text-[10px] font-mono hover:text-[#ECEEDF] transition-colors uppercase tracking-widest"
          >
            Already have access? Login
          </button>
        </div>
      </form>
    </main>
  );
}
