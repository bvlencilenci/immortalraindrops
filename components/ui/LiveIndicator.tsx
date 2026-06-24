import React from 'react';

export interface LiveIndicatorProps {
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  hasShadow?: boolean;
}

export function LiveIndicator({
  isActive = true,
  size = 'sm',
  className = '',
  hasShadow = false
}: LiveIndicatorProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3.5 h-3.5'
  };

  const bgClass = isActive 
    ? 'bg-red-500 animate-pulse' 
    : 'bg-[#ECEEDF]/25';
    
  const shadowClass = '';

  return (
    <span 
      className={`inline-block rounded-full shrink-0 transition-all duration-300 ${sizeClasses[size]} ${bgClass} ${shadowClass} ${className}`}
      data-testid="live-indicator"
    />
  );
}
