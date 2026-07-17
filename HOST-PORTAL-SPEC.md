# Tawaslo — Host Portal (venue self-service login)

**Goal:** the restaurant owner gets their own login to Tawaslo, scoped to only their venue, to manage everything about their business — on any device (computer, laptop, tablet, phone). The agency stays on top as the setup/support/manager layer. Nobody knows the venue better than the host.

**Status:** planned. This is an auth/permissions feature, so it's built deliberately with a security review — not rushed.

---

## Two tiers (one already built)

**Tier 1 — Staff order board (DONE).** Login-free link `tawaslo.com/k/<token>` (copy from Pickup Orders → "Staff board"). Live orders, move New → Preparing → Ready → Collected. Any device. For counter/kitchen staff who just fulfill orders. No password.

**Tier 2 — Host portal (this spec).** The owner logs in with their own account and manages the full venue.

---

## What the host sees (full self-service)

Scoped to their one venue, on any device:

- **Menu** — add/edit dishes, prices, photos, availability, categories & reorder, pickup settings, layout (grid/list), pre-order lead times, special-request toggles
- **Orders** — full pickup board: live + history, status, notes, car-hop details
- **Reservations** — table bookings
- **Loyalty** — their loyalty program
- **Reviews** — customer reviews
- **Guests** — guest / CRM data
- **Fill My Tables** — quiet-time campaigns
- **Analytics** — their venue's numbers
- **Business profile & settings** — hours, info, their own account

What they never see: the agency side, other clients, social publishing/scheduling, or HQ.

---

## Architecture (the careful part)

**1. Membership model.** New table `venue_members (user_id, client_id, role, created_at)`. A host is a row linking their login to one venue. Roles: `owner` (full), later maybe `manager` / `staff` (narrower).

**2. Invite flow.** From the agency's Clients (or Team) page: "Invite venue owner" → enter email → branded email → they set a password → a `venue_members` row links them to that client.

**3. Login scoping.** On load, if the user is in `venue_members`, the app enters "venue mode": auto-selects their venue, shows only the F&B nav above, hides everything agency/social/HQ, and blocks switching to other clients. (Reuses the existing role-based nav filtering — same mechanism as the HQ/owner nav.)

**4. Data security (RLS) — the critical piece.** Today, a client's data is reachable only by the agency that owns it (`clients.owner_id = auth.uid()`). We extend every venue-data table's policy to ALSO allow a user who is a `venue_member` of that client:
`... OR exists (select 1 from venue_members v where v.client_id = <table>.client_id and v.user_id = auth.uid())`
Applied to: menus, menu_items, orders, bookings, loyalty, reviews, guests, analytics, link_events. This guarantees a host can only ever touch their own venue's rows — never another restaurant's.

**5. Agency stays on top.** The agency keeps full access to all its clients (unchanged). The host is additive, not a replacement.

---

## Build order (each verified before the next)

1. **SQL:** `venue_members` table + RLS policy updates across venue-data tables. *(security review here)*
2. **Invite flow:** "Invite venue owner" in the agency app + email + accept/set-password linking to `venue_members`.
3. **Login scoping:** venue mode — auto-select venue, F&B-only nav, no client switching.
4. **QA pass:** log in as a test venue owner, confirm they see only their data and nothing else; confirm the agency still sees everything; attempt cross-venue access and confirm it's blocked.

---

## Notes
- The whole thing is the same responsive web app, so "works on their computer/laptop/phone" is automatic — it's a scoped view, not a separate app.
- No impact on the customer-facing pages (menu/order) or the staff board — those stay as they are.
- Recommend a security review (subagent) on the RLS step before it goes live, since it's the piece that separates one restaurant's data from another's.
