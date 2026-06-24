import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';

export const revalidate = 0;

export default async function NewsIndexPage() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from('news_posts')
    .select('*')
    .eq('published', true)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching news:', error);
  }

  const formatPublishDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  const getPublicImageUrl = (path: string) => {
    return `https://${process.env.R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${path}`;
  };

  return (
    <main className="min-h-screen bg-black text-[#ECEEDF] font-mono px-4 md:px-12 pt-32 pb-24">
      <div className="max-w-4xl mx-auto flex flex-col gap-12">
        <div className="border-b border-[#ECEEDF]/20 pb-6 flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-[0.25em]">
            DISPATCHES
          </h1>
          <p className="text-[#ECEEDF]/40 text-xs tracking-widest uppercase">
            Intercepted updates, releases, and manifestos
          </p>
        </div>

        {(!posts || posts.length === 0) ? (
          <div className="text-[#ECEEDF]/30 uppercase text-xs tracking-widest py-12">
            NO ACTIVE TRANSMISSIONS FOUND.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10">
            {posts.map((post) => (
              <article
                key={post.id}
                className="border border-[#ECEEDF]/10 hover:border-[#ECEEDF]/30 transition-all p-6 md:p-8 bg-black/40 flex flex-col md:flex-row gap-6 md:gap-8"
              >
                {post.cover_image && (
                  <div className="w-full md:w-1/3 aspect-video md:aspect-square bg-black/50 border border-[#ECEEDF]/10 overflow-hidden shrink-0">
                    <img
                      src={getPublicImageUrl(post.cover_image)}
                      alt={post.title}
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-[10px] tracking-widest text-[#ECEEDF]/50 uppercase">
                      <span>{formatPublishDate(post.published_at)}</span>
                      <span>•</span>
                      <span className="border border-[#ECEEDF]/20 px-2 py-0.5 text-[9px]">
                        [{post.type}]
                      </span>
                      {post.featured && (
                        <span className="text-[#FF0000] text-[9px] font-bold">
                          [FEATURED]
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold uppercase tracking-tight hover:text-white transition-colors mt-2">
                      <Link href={`/news/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt && (
                      <p className="text-[#ECEEDF]/70 text-xs leading-relaxed tracking-wider font-playfair mt-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/news/${post.slug}`}
                      className="inline-block text-[10px] font-bold tracking-[0.2em] border border-[#ECEEDF]/30 hover:border-[#ECEEDF] hover:bg-[#ECEEDF] hover:text-black transition-all px-4 py-2"
                    >
                      READ_TRANSMISSION
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
