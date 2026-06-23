const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('/Users/ruslangilmanov/immortalraindrops/.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearDatabaseSeeding() {
  console.log("Resetting system_settings table row 1 to defaults...");
  const { data, error } = await supabase
    .from('system_settings')
    .update({
      is_live: false,
      stream_title: 'OFFLINE',
      playback_history: []
    })
    .eq('id', 1)
    .select();

  if (error) {
    console.error("Supabase Reset Error:", error);
  } else {
    console.log("Success! Reset data:", data);
  }
}

clearDatabaseSeeding();
