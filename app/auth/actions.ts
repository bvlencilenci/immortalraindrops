'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Service Role Client (Bypasses RLS)
const supabaseAdmin = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { cookies: { getAll: () => [], setAll: () => { } } }
);

export async function ensureProfile(username?: string) {
  const cookieStore = await cookies();

  // 1. Verify User Session (Standard Client)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { }
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'User not logged in' };
  }

  // 2. Check if Profile Exists (Admin Client)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profile) {
    return { success: true, message: 'Profile already exists' };
  }

  // 3. Create Profile if Missing (Admin Client)
  // Fallback username if not provided
  const finalUsername = username || user.user_metadata?.username || `user_${user.id.substring(0, 8)}`;

  const { error: insertError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: user.id,
      username: finalUsername,
      role: 'user', // Default
      avatar_url: user.user_metadata?.avatar_url
    });

  if (insertError) {
    console.error('ensureProfile failed:', insertError);
    return { success: false, error: insertError.message };
  }

  return { success: true, message: 'Profile created via fallback' };
}
