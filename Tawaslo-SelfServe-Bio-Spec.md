# Tawaslo — Public Self-Serve Bio Pages (the growth engine) · Build Spec

## 1. Why
Turn the link-in-bio from an agency-only feature into a **public, self-serve product**. Anyone (not just managed clients) signs up and makes a free bio page. Every page carries "Powered by Tawaslo," so each one is a free billboard + backlink — the same loop that grew Linktree, Calendly and Typeform. Goal: thousands of public bio pages → top-of-funnel for the paid agency product.

Re-uses ~70% of what already exists: the `bio_pages` table, the builder UI (themes, socials, location, hours, links, click tracking), and the public `/bio/<slug>` page. The new ~30% is a standalone signup/ownership path.

## 2. User flows

**A. Claim (visitor → owner)**
1. Visitor lands on `tawaslo.com/create`.
2. Types a desired handle → live availability check against `bio_pages.slug`.
3. Clicks "Claim it" → prompted for email (magic-link or email+password via Supabase Auth).
4. On verify, a `bio_pages` row is created, owned by their new auth user, slug reserved.
5. Redirected into the **self-serve builder** (the existing builder, scoped to their page).

**B. Edit (returning owner)**
- Logs in → sees their page(s) in a minimal builder shell (no agency sidebar).

**C. Visitor of a page**
- `tawaslo.com/bio/<slug>` — already built, no change.

## 3. Architecture & reuse

| Piece | Status | Action |
|---|---|---|
| `bio_pages` table | exists | add `owner_user_id`; relax client_id to nullable |
| Builder (themes/socials/links/location/hours) | exists | extract into a shared component usable without a `selClient` |
| Public `/bio/<slug>` page | exists | no change |
| Click tracking RPC | exists | no change |
| Slug availability check | new | `select id from bio_pages where slug = ?` (debounced) |
| `/create` landing | new | public marketing + claim input |
| Self-serve signup | new | Supabase Auth (magic link preferred — lowest friction) |
| Self-serve builder shell | new | minimal chrome around the existing builder |
| Account type flag | new | mark these users `bio_free` so they don't see the agency app |

## 4. Data model changes (SQL)
```sql
alter table bio_pages add column if not exists owner_user_id uuid;            -- the self-serve owner
alter table bio_pages alter column client_id drop not null;                   -- self-serve pages have no agency client
create index if not exists bio_pages_owner_idx on bio_pages(owner_user_id);
-- RLS: a user can read/write rows where owner_user_id = auth.uid(); public can still SELECT (pages are public).
```
Slug stays globally unique (already enforced). Reserve a denylist of slugs (`admin`, `app`, `api`, `login`, `create`, `bio`, `portal`, `a`, `r`, brand terms…).

## 5. Auth
- Use Supabase Auth with **magic link** (email only) for lowest friction; password optional later.
- New self-serve users get app metadata `{ tier: 'bio_free' }`. The main app shell checks this and routes them to the lean builder, never the agency dashboard.
- Existing agency users are unaffected.

## 6. Routes
- `/create` — public landing + claim (new).
- `/bio/<slug>` — public page (exists).
- `/me` (or `/bio-studio`) — the self-serve builder shell behind auth (new).

## 7. Abuse & safety
- Validate slug: `^[a-z0-9_-]{3,30}$`, denylist reserved words.
- Rate-limit page creation per user/IP.
- Basic content checks on public pages (no need for heavy moderation at launch, but add a report link).
- Don't expose any other user's data; RLS scoped to `owner_user_id`.

## 8. Growth mechanics
- "Powered by Tawaslo" on every page → links to `/create` (acquisition) and to the agency product (upsell).
- Soft upsell inside the self-serve builder: "Managing brands? Get the full Tawaslo →".
- Optional later: claimable vanity domains, verified badges, page view stats for owners.

## 9. Phased plan
- **Phase 1 (MVP):** `/create` claim + magic-link signup + owner-scoped builder + live page. (Ship the loop.)
- **Phase 2:** owner dashboard with multiple pages + view analytics for owners; richer onboarding.
- **Phase 3:** upsell funnel to the paid agency product; vanity domains; templates gallery.

## 10. Effort estimate
- Phase 1: ~1 focused build session (auth path + landing + builder extraction + RLS + SQL).
- Lowest-risk approach: build behind a feature flag, test the signup + claim flow end-to-end before linking it from the homepage.

## 11. Out of scope (for v1)
Custom domains, team accounts for free users, payments for free tier, native mobile.
