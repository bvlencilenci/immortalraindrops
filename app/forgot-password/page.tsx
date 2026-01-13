'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Reset link sent. Please check your inbox.' });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-12 animate-in fade-in duration-700">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-mono text-[#ECEEDF] tracking-widest text-sm uppercase">
            IMMORTAL RAINDROPS
          </span>
          <span className="font-mono text-[#ECEEDF]/50 text-[10px] tracking-[0.3em] uppercase">
            [ PASSWORD_RECOVERY ]
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleResetRequest} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#ECEEDF]/40 uppercase tracking-widest pl-1">
              EMAIL_ADDRESS
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-[#ECEEDF]/10 rounded-sm px-4 py-3 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF]/40 outline-none transition-colors placeholder-[#ECEEDF]/10"
              placeholder="operator@matrix.net"
            />
          </div>

          {message && (
            <div className={`text-[10px] font-mono uppercase tracking-widest p-4 border ${message.type === 'success'
                ? 'border-green-500/20 bg-green-500/5 text-green-400'
                : 'border-red-500/20 bg-red-500/5 text-red-400'
              }`}>
              {message.text}
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-[#ECEEDF] hover:bg-white text-black font-mono text-xs py-4 uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SENDING_LINK...' : '[ REQUEST_RESET ]'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-[#ECEEDF]/30 hover:text-[#ECEEDF] font-mono text-[10px] uppercase tracking-widest transition-colors"
          >
            ← BACK_TO_LOGIN
          </Link>
        </div>

      </div>
    </main>
  );
}
