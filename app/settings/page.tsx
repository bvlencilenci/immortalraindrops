'use client';

import { useUIStore } from '@/store/useUIStore';
import { translations, Language } from '@/lib/translations';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { language, setLanguage } = useUIStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <main className="min-h-screen bg-black" />;
  }

  const t = translations[language].settings;

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'ENGLISH' },
    { code: 'es', label: 'ESPAÑOL' },
    { code: 'de', label: 'DEUTSCH' },
    { code: 'fr', label: 'FRANÇAIS' },
    { code: 'ru', label: 'РУССКИЙ' },
  ];

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-12 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-mono text-[#ECEEDF] tracking-widest text-sm uppercase">
            {t.title}
          </span>
        </div>

        {/* Language Selection */}
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-mono text-[#ECEEDF]/40 uppercase tracking-widest text-center">
            {t.language}
          </span>
          <div className="flex flex-col gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`border p-4 flex items-center justify-between transition-colors uppercase font-mono text-xs tracking-widest ${language === lang.code
                    ? 'border-[#ECEEDF] bg-[#ECEEDF]/10 text-[#ECEEDF]'
                    : 'border-[#ECEEDF]/20 text-[#ECEEDF]/50 hover:border-[#ECEEDF]/50 hover:text-[#ECEEDF]'
                  }`}
              >
                <span>{lang.label}</span>
                {language === lang.code && <span>[ ACTIVE ]</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Back Link */}
        <Link
          href="/account"
          className="text-[#ECEEDF]/30 hover:text-[#ECEEDF] text-[10px] font-mono uppercase tracking-[0.2em] transition-colors text-center"
        >
          {t.back}
        </Link>

      </div>
    </main>
  );
}
