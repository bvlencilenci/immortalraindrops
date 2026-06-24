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
      className={`w-full max-w-full mt-0 ${hideBorder ? '' : 'border-t border-[#ECEEDF]/10'} py-3 flex flex-row flex-wrap justify-between items-center gap-y-2 gap-x-4 text-[8px] md:text-[9px] tracking-[0.2em] text-[#ECEEDF]/30 uppercase select-none z-10 px-4 md:px-8 backdrop-blur-[2px] bg-[#0A0A08] ${className}`}
      data-testid="footer"
    >
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>LISTENERS: {listenerCount}</span>
        <span>UPTIME: {formatUptime(uptimeSeconds)}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>EST. 2026</span>
        <span>LONDON, UK</span>
      </div>
    </div>
  );
}
