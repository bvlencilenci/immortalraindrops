'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface HomeRightPanelsProps {
  isLive: boolean;
  streamTitle: string;
  recentTracks: { title: string }[];
}

export function HomeRightPanels({ isLive, streamTitle, recentTracks }: HomeRightPanelsProps) {
  return (
    <>
      {/* Top: Live Panel */}
      <Link href="/live" className="flex-1 border-b border-[#ECEEDF]/15 relative group overflow-hidden outline-none">
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
            <h3 className="text-2xl md:text-4xl font-bold tracking-[0.05em] uppercase leading-[0.9] max-w-md">
              {isLive ? streamTitle : 'SIGNAL LOST'}
            </h3>
          </div>

          {/* Corner Decor */}
          <div className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-[#ECEEDF]/10 group-hover:border-[#ECEEDF]/30 transition-colors" />
        </motion.div>
      </Link>

      {/* Bottom: Archive Panel */}
      <Link href="/archive" className="flex-1 relative group overflow-hidden outline-none">
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
                  className="text-[13px] md:text-[15px] tracking-[0.1em] font-bold border-l border-[#ECEEDF]/15 pl-6 py-1 uppercase truncate"
                >
                  {track.title}
                </motion.div>
              )) : (
                <div className="text-[12px] tracking-widest opacity-30 italic uppercase pl-6">
                  NO DATA RECOVERED
                </div>
              )}
            </div>
            <div className="text-[9px] tracking-[0.4em] opacity-30 group-hover:opacity-60 transition-opacity uppercase font-bold">
              + EXPLORE_DATABASE
            </div>
          </div>

          {/* Corner Decor */}
          <div className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-[#ECEEDF]/10 group-hover:border-[#ECEEDF]/30 transition-colors" />
        </motion.div>
      </Link>
    </>
  );
}
