-- Tawaslo — three columns the app expects that this project never got.
-- Each one comes from a migration file already in the repo that was never run
-- on the new project. All three are additive, nullable and safe to run twice;
-- nothing existing is changed or dropped.

-- Monthly report scheduling (from tawaslo-monthly-reports.sql).
-- Without these the "email me this report every month" option stays hidden.
alter table public.clients    add column if not exists auto_report  boolean default false;
alter table public.clients    add column if not exists report_email text;

-- Menu item add-ons (from tawaslo-menu-addons.sql).
-- Without this the AI concierge reads an empty menu, because asking for a
-- column that does not exist makes the whole menu query fail.
alter table public.menu_items add column if not exists addons jsonb default '[]'::jsonb;
