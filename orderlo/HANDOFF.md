# Orderlo — Full Handoff (self-contained, zero prior context assumed)

> ## 🛑 READ THIS FIRST — HARD RULE, NO EXCEPTIONS
> **Orderlo is being built as its OWN SEPARATE APP. You must NEVER edit, refactor, or "implement Orderlo inside" the live Tawaslo app.**
> - **Do NOT touch** `C:\dev\tawaslo\src\TawasaloApp.js` or `C:\dev\tawaslo\api\*`. That is a LIVE product with paying customers. Changing it can break real businesses.
> - Orderlo is built **from scratch as a standalone app** in its own folder. You may **READ** Tawaslo's code to understand or **COPY** working logic *out* into Orderlo — but you **never modify the original Tawaslo files.**
> - If a plan step seems to require editing the live Tawaslo app, **STOP and ask the user first.** Do not proceed.
> - The eventual "split" (Phase 7) is far in the future and only happens with explicit, careful, non-breaking approval. It is **not** a Phase-1 task.
>
> A fresh session should read this + `orderlo/blueprint.md`. Everything Orderlo lives under `C:\dev\tawaslo\orderlo\`. The live Tawaslo app has **not** been changed for Orderlo, and must not be.

## 1. What Orderlo is
Orderlo is a **venue operating system (SaaS)** for restaurants, cafés, shops, salons and clinics in the Gulf/GCC. It runs a venue's front-of-house admin **over WhatsApp** — digital menu, ordering & pickup, reservations, loyalty, guest CRM, reviews, an AI "concierge" host, and (to build) a real POS + payments. Arabic-first, English-second. Vision: a full, premium, "unicorn-grade" system built carefully and launched only when perfect. It's an **Octo Fusion** product (Manama, Bahrain). Owner email / super-admin: **octofusionbh@gmail.com**.

## 2. Architecture
- Orderlo is a **standalone app**, separate from Tawaslo. ~80% of the venue features already exist inside Tawaslo, so we **read/copy that proven logic OUT into the new Orderlo app** — we do **not** build inside Tawaslo and do **not** edit its files (see the Golden Rule at the top).
- **Tech stack (inherited from Tawaslo):**
  - Frontend: **React**, one giant single-file app: **`C:\dev\tawaslo\src\TawasaloApp.js`** (~21,600+ lines). Language: **JavaScript/JSX**. ⚠️ Fragile, mixed CRLF/LF — **edit ONLY via node string-replace scripts with `count===1` checks; never bulk-edit** (risk of truncation).
  - Styling: inline styles + a light/dark theme object. Orderlo's own look: **light-first** (paper `#F7F4EF`, ink `#1A1B1E`, deep-green accent `#2C6A57`), Georgia serif headings, Inter body, dark-mode via `[data-theme]`.
  - Backend/DB: **Supabase** (Postgres) with **Row-Level Security**.
  - Auth: Supabase auth.
  - Hosting: **Vercel**; serverless functions in **`C:\dev\tawaslo\api\`** (e.g. `meta-publish.js`, `cron.js`, `instagram-oauth.js`, `generate-caption.js` = the WhatsApp concierge webhook endpoint). Vercel Hobby: `export const config = { maxDuration: 60 }`.
  - Build verify (React): `EB=<path>/esbuild; "$EB" src/TawasaloApp.js --loader:.js=jsx --outfile=/dev/null --log-level=error` (exit 0 = OK; does NOT catch undefined component refs; full `--bundle` times out >45s, not needed).
- The **new Orderlo marketing site** built so far is **standalone HTML/CSS** (not React) in `C:\dev\tawaslo\orderlo\`.
- **For the eventual mobile app:** build API-first/clean so it can wrap into an app (React / React Native). Apple publishing needs a company **DUNS number** (free from Dun & Bradstreet, ~5 business days, via Apple's D-U-N-S look-up) + Apple Developer account ($99/yr) + CR. **One DUNS covers all apps**; certificates are generated during the build, not obtained beforehand.

## 3. Relationship to Tawaslo
- **Two products, one system underneath (for now):** **Orderlo** = the host/venue product (`orderlo.store`). **Tawaslo** = the agency/management + social + WhatsApp-marketing product (`tawaslo.com`).
- **Host alone:** signs up on Orderlo, pays for Orderlo (Starter/Pro), runs their venue. No agency needed.
- **Host + agency:** the **host generates a connection CODE** in Orderlo (single-use, expires ~24h); the **agency enters it in Tawaslo** → agency becomes a **manager on the host's workspace**. The host can **revoke** anytime; the host **always owns their data** (revoke only cuts access, deletes nothing). Under the hood it's one DB, so "manage" = a **permission/role + client switcher**, NOT a real API integration and **NOT an API key**.
- **What crosses:** agency gets manager access to the host's venue (menu, orders, reservations) + the host's social. **Billing stays separate** — host pays Orderlo, agency pays Tawaslo; **never double-billed for the same venue**.
- **WhatsApp split:** **Orderlo = automated/operational** WhatsApp (order confirmations, pickup, reservations, concierge). **Tawaslo = WhatsApp marketing** (broadcast/blast; clients connect their own WhatsApp Business API). The WhatsApp go-live work done so far belongs to **Orderlo**.

## 4. Modules — built vs to build
**Already built (in Tawaslo's F&B suite, inside `TawasaloApp.js`):**
- Menu & catalog (per-item toggles, tablet/display mode) ✅
- QR generator (branded QR poster) ✅
- Ordering & pickup (WhatsApp + web ordering, orders board with time/method/notes, floating order AI assistant, customer checkout page) ✅
- Reservations (chat-and-book vs chat-only, reminders) ✅
- Loyalty & win-back ✅
- Guest CRM ✅
- Reviews ✅
- AI Concierge (trainable host — brand voice, greeting, house instructions, capability toggles; business-type aware; usage-metered) ✅
- Reports (pickup, reservations, social) ✅
- Menu payments (built, behind a flag; split-charge backend) ✅
- WhatsApp notification engine (orders + reservations, business-type aware, Pro+ gated) ✅

**To build (new):**
- Occasion/seasonal menus (Ramadan, Eid, Valentine's, National Day — date-scheduled) 🔷
- **POS — Counter mode** (staff ring up walk-in/phone orders, cash/card, receipt) 🔶 medium
- **POS — Full** (floor plan/tables, split bills, kitchen display, shifts, cash reconciliation, hardware: printer/drawer/card reader, offline) 🔴 major
- **Tap Payments** integration (subscription billing + checkout + per-transaction fee) 🔶
- Orderlo-branded host dashboard + onboarding (built fresh in the Orderlo app, reusing copied logic) 🔶
- HQ admin dashboard for Orderlo — largely exists from Tawaslo HQ work (subscribers, MRR, usage/API, support copilot, feature flags, error logging, team & roles) 🔶

## 5. Data model (Supabase — as used by the current Tawaslo/F&B suite)
Key tables (Orderlo currently rides on these; its own dedicated schema is TBD when split out):
- `clients` — venues (has `owner_id`, `name`, `business_type`).
- `booking_settings` — per client; `hours` jsonb holds `concierge_voice`, `concierge_greeting`, `concierge_brief`, `concierge_orders/booking/capture`, plus `slot_minutes`, `capacity`.
- `concierge_usage` — `client_id`, `ym`, `used`, `topup`.
- `orders` — `client_id`, `total`, `items` jsonb, `status`, `created_at`, pickup columns (method/time/notes), `source`.
- `bookings` — `client_id`, `source` (`concierge`/`whatsapp`/`manual`), `starts_at`, `party_size`.
- `link_events` — `client_id`, `kind` (e.g. `menu`), `created_at`.
- `posts` — social; `status`, `scheduled_at`, `appr_token`, `appr_status`, `image_urls`/`slide_captions`/`alt_texts` jsonb.
- `wa_messages` (WhatsApp inbox) + `wa_threads` (conversation memory).
- `tasks` — team tasks (`owner_id`, `assigned_to`, `status`); see `tawaslo-team-tasks.sql`.
- **RLS / isolation:** `public.is_my_workspace(owner_id)` and `public.is_tawaslo_admin()` (checks `octofusionbh@gmail.com`). Per-workspace isolation everywhere.
- Constants in app: `ADMIN_EMAIL='octofusionbh@gmail.com'`; `TRIAL={ai:5, accounts:3, posts:10}`; `trialEnded(email)`. Legacy Concierge plan map (to be replaced by the new pricing below): `PLAN_CHATS={Essential:250, Professional:1000, Enterprise:3000, Studio:8000}`.

## 6. File & folder locations
- **`C:\dev\tawaslo\`** — the Tawaslo workspace (this is the connected/mounted folder; bash path = `/sessions/<id>/mnt/tawaslo/`). Contains the LIVE app:
  - `src\TawasaloApp.js` — the React app + F&B suite.
  - `api\` — Vercel serverless functions.
  - `*.sql` — migrations (`tawaslo-whatsapp.sql`, `whatsapp-setup.sql`, `tawaslo-carousel-schedule.sql`, `tawaslo-team-tasks.sql`, …).
  - WhatsApp docs: `Tawaslo-WhatsApp-MetaReview.md`, `WHATSAPP-TEMPLATES.md`, `Tawaslo-WhatsApp-Screencast-Scripts.md`, `Tawaslo-WhatsApp-Spec.md`; `LAUNCH-STATUS.md`.
  - `tawaslo-brand-assets\` — old Tawaslo promo images (moved out of Orderlo).
- **`C:\dev\tawaslo\orderlo\`** — ALL Orderlo assets (self-contained, separate):
  - `README.md` — folder index.
  - `blueprint.md` — **the master business & build plan** (read this).
  - `HANDOFF.md` — this document.
  - `index.html`, `product.html`, `pricing.html`, `agencies.html` — the multi-page marketing site (light-first, dark toggle, Option-F logo).
  - `brand\`:
    - `orderlo-brand-guidelines.html` — full brand guide.
    - `orderlo-logo-export.html` — open in a browser on Windows/Mac to download logo PNGs rendered in **real Georgia** (canvas exporter).
    - `orderlo-logo-ink.svg/.png`, `orderlo-logo-white.svg`, `orderlo-logo-white-on-black.png` — full lockup.
    - `orderlo-mark-ink.svg/.png`, `orderlo-mark-white.svg`, `orderlo-mark-white-on-black.png` — the "O" alone.
    - `orderlo-appicon-black.svg/.png` (rounded-square), `orderlo-avatar-black.svg/.png` (circle — Instagram DP).
  - `archive\` — older single-page versions (`orderlo-landing.html`, `orderlo-logos.html`).

## 7. Phase 1 — scope & "done"
**Phase 1 = start Orderlo as its OWN brand-new standalone app** (its own project/folder), reusing Tawaslo's proven venue logic by **reading/copying it out** — **without ever editing the live Tawaslo app.** Build the Orderlo shell: its own auth, host dashboard, nav, and the first module (recommend Menu, then Ordering/Pickup), styled in the Orderlo brand.
**Done =** a host can sign up to a **separate Orderlo app** and use the first module(s) end-to-end; the **live Tawaslo app is 100% untouched**; no AI tells / no fake data; build-verified; user-approved.
(Do **not** "skin the existing Tawaslo app in place" — that misreading caused real alarm. Orderlo is separate. Copy code out; never modify Tawaslo.)

## 8. Brand / domain / naming
- **Name:** Orderlo (chosen over "Orderloo" — "loo" = toilet; over Arabic names; over many taken/premium .coms). ⚠️ A trademark / existing-company check on "Orderlo" has **not** been done yet — do it before full commitment.
- **Domains:** **`orderlo.store`** — BOUGHT on Namecheap (~$0.98/yr; the `.com` is a $4,799 premium, not bought). Sibling: **`tawaslo.com`**. Planned **per-client subdomains**: `marinacafe.orderlo.store` (the eatapp `restaurant.eatapp.com` model).
- **Logo:** an **aperture "O"** (open ring, gap upper-left) used as the **first letter** of the "Orderlo" wordmark ("Option F"). **Monochrome** — ink on light, white on dark; accent green never on the logo. Wordmark set in **Georgia** (system serif; possible future upgrade to an embeddable serif like Fraunces/Lora for exact cross-device consistency).
- **Colours:** Paper `#F7F4EF` · Ink `#1A1B1E` · Accent green `#2C6A57` (buttons/links only) · Surface `#FFFFFF` · Muted `#5C5A53` · Line `#E6E0D6` · WhatsApp `#128C4B` · dark bg `#0E1013` · dark accent `#3E9077`.
- **Type:** Georgia (Times/DejaVu are NOT the brand — Georgia is) headings, Inter body.
- **Voice:** warm, plain, specific, GCC. Hero line: *"Take the order. Hold the table. Keep the regular."* **No emojis in UI (hard rule), no buzzwords, no fake data, no "Claude/AI" tells.**
- **Website:** **light-first with a dark-mode toggle; NOT a one-pager (multi-page).**
- **Footer:** "An Octo Fusion product · Manama, Bahrain."

