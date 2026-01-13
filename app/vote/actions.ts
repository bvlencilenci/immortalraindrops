'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function vote(trackId: string, value: 1 | -1) {
  const cookieStore = await cookies();

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Please login first' };
  }

  // Check if vote exists
  const { data: existingVote } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user.id)
    .eq('track_id', trackId)
    .single();

  if (existingVote) {
    if (existingVote.vote_type === value) {
      // Toggle off (delete)
      await supabase.from('votes').delete().eq('id', existingVote.id);
    } else {
      // Change vote (update)
      await supabase.from('votes').update({ vote_type: value }).eq('id', existingVote.id);
    }
  } else {
    // Insert new vote
    const { error } = await supabase.from('votes').insert({
      user_id: user.id,
      track_id: trackId,
      vote_type: value,
    });

    if (error) {
      console.error('Vote Error:', error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath('/');
  revalidatePath('/archive');
  return { success: true };
}
