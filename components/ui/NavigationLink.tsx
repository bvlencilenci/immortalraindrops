import React from 'react';
import Link from 'next/link';

export interface NavigationLinkProps {
  label: string;
  href: string;
  isActive?: boolean;
  className?: string;
  isLive?: boolean;
}

export function NavigationLink({
  label,
  href,
  isActive = false,
  className = '',
  isLive = false
}: NavigationLinkProps) {
  return (
    <Link 
      href={href} 
      className={`shrink-0 flex justify-center items-center font-mono text-xs xs:text-sm uppercase tracking-widest transition-colors duration-200 border border-transparent px-3 py-3 rounded-xl text-[#ECEEDF] hover:text-white ${className}`}
    >
      <span className={`${isActive ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70'} transition-all duration-200`}>[</span>
      <span className="flex items-center gap-1">
        {isLive && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
        <span className={`mx-2 ${isActive ? 'text-white' : ''} transition-colors duration-200`}>{label}</span>
      </span>
      <span className={`${isActive ? 'font-bold text-white' : 'font-light text-[#ECEEDF]/70'} transition-all duration-200`}>]</span>
    </Link>
  );
}
