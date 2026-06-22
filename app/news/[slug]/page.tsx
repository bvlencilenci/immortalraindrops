import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsArticlePage({ params }: PageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('news_posts')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single();

  if (error || !post) {
    return notFound();
  }

  // Double-check publication status for public visitors
  if (!post.published || (post.published_at && new Date(post.published_at) > new Date())) {
    return notFound();
  }

  const formatPublishDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).toUpperCase();
  };

  const getPublicImageUrl = (path: string) => {
    return `https://${process.env.R2_PUBLIC_DOMAIN || 'assets.immortalraindrops.art'}/${path}`;
  };

  return (
    <main className="min-h-screen bg-black text-[#ECEEDF] font-mono px-4 md:px-12 pt-32 pb-24">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <Link
            href="/news"
            className="text-[10px] tracking-widest text-[#ECEEDF]/40 hover:text-white uppercase transition-colors"
          >
            &larr; BACK_TO_DISPATCHES
          </Link>
        </div>

        <article className="flex flex-col gap-8 border border-[#ECEEDF]/10 p-6 md:p-12 bg-black/60">
          {post.cover_image && (
            <div className="w-full aspect-video bg-black/50 border border-[#ECEEDF]/10 overflow-hidden">
              <img
                src={getPublicImageUrl(post.cover_image)}
                alt={post.title}
                className="w-full h-full object-cover grayscale"
              />
            </div>
          )}

          <div className="flex flex-col gap-4 border-b border-[#ECEEDF]/10 pb-6">
            <div className="flex items-center gap-3 text-[10px] tracking-widest text-[#ECEEDF]/50 uppercase">
              <span>{formatPublishDate(post.published_at)}</span>
              <span>•</span>
              <span className="border border-[#ECEEDF]/20 px-2 py-0.5 text-[9px]">
                [{post.type}]
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tight mt-2">
              {post.title}
            </h1>
          </div>

          <div className="prose prose-invert max-w-none text-[#ECEEDF]/80 text-sm leading-loose tracking-wider font-sans whitespace-pre-wrap">
            {post.body}
          </div>
        </article>
      </div>
    </main>
  );
}
