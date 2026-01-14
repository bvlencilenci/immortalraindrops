-- Add Anti-Gravity Settings columns
alter table system_settings 
add column if not exists live_broadcast_override boolean default false,
add column if not exists global_grid_scale float default 1.0,
add column if not exists darkness_level float default 0.5;
