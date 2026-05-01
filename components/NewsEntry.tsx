import React from 'react';

export interface NewsItem {
  id: string;
  created_at: string;
  published_at: string;
  category: 'GIG' | 'RELEASE' | 'DROP' | 'NEWS' | 'UPDATE';
  headline: string;
  body: string | null;
  link: string | null;
  link_label: string | null;
  visible: boolean;
}

export function NewsEntry({ item }: { item: NewsItem }) {
  const date = new Date(item.published_at);
  const formattedDate = date.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric'
  }).toUpperCase();

  return (
    <div className="flex flex-col gap-3 border-b border-[#ECEEDF]/20 pb-8 mb-8 font-mono text-[#ECEEDF] uppercase">
      <div className="flex flex-row items-center gap-4 text-[10px] tracking-[0.2em] opacity-60">
        <span>{formattedDate}</span>
        <span>[ {item.category} ]</span>
      </div>
      <h2 className="text-xl md:text-2xl font-bold tracking-tighter leading-none">
        {item.headline}
      </h2>
      {item.body && (
        <p className="text-[13px] tracking-widest leading-relaxed opacity-80 mt-2 whitespace-pre-wrap">
          {item.body}
        </p>
      )}
      {item.link && (
        <a 
          href={item.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-6 inline-block text-[11px] font-bold tracking-[0.3em] border border-[#ECEEDF] px-6 py-3 hover:bg-[#ECEEDF] hover:text-black transition-colors w-fit"
        >
          {item.link_label || 'VIEW LINK'}
        </a>
      )}
    </div>
  );
}
