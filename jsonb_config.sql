-- Add config JSONB column for Total Control parameters
alter table system_settings 
add column if not exists config jsonb default '{}'::jsonb;
