'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Service Role Client (Bypasses RLS)
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment.');
}

const supabaseAdmin = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { cookies: { getAll: () => [], setAll: () => { } } }
);

export async function ensureProfile(username?: string, accessToken?: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Server Config Error: SUPABASE_SERVICE_ROLE_KEY missing.' };
  }

  const cookieStore = await cookies();

  // 1. Verify User Session
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

  // If token provided, verify specifically with that token (avoids cookie race condition)
  const { data: { user }, error: userError } = accessToken
    ? await supabase.auth.getUser(accessToken)
    : await supabase.auth.getUser();

  if (userError || !user) {
    console.error('ensureProfile: User verification failed', userError);
    return { success: false, error: 'User verification failed: ' + (userError?.message || 'No session') };
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
  console.log('ensureProfile: Creating missing profile for', user.id);
  console.log('ensureProfile: Input username:', username);

  const finalUsername = username || user.user_metadata?.username || `user_${user.id.substring(0, 8)}`;
  console.log('ensureProfile: Final username:', finalUsername);

  const { error: insertError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: user.id,
      username: finalUsername,
      email: user.email, // Sync email if available via user object (auth.users)
      is_godmode: false
    });

  if (insertError) {
    console.error('ensureProfile failed:', insertError);
    return { success: false, error: insertError.message };
  }

  return { success: true, message: 'Profile created via fallback', username: finalUsername };
}

export async function resolveEmailFromUsername(username: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Server Config Error: SUPABASE_SERVICE_ROLE_KEY missing.' };
  }

  // 1. Find the User ID associated with this username
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    // If not found, return null (generic error on frontend)
    console.warn(`resolveEmailFromUsername: Username '${username}' not found.`);
    return { success: false, email: null };
  }

  // 2. Get the User's Email from Auth (Admin Only)
  const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

  if (userError || !user) {
    console.error(`resolveEmailFromUsername: User found in profiles but not auth? ID: ${profile.id}`);
    return { success: false, email: null };
  }

  return {
    success: true,
    email: user.email,
    isVerified: !!user.email_confirmed_at
  };
}


