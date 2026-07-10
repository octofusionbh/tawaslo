-- Tawaslo HQ — let invited staff into the admin console.
-- Adds an 'hq' flag to team_members. When the founder invites someone from the
-- HQ Team page, hq=true, which lets that person enter the admin console (owner
-- mode) with their role. Regular agency invites stay hq=false. Neither touches billing.
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.

alter table public.team_members add column if not exists hq boolean not null default false;
