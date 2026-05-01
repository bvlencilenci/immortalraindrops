'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function HomeLivePanel({ isLive, streamTitle }: { isLive: boolean, streamTitle: string }) {
  return (
    <Link href="/live" className="w-full h-full relative group overflow-hidden outline-none block">
      <motion.div 
        initial={false}
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        className="w-full h-full p-8 md:p-12 flex flex-col justify-center transition-colors duration-500"
      >
        <motion.div 
          initial={{ opacity: 0.4 }}
          whileHover={{ opacity: 1, x: 5 }}
          className="absolute top-8 left-8 text-[10px] md:text-[11px] font-bold tracking-[0.5em] text-[#ECEEDF] uppercase"
        >
          [ LIVE ]
        </motion.div>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[#ECEEDF]/20'}`} />
            <span className="text-[10px] md:text-[12px] tracking-[0.3em] font-bold opacity-50 uppercase">
              {isLive ? 'TRANSMITTING' : 'STANDBY'}
            </span>
          </div>
          <h3 className="text-xl md:text-3xl font-bold tracking-[0.05em] uppercase leading-[0.9] max-w-md">
            {isLive ? streamTitle : 'SIGNAL LOST'}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
}

export function HomeArchivePanel({ recentTracks }: { recentTracks: { title: string }[] }) {
  return (
    <Link href="/archive" className="w-full h-full relative group overflow-hidden outline-none block">
      <motion.div 
        initial={false}
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        className="w-full h-full p-8 md:p-12 flex flex-col justify-center transition-colors duration-500"
      >
        <motion.div 
          initial={{ opacity: 0.4 }}
          whileHover={{ opacity: 1, x: 5 }}
          className="absolute top-8 left-8 text-[10px] md:text-[11px] font-bold tracking-[0.5em] text-[#ECEEDF] uppercase"
        >
          [ ARCHIVE ]
        </motion.div>
        
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col gap-3">
            {recentTracks.length > 0 ? recentTracks.map((track, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0.6 }}
                whileHover={{ opacity: 1 }}
                className="text-[12px] md:text-[14px] tracking-[0.1em] font-bold border-l border-[#ECEEDF]/15 pl-4 py-1 uppercase truncate"
              >
                {track.title}
              </motion.div>
            )) : (
              <div className="text-[11px] tracking-widest opacity-30 italic uppercase pl-4">
                NO DATA RECOVERED
              </div>
            )}
          </div>
          <div className="text-[9px] tracking-[0.4em] opacity-30 group-hover:opacity-60 transition-opacity uppercase font-bold">
            + EXPLORE_DATABASE
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
