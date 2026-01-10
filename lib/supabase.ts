import { createClient } from '@supabase/supabase-js';

// NOTE: Ideally these should be in .env.local as NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// I have formatted the values you pasted into valid string literals.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Data fetching may fail.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
