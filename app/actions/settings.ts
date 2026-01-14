'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getSystemSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
  return data;
}

export async function updateSystemSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Check God Mode
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_godmode')
    .eq('id', user.id)
    .single();

  if (!profile?.is_godmode) {
    return { error: 'Access Denied: God Mode Required' };
  }

  const updates = {
    site_title: formData.get('site_title') as string,
    width_maintenance_mode: formData.get('maintenance_mode') === 'on', // Checkbox handling
    maintenance_mode: formData.get('maintenance_mode') === 'on',
    global_announcement: formData.get('global_announcement') as string,
    allow_registrations: formData.get('allow_registrations') === 'on',
    accent_color: formData.get('accent_color') as string,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('system_settings')
    .update(updates)
    .eq('id', 1);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout'); // Revalidate everything
  return { success: true };
}
