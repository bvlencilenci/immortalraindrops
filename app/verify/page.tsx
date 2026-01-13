'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleResend = async () => {
    if (!email) return;

    setSending(true);
    setMessage(null);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'EMAIL RESENT. PLEASE CHECK YOUR INBOX.', type: 'success' });
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col items-center gap-8 text-center max-w-md animate-in fade-in duration-500">

      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-[#ECEEDF] tracking-widest text-sm uppercase">
          IMMORTAL RAINDROPS
        </span>
        <span className="font-mono text-[#ECEEDF]/50 text-xs tracking-widest uppercase">
          [ ACCESS PENDING ]
        </span>
      </div>

      <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/5 p-8 rounded-sm w-full">
        <h1 className="font-mono text-[#ECEEDF] text-lg uppercase tracking-widest mb-4">
          VERIFICATION LINK SENT
        </h1>
        <p className="font-mono text-[#ECEEDF]/70 text-xs leading-relaxed uppercase tracking-wide mb-6">
          A confirmation link has been sent to:
          <br />
          <span className="text-[#ECEEDF] border-b border-[#ECEEDF]/20 pb-0.5">
            {email || 'YOUR EMAIL ADDRESS'}
          </span>
          <br /><br />
          Please check your inbox (and spam folder) and click the link to activate your access.
        </p>

        {/* Resend Section */}
        {email && (
          <div className="flex flex-col items-center gap-3 border-t border-[#ECEEDF]/10 pt-6">
            <button
              onClick={handleResend}
              disabled={sending}
              className="text-[#ECEEDF] text-[10px] font-mono uppercase tracking-[0.15em] border border-[#ECEEDF]/20 px-4 py-2 hover:bg-[#ECEEDF]/10 transition-colors disabled:opacity-50"
            >
              {sending ? 'SENDING...' : 'RESEND EMAIL'}
            </button>

            {message && (
              <span className={`text-[10px] font-mono uppercase tracking-wide ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {message.text}
              </span>
            )}
          </div>
        )}
      </div>

      <Link
        href="/login"
        className="text-[#ECEEDF]/50 hover:text-[#ECEEDF] text-xs font-mono uppercase tracking-widest border-b border-transparent hover:border-[#ECEEDF] transition-all pb-1"
      >
        RETURN TO LOGIN
      </Link>

    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-[#ECEEDF] font-mono text-xs animate-pulse">LOADING...</div>}>
        <VerifyContent />
      </Suspense>
    </main>
  );
}
