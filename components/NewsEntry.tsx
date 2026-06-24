import React from 'react';
import Link from 'next/link';

export interface NewsPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  type: 'news' | 'release' | 'event' | 'editorial';
  cover_image: string | null;
  featured: boolean;
  published_at: string;
}

export function NewsEntry({ item }: { item: NewsPostItem }) {
  const date = new Date(item.published_at);
  const formattedDate = date.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric'
  }).toUpperCase();

  const getPublicImageUrl = (path: string) => {
    return `https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'pub-83e39df2389c4bef95c442c0e0c6a8ad.r2.dev'}/${path}`;
  };

  return (
    <div className="flex flex-col gap-3 border-b border-[#ECEEDF]/10 pb-8 mb-8 text-[#ECEEDF] uppercase">
      <div className="flex flex-row items-center gap-4 text-[10px] tracking-[0.2em] text-[#ECEEDF]/40 select-none">
        <span>DISPATCH // {formattedDate}</span>
        <span>// [ {item.type} ]</span>
        {item.featured && <span className="text-red-500 font-bold">// [ FEATURED ]</span>}
      </div>

      {item.cover_image && (
        <div className="w-full aspect-video bg-black/40 border border-[#ECEEDF]/10 overflow-hidden mb-2">
          <img 
            src={getPublicImageUrl(item.cover_image)} 
            alt={item.title} 
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
          />
        </div>
      )}

      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-wider leading-tight text-white transition-colors duration-100">
        <Link href={`/news/${item.slug}`}>
          {item.title}
        </Link>
      </h2>

      {item.excerpt && (
        <p className="text-sm tracking-normal leading-relaxed text-[#ECEEDF]/60 mt-2 font-sans normal-case">
          {item.excerpt}
        </p>
      )}

      <Link 
        href={`/news/${item.slug}`}
        className="mt-4 inline-block text-[10px] font-bold tracking-[0.3em] border border-[#ECEEDF]/30 hover:border-[#ECEEDF] hover:bg-[#ECEEDF] hover:text-black transition-colors px-5 py-2 w-fit"
      >
        READ_DISPATCH
      </Link>
    </div>
  );
}
