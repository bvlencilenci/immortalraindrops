'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function HomeLivePanel({ isLive, streamTitle }: { isLive: boolean, streamTitle: string }) {
  const pathname = usePathname();
  const isActive = pathname === '/live';
  return (
    <Link href="/live" className="w-full h-full relative group overflow-hidden outline-none block">
      <motion.div 
        initial={false}
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        className="w-full h-full p-8 md:p-12 flex flex-col justify-center transition-colors duration-500"
      >
        <div className="absolute top-8 left-8 text-[10px] md:text-[11px] tracking-[0.5em] uppercase flex items-center">
          <span className={`${isActive ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70 group-hover:font-bold group-hover:text-white'} transition-all duration-200`}>[</span>
          <span className={`mx-2 ${isActive ? 'text-white' : 'text-[#ECEEDF]/70 group-hover:text-white'} transition-colors duration-200`}>LIVE</span>
          <span className={`${isActive ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70 group-hover:font-bold group-hover:text-white'} transition-all duration-200`}>]</span>
        </div>
        
        <div className="flex flex-col gap-4">
          {isLive && (
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] md:text-[12px] tracking-[0.3em] font-bold opacity-50 uppercase">
                TRANSMITTING
              </span>
            </div>
          )}
          <h3 className="text-xl md:text-3xl font-bold tracking-[0.05em] uppercase leading-[0.9] max-w-md">
            {isLive ? streamTitle : '—'}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
}

export function HomeArchivePanel({ recentTracks }: { recentTracks: { title: string }[] }) {
  const pathname = usePathname();
  const isActive = pathname === '/archive';

  return (
    <Link href="/archive" className="w-full h-full relative group overflow-hidden outline-none block">
      <motion.div 
        initial={false}
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        className="w-full h-full p-8 md:p-12 flex flex-col justify-center transition-colors duration-500"
      >
        <div className="absolute top-8 left-8 text-[10px] md:text-[11px] tracking-[0.5em] uppercase flex items-center">
          <span className={`${isActive ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70 group-hover:font-bold group-hover:text-white'} transition-all duration-200`}>[</span>
          <span className={`mx-2 ${isActive ? 'text-white' : 'text-[#ECEEDF]/70 group-hover:text-white'} transition-colors duration-200`}>ARCHIVE</span>
          <span className={`${isActive ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70 group-hover:font-bold group-hover:text-white'} transition-all duration-200`}>]</span>
        </div>
        
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col gap-3">
            {recentTracks.map((track, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0.6 }}
                whileHover={{ opacity: 1 }}
                className="text-[12px] md:text-[14px] tracking-[0.1em] font-bold border-l border-[#ECEEDF]/15 pl-4 py-1 uppercase truncate"
              >
                {track.title}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
