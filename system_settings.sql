-- Create system_settings table
create table if not exists system_settings (
  id int primary key check (id = 1), -- Singleton row
  site_title text default 'IMMORTAL RAINDROPS',
  maintenance_mode boolean default false,
  global_announcement text,
  allow_registrations boolean default true,
  accent_color text default '#ECEEDF',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Insert default row if not exists
insert into system_settings (id, site_title, maintenance_mode, allow_registrations)
values (1, 'IMMORTAL RAINDROPS', false, true)
on conflict (id) do nothing;

-- RLS
alter table system_settings enable row level security;

-- Allow read access to everyone (public settings)
create policy "Allow public read access"
  on system_settings for select
  using (true);

-- Allow update access only to admins (God Mode)
-- Note: This relies on app logic checking 'is_godmode' before update, 
-- but ideally we should check the user's profile in the policy.
-- For simplicity in this demo, we'll allow authenticated users via policy 
-- but enforce God Mode in the Server Action / App Layer.
-- Better security:
create policy "Allow admin update access"
  on system_settings for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_godmode = true
    )
  );
