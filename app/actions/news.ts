'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface NewsPost {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  type: 'news' | 'release' | 'event' | 'editorial';
  cover_image?: string;
  featured?: boolean;
  published?: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createNewsPost(post: NewsPost) {
  try {
    await verifyAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('news_posts')
      .insert([
        {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || null,
          body: post.body,
          type: post.type,
          cover_image: post.cover_image || null,
          featured: post.featured || false,
          published: post.published || false,
          published_at: post.published ? (post.published_at || new Date().toISOString()) : (post.published_at || null),
        }
      ])
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/news');
    revalidatePath('/');
    return { success: true, post: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateNewsPost(id: string, post: Partial<NewsPost>) {
  try {
    await verifyAdmin();
    const supabase = await createClient();

    const updates: Record<string, any> = { ...post };
    delete updates.id;
    delete updates.created_at;
    updates.updated_at = new Date().toISOString();

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
  } catch (error: any) {
    return { success: false, error: error.message };
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
