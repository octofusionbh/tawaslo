# TAWASLO — PROJECT STATUS & HANDOFF

**Read this first in any new chat to catch up.** It's the single source of truth for what's built, what's pending, and how to work on this app. Update it as things change.

Tawaslo = Arabic-first social-media management + restaurant/F&B (and merchant) SaaS. Owner: Abdulla / Octo Fusion. Competitors to remember: Hootsuite, EatApp, Shopify. Goal: worldwide, not just GCC.

---

## DESIGN SYSTEM (LOCKED — apply IDENTICALLY to every room)
Editorial system, theme-aware. Same parts on every page so all rooms feel like ONE product (Abdulla's rule: no per-page bespoke designs). **Reference implementation = `CommandCenterPage`** — copy its patterns.

**Two modes (auto via `th = dark ? DARK : LIGHT`):**
- **Dark = default:** ink canvas, `th` dark tokens.
- **Light = toggle:** warm cream/paper editorial (matches Tawaslo's client proposals). NOTE: to make light mode truly warm-cream, the global LIGHT theme tokens still need warming — PENDING.

**Brand color: SLATE ONLY** = `th.accent` (`#6E8CAB` dark / `#4F6B8C` light). No purple, no teal/emerald. Amber/coral/green ONLY for semantic status (need / fail / fire, up / down).

**The kit — reuse these exact parts on every room:**
- **Masthead:** linked-circles mark + tracked UPPERCASE section label (slate) left, date/context right, hairline rule under it.
- **Page title:** Fraunces serif ~29px/600; optional serif-italic subline that states the situation in words.
- **Stat rule:** metrics in a hairline top+bottom row (NOT boxed cards), serif tabular numbers, tiny tracked uppercase labels.
- **Lists:** hairline-separated rows (no cards). Ranked lists use a FIXED numeral gutter (width 22, right-aligned, tabular) so names always align; wrapped text hangs under the name.
- **Type:** Fraunces serif for names/titles/numbers; system sans for body/meta; serif-italic for the single "voice" line. Two weights.
- **Restraint:** hairlines + whitespace, not boxes everywhere. One accent (slate). Tabular figures for ALL numbers.
- **Signature:** the two-linked-circles mark recurs quietly.

**Avoid the "AI look":** no uniform card grids, no tinted alert-callout boxes, no purple, no per-page bespoke layouts.

---

## HOW TO WORK ON THIS APP (rules for any chat)
- Main app is ONE file: `src/TawasaloApp.js` (~20k lines, MIXED line endings CRLF/LF). It is fragile — the Edit/Write tools can truncate it. **Edit it with small `node` string-replace scripts** that try LF then CRLF matching, and verify uniqueness (count===1) before writing.
- APIs are in `api/*.js` (Vercel serverless, 12-function cap — fold new features into existing files, don't add new ones).
- **Verify every change:** app → `npx esbuild src/TawasaloApp.js --bundle --outfile=/dev/null --loader:.js=jsx --loader:.css=empty --log-level=error` (exit 0); APIs → `node --check api/<file>.js`.
- Supabase backend (Postgres + RLS). Auth via Supabase. Anthropic (Claude) + Gemini for AI. Resend for email. Tap for payments (not live yet). WhatsApp Cloud API folded into `api/meta-publish.js` (+ `api/cron.js` for notifications).

---

## SPEC / DOC FILES IN THIS REPO (read as needed)
- `HOST-PORTAL-SPEC.md` — venue self-service login plan (task #48, NOT built yet).
- `LOYALTY-WALLET-SPEC.md` — Apple/Google Wallet loyalty (task #43, NOT built yet).
- `WHATSAPP-TEMPLATES.md` — the 11 WhatsApp templates to submit to Meta.
- `TEST-CHECKLIST.md` — how to test the pickup/publish batch.

---

## BUILT THIS SESSION — code-complete, builds clean, NEEDS PUSH + SQL
1. **Publishing fix** (brace/module bug) + IG tagging/location.
2. **Pickup ordering system** — checkout (day/time picker w/ opening hours + prep + pre-order lead time; per-item special-request note; order note; Car Hop/Inside; payment cash/online/both; pickup-pass confirmation), host settings, per-item toggles (lead_hours/dine_in/allow_note), Orders board shows time/method/notes.
3. **Menu polish** — detail popup centered on desktop / bottom-sheet on mobile; text-color fix (dark mode); compact photo-less cards; **Grid vs List layout** choice per menu; **drag-reorder items**; category reorder (already existed).
4. **Staff order board** — login-free `/k/<token>` (copy from Orders → "Staff board"), any device, live orders + status.
5. **WhatsApp notification engine (DORMANT until WA connected)** — dispatcher in `api/cron.js` (`notify` action), order triggers (placed/new/ready/collected), reservation triggers (created + host alert via chatbox & online page; cancelled/no-show via status buttons), scheduled cron (reminder/no-show/thank-you, `task=notify_scheduled`), Pro+ gated per-venue settings panel (Menu builder), opt-in checkbox at checkout.
6. Menu importer, Menu→Post, plan-a-week, WhatsApp broadcast, mobile gating (Publisher/heavy tools hidden <640px), avatar refresh, sidebar collapsed-icon fix, Essential pricing copy, Streams hidden. (earlier in session)

## SQL — run all of these in Supabase (idempotent). Tick when done.
- [ ] `tawaslo-loyalty-design.sql` (loyalty card banner + tagline)
- [ ] `tawaslo-social-snapshots.sql` (month-over-month snapshots for the Social report)
- [ ] `tawaslo-app-config.sql` (HQ page-visibility toggle — hide/unhide pages globally)
- [ ] `tawaslo-order-ai.sql` (menus.order_ai — "AI assistant" toggle on the pickup order page)
- [ ] `tawaslo-post-format.sql` (scheduled Stories)
- [ ] `tawaslo-pickup.sql` (pickup system)
- [ ] `tawaslo-menu-layout.sql` (grid/list)
- [ ] Staff board + notifications (also in `tawaslo-kitchen-token.sql` + `tawaslo-notifications.sql`):
```sql
alter table public.menus    add column if not exists kitchen_token text;
alter table public.menus    add column if not exists notify       jsonb   default '{}'::jsonb;
alter table public.orders   add column if not exists notify_optin boolean default true;
alter table public.bookings add column if not exists notify_optin boolean default true;
alter table public.bookings add column if not exists notified     jsonb   default '{}'::jsonb;
```

---

## USER-SIDE TODOs (only Abdulla can do these)
- **Push** the current code batch to production (Vercel) after running the SQL.
- **Test** using `TEST-CHECKLIST.md` (esp. publish a real post; run a pickup order on phone).
- **Auto-publish (scheduled posts don't fire yet):** set Vercel env `PUBLISH_ENABLED=1`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and add an external cron (cron-job.org) pinging `/api/cron?key=SECRET` every minute.
- **Timed WhatsApp notifications:** add a cron ping to `/api/cron?key=SECRET&task=notify_scheduled` every ~10 min.
- **WhatsApp go-live:** get a dedicated Bahraini eSIM (keep it alive w/ a year prepaid; bar calls after registering), do Meta Business Verification, register the number on WhatsApp Cloud API, submit the templates from `WHATSAPP-TEMPLATES.md`, then set `WA_TOKEN` + `WA_PHONE_ID` in Vercel. Model = ONE central Tawaslo number; per-message utility cost is pennies; gate to Professional+.
- **Resend:** verify `tawaslo.com` domain + `RESEND_API_KEY` in Vercel (for team invites + reports).
- **Loyalty wallet (later):** Apple Developer $99/yr + Google Wallet issuer (free).

---

## PENDING BUILDS (pipeline — NOT built yet)
- **Host Portal** (#48) — venue self-service login (Menu/Orders/Reservations/Loyalty/Reviews/Guests), RLS-scoped. Security-sensitive; spec in `HOST-PORTAL-SPEC.md`.
- **Dashboard makeover** — visual polish pass on the dashboard (user is keen; discuss directions first, mock up, then build).
- **Loyalty Wallet Pass** (#43) — spec in `LOYALTY-WALLET-SPEC.md`.
- **Notification engine remainders** (minor) — per-event granular toggles. (Walk-in confirmation + reschedule "updated" message + host approval mode are now DONE, see BUILT below.)
- **Merchant delivery** — address capture + delivery zones/fees (pickup works for merchants now; true delivery is a bigger add).
- **Instagram DM auto-responder** (#42) — when Meta approves IG messaging.
- Older pending: support@tawaslo.com mailbox (#13), IG Story test (#20), F&B hardening (#28), UGC/influencer discovery (#29), per-seat billing (#31).

---

## INVENTIONS — FUTURE PHASE (parked, Abdulla's call)
Build the things single-vertical competitors structurally can't (social × dining × WhatsApp × AI, Arabic-first). Reviewed July 2026.
**Greenlit for a later "second brain" phase:**
- **Invisible loyalty + occasion memory** — no points/cards/payments. AI recognizes a regular across channels, briefs the host ("5th visit, loves the saffron cheesecake — dessert on us"), and remembers occasions to nudge the venue a year later ("Layla's birthday next week — invite her back?"). Uses Guest 360 + the occasion field we now capture.
- **Khaleeji voice-note concierge** — guest sends an Arabic/Khaleeji WhatsApp voice note ("احجزلي طاولة لأربعة بكرة الساعة ثمانية") → transcribe dialect → book/order. (+ "Majlis mode": one shared link, whole family adds to one order.)
- **Nightly operator's brief** — one afternoon WhatsApp to the venue: tonight's covers, birthdays, allergies flagged, low-stock items, expected rush. A co-pilot that texts what matters, not a dashboard.
**Parked / declined for now:**
- Post-to-Plate (per-post → covers attribution) — declined.
- Operationally-aware auto-marketing (content reacts to occupancy/inventory) — declined.
NOTE: explicitly NO reservation deposits / card-holds / taking payments through bookings (Abdulla: "we're inventors, not copiers").

---

## BUILT THIS SESSION (July 2026) — dashboard makeover + F&B lifecycle. NO SQL NEEDED (reuses existing columns).
- **Real notification engine** — killed all hardcoded/demo notifications; bell now fires real events (approvals, published posts, new orders, new reservations, real trial days). Per-account read tracking (keyed by email) so each event toasts exactly once. Ink+slate restyle + empty state.
- **Design system rollout** — Inbox, Orders board, Reservations restyled to ink+slate (masthead mark, Fraunces serif, hairline rows, outline status pills). Removed last purple (Inbox DM badge).
- **Pickup order full lifecycle** — country-code picker (auto-detect + changeable) on checkout, phone echoed on the pass + tappable/WhatsApp on host card; stepper New→Accepted→Preparing→Ready→Handed over; fixed the picked_up/collected bug so handover fires the thanks message; "Handed over today" list.
- **Reservations full lifecycle** — Confirmed→Seated→Completed + No-show + Cancel, each firing the right WhatsApp; per-row WhatsApp message button; green "notified" flash.
- **Reschedule (manual + automated)** — host 🕐 edit modal (date/time/party → fires reservation_updated); concierge learned a reschedule intent (finds booking by phone, moves it). Closes the never-triggered "updated" message gap.
- **Capacity + approval + occasion (concierge)** — server + AI capacity guard (never overbooks seats-per-slot, offers alternatives when full); host toggle Auto-confirm ⇄ manual approval (pending bookings get Approve/Decline on the board); concierge now always asks the occasion. Approval mode stored in booking_settings.hours.require_approval (no SQL).
- Publisher Live Preview made properly sticky (page-scroll only, no inner scrollbar).
- **Concierge is now business-type aware** — was hardcoded as a restaurant host everywhere; now the persona (backend `conciergeReply` in generate-caption.js + `waBuildContext`) adapts to `business_type`: restaurant/cafe = menu + table booking + pickup; shop = catalog + pickup, NO booking ("book a table" removed); services = appointments, NO menu talk; any other/agency type = neutral receptionist that answers about the business + takes a name/contact for follow-up, never offers menu/table. `bizType` now passed through all 3 concierge callers (ConciergeWidget public, ConciergePreview owner, WhatsApp). Default stays 'restaurant' so existing venues are unchanged. Design: Concierge page got the editorial masthead (linked-circles + Fraunces), de-boxed the stat cards into a hairline stat rule (mono/serif numbers, type-aware metrics — Appointments vs Bot bookings, hides menu metrics for services), neutral AR labels, and removed the 👋 emoji from every default greeting (all greetings now type-aware). Both concierge configs (Concierge page + Reservations tab) updated.
- **SCHEDULING BUG FIXED & LIVE (Instagram scheduled posts weren't publishing).** Symptom: schedule in Publisher → shows in Planner → never posts. DONE: (1) restored the truncated cron.js publish engine + deployed; (2) Vercel env `PUBLISH_ENABLED=1` + `CRON_SECRET=tw_vNTQv10kG0_8ro0EljcgiDogDbdPENdT` (SUPABASE_SERVICE_ROLE_KEY already set); (3) cron-job.org job pinging **`https://www.tawaslo.com/api/cron?key=<CRON_SECRET>`** every 1 min — NOTE the **www** is required (root tawaslo.com 307-redirects to www; cron-job.org doesn't follow redirects). Verified live: TEST RUN = 200 OK, engine runs, marks posts published/failed (failed ≠ retry-forever). Cron picks up ANY overdue scheduled post (scheduled_at ≤ now) on next run — so clear stale Planner items before they fire. Caveat: feed posts (image/carousel/reel) confirmed path; IG **Stories** via API need a separate test (task #20). Two old stuck posts failed for real reasons: 1 text-only (IG needs media), 1 expired IG token (reconnect in Social Accounts).
- **CRITICAL FIX — api/cron.js was truncated (scheduled posts never published).** The committed/deployed cron.js had been cut off mid-statement (~28KB, ended at `if (req.query && req.query`), so the ENTIRE publishing loop + monthly-reports body + notify_scheduled dispatcher were missing — scheduled posts sat in the Planner forever. Restored the full engine by splicing HEAD's prefix (keeps the recent calBase approval-calendar fix) onto d7d9037's complete tail → 34.7KB, node --check OK, ends properly, all parts present (PUBLISH_ENABLED, status=eq.scheduled loop, meta-publish call, notify_scheduled, calBase). Frontend already saves scheduled posts as status='scheduled' + scheduled_at, matching the loop. NEEDS PUSH. **Also user-side to actually fire auto-publish:** Vercel env `PUBLISH_ENABLED=1` + `CRON_SECRET=<random>` (SUPABASE_SERVICE_ROLE_KEY already set), and an external cron (cron-job.org) GET `https://tawaslo.com/api/cron?key=<CRON_SECRET>` every 1 min. (Same restore also un-breaks monthly reports + WhatsApp notify_scheduled, which lived in the lost tail.)
- **AI support agent** — new `mode:'help'` in generate-caption.js (Haiku, grounded system prompt of Tawaslo how-to knowledge: connect accounts, publish/schedule, switch clients, reports, team, billing, white-label, concierge, WhatsApp-dormant, restaurant tools, data safety; replies EN/AR; suggests "Talk to a human" when unsure). Settings → Support pane got an "Ask the AI assistant" card that opens an inline chat (aiOpen/aiMsgs/aiInput/aiBusy + askAi/openAi/escalateAi); "Talk to a human" prefills the ticket form (setTkSubject/Message) and closes the chat. FAQ "Still stuck?" line now offers Ask the AI or contact support. Reuses ANTHROPIC_API_KEY + concierge AI meter; no SQL. Live answer only runs on deployed env (needs the key) — build + node --check green.
- **Settings fully remodeled (Hootsuite-style, two-pane)** — editorial masthead + a grouped left nav (Account: Profile/Agency/Security · Workspace: Notifications/Appearance/Language&region/White-label/Billing&plan · Help: Support/Help&FAQ/About) with a focused right pane per tab. All existing save logic preserved. New: Security (password reset link via supabase.auth.resetPasswordForEmail, sign out this device, sign out all devices via global scope, Delete-account → routes to a prefilled support ticket), Language&region (timezone stored in tw_tz localStorage), Billing&plan (shows userPlan + Manage billing → billing page), Help&FAQ (6 real bilingual Q&As in an accordion, no external docs/coming-soon), About (version 1.0 + terms/privacy links tawaslo.com/terms.html + privacy.html). Support promoted to its own pane (email card + Help&FAQ card + ticket form → createSupportTicket, still falls back to support@tawaslo.com).
- **Social Accounts page fully de-AI'd** — editorial masthead + Fraunces title (kept the "Connect and manage the networks for <client>" subline); removed the big radial header glow; the two glossy gradient stat cards became clean serif numbers; the "Add a network" **card grid → hairline list** (brand glyph + name + desc + connected count + Connect/Add another, coming-soon rows dimmed with a lock) per the no-card-grids rule; connected-account rows lost their gradient avatar tiles + colored left stripe (now flat slate tiles); the tinted blue "Note" callout box became a quiet hairline note; empty state now uses the linked-circles mark. Pure visual — no reconnects, tokens/data untouched.
- **Team page redesign (sexier)** — editorial masthead + Fraunces title, de-boxed the member card into a hairline list, added a segmented seat gauge (big serif count + filled/hollow seat pips + "N open"), avatars now flat slate with an inner ring, status/role carry small colored dots, and empty seats render as dashed "Open seat · Invite someone" ghost rows that open the invite form.
- **Clients page fully restructured** — stat strip (Clients / Connected accounts / Need-setup, need-setup amber = count of 0-account clients), live search + business-type filter chips (All/Restaurant/Shop/Services with counts) + sort (Name/Most accounts/Newest), and a columnar list (Client+type / Channels / Accounts / Status / actions) under a column header. Row click switches into that client (setSelClient + dashboard); Edit/⋯ stopPropagation so they don't trigger the row. 0-account clients show an amber "Connect" chip (→ Social Accounts) instead of a fake active dot. Add-another ghost row kept. (Dropped the "Trial/Paid" idea — clients are the agency's own, no Tawaslo billing.)
- **Clients page unified** — killed the multi-color name-hashed monograms (violated slate-only); `ClientMonogram` now renders slate-only with serif initials + inner ring (applies everywhere it's used — sidebar switcher etc.), and client rows got a green "active" status dot. Real logos still shown when present.
- **Fill My Tables — Offer window (happy hour), Phases 1+2** — new `offerWindowState()` helper (hoisted, shared). Owner sets an offer window: mode "last N hours before close" (auto from booking hours close time) OR "custom time" (from/to), active days, and the perk (free item / % off / amount off). Fill My Tables shows a live "● Live now · Nh left" status + countdown, the WhatsApp nudge message includes the timing ("pop in before 11:00 PM") and the perk, and it all saves to `booking_settings.hours.offer_cfg` (jsonb, NO SQL). Phase 2: new `HappyHourBanner` component reads the same offer_cfg and shows an amber "Happy hour · <perk> · until <end>" banner on the public menu (mobile + desktop) and pickup order pages during the live window. Phase 3 (auto-discount at checkout) intentionally deferred until after trial. Builds green.
- **Fill My Tables redesign** — editorial masthead (linked-circles + Fraunces venue title), occupancy de-boxed into a hairline stat rule (serif % + bar + band pill), removed both emojis (🌿 from the WhatsApp message template, 🎉 from the "busy" state → linked-circles editorial). Fixed the "no action button" problem: when there are 0 opted-in regulars it now shows a primary "Open Guests" button (navigates to Guests to opt them in); when tables aren't set up (cap 0) it shows a "Set up tables" button → Reservations. Message preview is now a left-accent quote (not a boxed callout). Per-guest WhatsApp Send buttons unchanged.
- **Pickup order AI assistant (floating bubble → cart → checkout)** — host toggle "AI assistant" in Menu builder → Pickup settings (stores `menus.order_ai`, default OFF; SQL `tawaslo-order-ai.sql`). When ON, the public /order/<slug> page shows a slate floating bubble (bottom-right, "Order with AI" hint fades after ~4.5s). Opens a chat: guest types in plain language → backend concierge "ORDER MODE" (new `orderMode` flag in generate-caption.js returns `order:[{name,qty}]`) → the page fuzzy-matches names to real menu items and calls add() → live item/total footer → "Review & checkout" closes the sheet and scrolls to the existing checkout (`#tw-checkout`). Guest always reviews + pays manually — never auto-charges. Uses the concierge AI meter. New component `OrderAssistant`.
- **Concierge capability toggles** — Concierge page now has a "What your concierge can do" panel (type-aware): Answer menu/catalog (always on) + toggles for Take pickup orders / Book a table|appointment / Capture enquiries. Stored in booking_settings.hours (concierge_orders/booking/capture, default true). Gates the live widget (orderUrl/booking only passed when the toggle is on) + preview. No SQL (reuses hours jsonb).
- **Suggested content** — empty state now has one-click starter feeds (Coffee news / Food & dining / Bahrain via Google News RSS) + a plain-English "what's an RSS URL" hint, so new users aren't stuck hunting for a feed.
- **Win Clients page refined** — editorial masthead (linked-circles mark + Fraunces title), hairline "how it works" 3-step strip, each mode button now explains what it produces + when to use it, platform picker helper (reads only IG + TikTok — the networks it can audit), export legend (PDF / Word / Copy link explained), emoji empty state replaced with linked-circles editorial. **Inline "Your price + Currency" field now appears directly under the mode buttons when "With price" is selected** (was hidden in the branding card until after Generate); removed the duplicate price box from the branding card (single source of truth).

---

## QUICK "RESUME IN NEW CHAT" SCRIPT
> Read `TAWASLO-STATUS.md` in this repo. It has everything we've built, the SQL to run, my to-dos, and what's still pending. Then let's continue with [X].

---

## DE-AI PASS (make it not read as AI-generated) — started 2026-07-22
Trigger: a reviewer said the site "feels like Claude everywhere" (loved everything else). Fix = kill template tells: hype copy, ALLCAPS eyebrow overuse, decorative UI emojis, fabricated stats, glowy gradients. Going PAGE BY PAGE. Keep the LOCKED design-system consistency — only strip tells, don't restructure shared parts. Keep emojis that live in *generated content* (captions, WhatsApp) — only remove UI-chrome emojis.

**Page 1 — Dashboard (AgencyDashboard + OnboardingHero): DONE, build green (esbuild transform exit 0).**
- OnboardingHero copy de-hyped: "Bring your channels in"→"Connect your accounts"; "Craft your first post"→"Write your first post"; "Watch it take off"→"See your results"; removed "the perfect moment / beautiful view / now the fun part / unlocks everything else". All-set: dropped "!" + Sparkles icon → CheckCircle; calmer copy.
- Eyebrows de-capsed: "YOUR SETUP JOURNEY"→"Getting started"; "THIS MONTH"→"This month" (sentence case, no letter-spacing).
- Hero de-glowed: gradient bg + radial blur blob → flat th.card, no heavy shadow.
- Removed dead `kpiStats` array (had fake +12%/+28%/+1.2%/+5.2% deltas, never rendered).
- Removed fabricated "Reach by post type" donut (hardcoded 45/30/25) → Reach chart now full width.
- Backup of pre-edit file: outputs/deai/TawasaloApp.bak.js
- NEXT PAGES (one at a time, user drives order): public marketing pages, menu/order, Publisher, Planner, Analytics, Reports, Settings, etc. Same treatment.

## REAL DASHBOARD — fake-data audit (2026-07-22)
Audited the actual (post-login) AgencyDashboard. Everything is real: followers, reach, engagement, post count pull live from Instagram insights; show "0"/"—"/"appears once insights sync" when empty. Only fabrication found = the account-card "reach trend" sparklines (hardcoded upward SVG paths regardless of real data). Fixed:
- Single-account card: sparkline now DRAWN FROM real reachSeries (the live 14-day reach series we already fetch); flat when no data.
- Multi-account cards: removed the fake sparkline entirely (no per-account trend series available) + removed now-unused f/up/sLine/sArea consts. Real numbers (followers, "Reach 30d —") kept.
- Build green (esbuild transform exit 0). Backup: outputs/deai/TawasaloApp.bak2.js
Note: landing/homepage still has illustrative mockup numbers (77.6K etc.) + marketing claim-stats ("10x faster","+38% avg reach lift") — SEPARATE from the real dashboard; reword of claim-stats still queued, mockup preview left as illustration.

## ENGAGEMENT REPORT — fabrication stripped (2026-07-22)
Client-facing EngagementReport was full of fake data. Removed ALL of it, build green (esbuild exit 0). Backup: outputs/deai/TawasaloApp.bak3.js
- Removed demo fallbacks (523 convs / 418 comments / 132 dms / 95% answered / 71% AI / 24m / fake trend / fake rt distribution / 412 IG / 138 FB) → now real computed values, 0 when none.
- Removed ALWAYS-fake kpi deltas (▲12%, ▲3pts, ▼18%, ▲9%) + kpi sparklines (dropped sparkSVG).
- platCard: removed fake Answered% + Avg-response (96%/21m/92%/31m) → shows real Replies count only.
- Removed hardcoded fake TESTIMONIALS/HIGHLIGHTS ("Best brunch in town", "9 catering enquiries", etc.).
- Sentiment/topics/insight default to empty (0/[]/"") not fake; fill from real AI analyze; TOP TOPICS hidden when empty.
- Summary rewritten data-aware: real sentence when convN>0, else "No conversations logged yet this month."
VERIFIED REAL (no change needed): AgencyDashboard numbers, VenueReportPage (revenue/bookings/covers/deltas/sparklines all from real orders+bookings).
STILL PLACEHOLDER (guidance/discovery, NOT client-performance claims): best-time-to-post HEATGRID (PublisherPage 7447 + BestTimePage 10608, hardcoded heuristic, labeled to swap to real IG insights); TrendingPage SAMPLE_TRENDS (has sampleMode). Decide: wire real / relabel as general guidance / hide until real.

## BEST-TIME HEATMAP — relabeled as general guidance (2026-07-22)
Real audience-activity data needs IG `online_followers` insight → `instagram_manage_insights` permission → BLOCKED on Meta App Review approval. Until then, relabeled so it's honest guidance, not a claim about the client's real numbers (build green):
- PublisherPage: "Brighter cells are when your audience is most active" → "typical high-engagement windows". (already footnoted "switches to real audience data once insights are approved").
- BestTimePage: subtitle "when your audience is most active" → "suggested posting times · general guidance". (already footnoted "upgrades to real audience data once Instagram insights access is granted").
- TODO once Meta approves: wire HEATGRID (PublisherPage ~7447 + BestTimePage ~10607) to real online_followers insights, drop the heuristic.
TrendingPage: already honest — real /api/trends by default with empty states; SAMPLE_TRENDS only in an explicit labeled demo toggle. No change.
