import React from 'react';

export interface FooterProps {
  listenerCount: number;
  uptimeSeconds: number;
  className?: string;
  hideBorder?: boolean;
}

export function Footer({
  listenerCount,
  uptimeSeconds,
  className = '',
  hideBorder = false
}: FooterProps) {
  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`w-full max-w-full mt-0 border-t border-black py-2.5 flex flex-row justify-between items-center text-[15px] md:text-[17px] font-vt323 text-[#6DBF82] bg-black select-none z-10 px-4 md:px-8 winamp-bevel ${className}`}
      data-testid="footer"
    >
      <div className="flex items-center gap-3">
        <span>LISTENERS: <span className="text-white">{listenerCount}</span></span>
        <span className="text-[#6DBF82]/30 select-none">░</span>
        <span>UPTIME: <span className="text-white">{formatUptime(uptimeSeconds)}</span></span>
      </div>
      <div className="flex items-center gap-3">
        <span>EST. 2026</span>
        <span className="text-[#6DBF82]/30 select-none">░</span>
        <span>LONDON, UK</span>
      </div>
    </div>
  );
}
