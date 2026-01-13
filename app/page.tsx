'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 w-full flex flex-row items-center justify-center bg-black min-h-0 px-8 gap-8 md:gap-16">

      <Link
        href="/live"
        className="group relative"
      >
        <div className="text-[#ECEEDF] text-[14px] tracking-[0.3em] font-mono hover:text-white transition-colors duration-300">
          [ LIVE ]
        </div>
      </Link>

      <Link
        href="/archive"
        className="group relative"
      >
        <div className="text-[#ECEEDF] text-[14px] tracking-[0.3em] font-mono hover:text-white transition-colors duration-300">
          [ ARCHIVE ]
        </div>
      </Link>

    </main>
  );
}
