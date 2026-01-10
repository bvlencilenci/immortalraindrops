import { createClient } from '@supabase/supabase-js';

// NOTE: Ideally these should be in .env.local as NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// I have formatted the values you pasted into valid string literals.
const supabaseUrl = 'https://ajbkuiyhpoiuezsittpy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYmt1aXlocG9pdWV6c2l0dHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTIzMDUsImV4cCI6MjA4MzU2ODMwNX0.l4yJF4L0zvDwSw1XQJqdj3q0AXwg_qJ_KgDuDoOvjLM';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Data fetching may fail.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
