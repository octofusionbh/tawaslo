-- ============================================================
-- Tawaslo — F&B monthly report (secure aggregate function for the public report page).
-- Returns only aggregated numbers (no customer PII). Paste into Supabase → SQL Editor → Run.
-- ============================================================
create or replace function public.fnb_report(p_slug text)
returns json language plpgsql security definer set search_path = public as $$
declare v_client uuid; v_cur text; v_name text; v_logo text; v_ym text; r json;
begin
  select client_id, currency into v_client, v_cur from menus where slug = p_slug limit 1;
  if v_client is null then return null; end if;
  select name, logo_url into v_name, v_logo from clients where id = v_client limit 1;
  v_ym := to_char(now(), 'YYYY-MM');
  select json_build_object(
    'name', v_name,
    'logo', v_logo,
    'currency', coalesce(v_cur, 'BHD'),
    'month', to_char(now(), 'Mon YYYY'),
    'orders',        (select count(*)             from orders where client_id = v_client and status <> 'cancelled' and created_at >= date_trunc('month', now())),
    'revenue',       (select coalesce(sum(total),0) from orders where client_id = v_client and status <> 'cancelled' and created_at >= date_trunc('month', now())),
    'bookings',      (select count(*)             from bookings where client_id = v_client and source in ('whatsapp','concierge') and starts_at >= date_trunc('month', now())),
    'covers',        (select coalesce(sum(party_size),0) from bookings where client_id = v_client and starts_at >= date_trunc('month', now())),
    'menu_opens',    (select count(*)             from link_events where client_id = v_client and kind = 'menu' and created_at >= date_trunc('month', now())),
    'conversations', (select coalesce(used,0)     from concierge_usage where client_id = v_client and ym = v_ym),
    'rating',        (select round(avg(rating)::numeric, 1) from reviews where client_id = v_client),
    'reviews',       (select count(*)             from reviews where client_id = v_client),
    'new_guests',    (select count(*)             from guests where client_id = v_client and created_at >= date_trunc('month', now())),
    'top_items',     (select coalesce(json_agg(t), '[]'::json) from (
                        select it->>'name' as name, sum((it->>'qty')::numeric) as qty
                        from orders o, jsonb_array_elements(o.items) it
                        where o.client_id = v_client and o.status <> 'cancelled' and o.created_at >= date_trunc('month', now())
                        group by it->>'name' order by qty desc limit 5) t)
  ) into r;
  return r;
end; $$;
grant execute on function public.fnb_report(text) to anon, authenticated, service_role;
