'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

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

export async function getHomepageSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('hero_mode, featured_release_id, featured_news_id, featured_artist, custom_hero_title, custom_hero_text, show_news_on_homepage, announcement_banner, announcement_enabled')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching homepage settings:', error);
    return null;
  }
  return data;
}

export async function updateHomepageSettings(payload: {
  hero_mode: 'featured_release' | 'featured_news' | 'featured_artist' | 'custom';
  featured_release_id?: string | null;
  featured_news_id?: string | null;
  featured_artist?: string | null;
  custom_hero_title?: string | null;
  custom_hero_text?: string | null;
  show_news_on_homepage: boolean;
  announcement_banner?: string | null;
  announcement_enabled: boolean;
}) {
  try {
    await verifyAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('system_settings')
      .update({
        hero_mode: payload.hero_mode,
        featured_release_id: payload.featured_release_id || null,
        featured_news_id: payload.featured_news_id || null,
        featured_artist: payload.featured_artist || null,
        custom_hero_title: payload.custom_hero_title || null,
        custom_hero_text: payload.custom_hero_text || null,
        show_news_on_homepage: payload.show_news_on_homepage,
        announcement_banner: payload.announcement_banner || null,
        announcement_enabled: payload.announcement_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (error) throw error;

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getHomepageCMSOptions() {
  try {
    await verifyAdmin();
    const supabase = await createClient();

    const [tracksRes, newsRes] = await Promise.all([
      supabase
        .from('tracks')
        .select('id, title, artist')
        .order('release_date', { ascending: false }),
      supabase
        .from('news_posts')
        .select('id, title')
        .order('created_at', { ascending: false })
    ]);

    return {
      success: true,
      tracks: tracksRes.data || [],
      news: newsRes.data || []
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
