'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Note: Supabase automatically handles the session when clicking the link from email.
  // The user is technically "logged in" with a temporary session that allows password updates.

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
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
            [ SECURE_NEW_IDENTITY ]
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-[#ECEEDF]/40 uppercase tracking-widest pl-1">
                NEW_PASSWORD
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-[#ECEEDF]/10 rounded-sm px-4 py-3 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF]/40 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-[#ECEEDF]/40 uppercase tracking-widest pl-1">
                CONFIRM_PASSWORD
              </label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black border border-[#ECEEDF]/10 rounded-sm px-4 py-3 font-mono text-[#ECEEDF] text-sm focus:border-[#ECEEDF]/40 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
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
            {loading ? 'SYNCING_SEC_PROTOCOLS...' : '[ UPDATE_PASSWORD ]'}
          </button>
        </form>

      </div>
    </main>
  );
}
