'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface NewsPost {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: 'draft' | 'published';
  pinned?: boolean;
  published_at?: string | null;
  body?: string;
  type?: 'news' | 'release' | 'event' | 'editorial';
  cover_image?: string;
  featured?: boolean;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : 'Unknown error'
);

// Helper: Verify Admin Role
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_godmode')
    .eq('id', user.id)
    .single();

  if (!profile?.is_godmode) {
    throw new Error('Forbidden: Godmode Access Required');
  }
}

export async function getAdminNewsPosts() {
  try {
    await verifyAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('news_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, posts: data };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function createNewsPost(post: NewsPost) {
  try {
    await verifyAdmin();
    const supabase = await createClient();

    if (post.pinned) {
      await supabase
        .from('news_posts')
        .update({ pinned: false, featured: false })
        .eq('pinned', true);
    }

    const { data, error } = await supabase
      .from('news_posts')
      .insert([
        {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || null,
          content: post.content,
          status: post.status,
          pinned: post.pinned || false,
          published_at: post.status === 'published' ? (post.published_at || new Date().toISOString()) : (post.published_at || null),
          body: post.content,
          type: post.type || 'news',
          cover_image: post.cover_image || null,
          featured: post.pinned || false,
          published: post.status === 'published',
        }
      ])
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/news');
    revalidatePath('/');
    return { success: true, post: data };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateNewsPost(id: string, post: Partial<NewsPost>) {
  try {
    await verifyAdmin();
    const supabase = await createClient();

    const updates: Record<string, unknown> = { ...post };
    delete updates.id;
    delete updates.created_at;

    if (typeof post.content === 'string') {
      updates.body = post.content;
    }

    if (post.status) {
      updates.published = post.status === 'published';
      if (post.status === 'published' && !updates.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }

    if (typeof post.pinned === 'boolean') {
      updates.featured = post.pinned;
    }

    updates.updated_at = new Date().toISOString();

    if (post.pinned) {
      await supabase
        .from('news_posts')
        .update({ pinned: false, featured: false })
        .neq('id', id);
    }

    const { data, error } = await supabase
      .from('news_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/news');
    revalidatePath(`/news/${data.slug}`);
    revalidatePath('/');
    return { success: true, post: data };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteNewsPost(id: string, slug?: string) {
  try {
    await verifyAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from('news_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/news');
    if (slug) revalidatePath(`/news/${slug}`);
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}