## 9. Decisions & constraints
**Pricing / monetization (FINAL):**
- **Orderlo (host):** *Starter* (free 14-day trial) → *Pro* (fixed price, per venue). Hosts always buy their own.
- **Tawaslo (management):** *Freelancer*, *Professional* (Agencies), *Enterprise* (Brands), *Partner* (custom / talk-to-us). **No free tier. "Studio" REMOVED.**
- **Coupons (growth lever):** each Tawaslo plan includes coupons; **1 coupon = 3 months of Orderlo free** for one client venue. Counts: **Freelancer 1 · Professional 3 · Enterprise 5 · Partner custom.** **Refresh yearly.** At redemption the venue puts a **card on file** → auto-converts to paid after 3 months.
- **One venue = one Orderlo bill** (the host's); coupon just discounts to zero for 3 months. Payer can transfer if a venue leaves an agency.
- **Payments:** **Tap Payments** — subscription billing + online/POS checkout + a **small per-transaction fee** (the real margin engine; even free-coupon venues earn the fee).
- Actual BD prices per tier: **not set yet** (placeholders on the site).
**WhatsApp model:** Orderlo's **shared number by default** (sender shows *Orderlo*, message always names the venue — "Marina Café: your order's ready"); free marketing + zero setup; **connect-your-own-number = paid upgrade**; run multiple Orderlo numbers as volume grows.
**Quality bar ("perfect"):** **NEVER edit the live Tawaslo app** — build Orderlo separately, copy proven logic out; **no AI tells / no emoji / no fake data**; real data only; build-verified each change; **user approves before shipping**; existing Tawaslo subscribers stay 100% untouched. Build **slowly, small chunks, simple explanations**.

**WhatsApp go-live status (belongs to Orderlo):** Meta app "Tawaslo" (App ID 1652475822681144), business verified (Tech Provider). Number **+973 6660 0234** registered & verified (display name "Tawaslo", Professional Services, Bahrain). Payment method added (Visa ···6055). Template `order_received` submitted (in review); `hello_world` approved. **Still to do:** record 2 screencasts, submit `whatsapp_business_messaging` + `whatsapp_business_management` for Advanced Access, set `WHATSAPP_*` env vars in Vercel, point Meta webhook (`messages` field) at `https://tawaslo.com/api/generate-caption`.

## 10. Open questions / TODOs
1. **Update `orderlo/pricing.html`** — still shows old Starter/Pro/**Studio**; change Orderlo to just **Starter + Pro**, remove Studio, add an "Agencies & Brands → Tawaslo" pointer.
2. **Trademark / existing-company check on "Orderlo"** — not done.
3. **Brand font decision** — keep system Georgia, or adopt an embeddable serif (Fraunces/Lora) so site + logo PNGs match exactly everywhere.
4. **Phase 1 is DECIDED:** build Orderlo as a fresh **standalone app** (NOT skinning Tawaslo, NOT editing it). No open question here.
5. **Orderlo's own data model** — dedicated tables/schema for when it splits from Tawaslo (TBD).
6. **Set real tier prices** (BD).
7. **Build:** occasion menus; POS (counter → full); Tap Payments; Orderlo-branded onboarding; coupon system (yearly-refresh logic).
8. **Finish WhatsApp go-live** (see status above).
9. **Apple:** obtain company **DUNS**, then Apple Developer account, for the future app.
