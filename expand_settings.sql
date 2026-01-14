-- Add new columns for Expanded Site Configuration
alter table system_settings 
add column if not exists footer_text text,
add column if not exists contact_email text,
add column if not exists twitter_url text,
add column if not exists instagram_url text,
add column if not exists youtube_url text,
add column if not exists meta_description text,
add column if not exists keywords text;
