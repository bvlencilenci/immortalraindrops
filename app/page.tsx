import { createClient } from '@/lib/supabase-server';
import { NewsFeed } from '@/components/NewsFeed';
import { NewsItem } from '@/components/NewsEntry';

export const revalidate = 0; // Ensures fresh data for now, or you can rely on on-demand revalidation

export default async function Home() {
  const supabase = await createClient();
  
  const { data: posts } = await supabase
    .from('news')
    .select('*')
    .eq('visible', true)
    .order('published_at', { ascending: false })
    .limit(20);

  return (
    <main className="flex-1 w-full bg-black overflow-y-auto">
      <NewsFeed posts={(posts as NewsItem[]) || []} />
    </main>
  );
}
