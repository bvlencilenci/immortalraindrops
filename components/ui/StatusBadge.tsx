import React from 'react';
import { LiveIndicator } from './LiveIndicator';

export interface StatusBadgeProps {
  isLive: boolean;
  broadcastMode: 'automated' | 'live';
  className?: string;
}

export function StatusBadge({
  isLive,
  broadcastMode,
  className = ''
}: StatusBadgeProps) {
  const showLiveIndicator = isLive || broadcastMode === 'automated';
  
  return (
    <div className={`flex flex-col items-center gap-2 z-10 ${className}`} data-testid="status-badge">
      <div className="flex items-center gap-2">
        <LiveIndicator isActive={showLiveIndicator} size="md" hasShadow={showLiveIndicator} />
        <span className={`text-[11px] tracking-[0.25em] font-normal uppercase transition-colors duration-200 ${
          showLiveIndicator ? 'text-red-500' : 'text-[#ECEEDF]/30'
        }`}>
          {showLiveIndicator ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
      
      <div className="text-[9px] tracking-[0.25em] text-[#ECEEDF]/35 uppercase font-normal select-none mt-1">
        {broadcastMode === 'live' ? 'LIVE DJ SET' : 'AUTOMATED BROADCAST'}
      </div>
    </div>
  );
}
