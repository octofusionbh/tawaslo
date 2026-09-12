# Build Brief for Codex — Host Dashboard + Host Packages

## 0. Golden rules (read first)
- **Do NOT bury host/venue-operations features inside the agency dashboard.** The host experience is a **separate, scoped dashboard**. A host scanning a loyalty card, taking a pickup order, or seating a booking must happen in the **host dashboard**, never in the agency's screens.
- **Do NOT break the live agency app.** Build additively. Keep host code modular (a clear "venue mode" boundary) so it can be spun out as a standalone product later with minimal rework.
- **All host-facing copy must be global/neutral.** No references to any region, country, language, or locale. Currency in the pricing UI is USD. No "Arabic-first," no city names, nothing region-specific anywhere a customer can see.
- **Security is the critical piece.** A host must NEVER see another venue's data; an agency sees only its own clients. Get the RLS right and have it reviewed before go-live.
- **Reuse what exists — do NOT rebuild the features.** The venue-operations tools (menu, orders/pickup, loyalty, reservations, reviews, guests, concierge, analytics) are already built. This work is only about **packaging and selling them standalone**: a scoped host dashboard, host price cards, self-serve signup + billing, and the ownership/RLS to make a venue usable without an agency. Wire up the existing features; don't re-implement them.

---

## 1. The big picture — two dashboards, one codebase

There are **two distinct dashboards** sharing the same app + database:

**A) Agency dashboard (exists today).** Manage multiple client venues, social publishing/scheduling, planner, inbox, ads, reports, etc. Unchanged.

**B) Host dashboard (build this).** A single venue's operations, scoped to that one venue:
Menu · Pickup Orders · Reservations · Loyalty · Reviews · Guests (CRM) · AI Concierge · Fill My Tables · Analytics · Business profile & settings.
The host **never** sees: the agency side, other venues, social publishing/scheduling, or HQ.

**Entry point:** `host.tawaslo.com` boots the app straight into **venue mode** (same app — detect the hostname on load; do not build a second app). Agency users keep using the main domain as today.

**The host dashboard is a STANDALONE product.** A venue can subscribe to and use it entirely on its own — no agency, and no social/marketing features whatsoever. Many venues already run their own marketing (in-house team or another tool) and want ONLY the operations system (menu, orders, loyalty, reservations, reviews, guests, analytics). To such a venue, the agency/social platform must not exist: no mention of it, no upsell surfaced by default, no dependency on it. It should feel like its own product, not a stripped-down Tawaslo. (This is also what lets it become a separate product later with minimal rework.)

**Model:** the **host is the primary operator** of their venue; an agency is **optional support**. This is a UX hierarchy, not a hard permission wall — an agency that manages a venue still needs technical access to help/fix. The only hard walls are the security ones in §5.

---

## 2. Two ways a host gets in

**Path 1 — Self-serve (runs it privately, no agency).**
For a venue that has no agency, or that handles its own marketing with an in-house team and just wants the operations tools. They sign up and run everything themselves.
1. Host goes to `host.tawaslo.com` → **Get started**.
2. Creates an account (email + password).
3. Creates their venue → **the host is the OWNER of the venue** (not an agency).
4. Picks a **host package** (see §4), starts a short free trial, then pays directly via the existing billing integration (Tap / Polar).
5. Lands in the host dashboard (venue mode).

**Path 2 — Agency-managed (agency brings the venue).**
1. From the agency app, "Invite venue owner" → email → host sets a password → linked to that venue via `venue_members`.
2. While the venue is the agency's client, **host access is bundled** (covered by the agency's plan) — free to the venue.
3. The host operates the venue dashboard; the agency supports + runs the social/marketing layer.

Either party can later invite the other (a self-serve host can add an agency; an agency can invite an existing self-serve venue). Optional, never required.

---

## 3. Lifecycle — agency bundle → client leaves → convert to paid host

When an agency **detaches** a venue (removes the client / revokes the link):
1. The venue flips to a **self-serve grace state**, ownership transfers to the host, and a **30-day free timer** starts.
2. The host keeps full access + all their venue data (menu, orders, loyalty, guests) during grace. They lose the agency's social/marketing layer (that was never theirs).
3. After 30 days → **soft paywall** (reuse the existing trial-ended pattern: data stays **viewable**, but actions gate) with a pop-up to **buy a host package**.
4. On purchase → continues as a paying self-serve host.

Reuse existing machinery: the trial/soft-paywall banner+lock, the `venue_members` link, and the Tap/Polar billing already in the app. This is a lifecycle state on top of the host portal, not a new billing system.

---

## 4. Pricing / packages — add a SECOND set of cards

The packages/pricing page currently sells **agency** plans only. Add a **separate "For Venues" group of price cards** alongside the existing "For Agencies" cards. Two clearly separated audiences on the pricing page:

- **For Agencies** — existing cards, unchanged.
- **For Venues** — new host cards below/beside, with a simple toggle or section header to switch between the two audiences.

**Host package cards (USD, monthly; also offer annual = ~2 months free):**

| Package | Price | Includes |
|---|---|---|
| **Starter** | $29/mo | Digital menu + QR, pickup/online orders, reservations, basic analytics, 1 location, email support |
| **Pro** ⭐ Most popular | $69/mo | Everything in Starter + loyalty (scan/redeem), reviews, guest CRM, AI concierge, order/booking notifications, Fill My Tables, full analytics, priority support |
| **Business** | $149/mo | Everything in Pro + multiple locations, staff seats/roles, advanced reports, dedicated support |
| **Enterprise** | Talk to us | Chains / custom |

Prices are placeholders — keep them easy to change in one place. Feature gating per tier should reuse the existing plan/feature-gate model.

**Agency ↔ host seats:** an agency plan includes a number of bundled host seats it can give its clients (ties into the existing coupon/seat idea). Beyond that, coupons or paid. Make the included-seat count a single configurable number per agency tier.

---

## 5. Data model + security (the careful part)

Reuse and extend the plan already written in **`HOST-PORTAL-SPEC.md`**:
- `venue_members (user_id, client_id, role, created_at)` links a login to a venue. Roles: `owner` (host), `agency` (support), later `manager`/`staff`.
- **A venue must be ownable by a host directly** — not only by an agency. Support both: self-serve → owner is the host; agency-created → agency owns it but the host is a `venue_members` owner-role collaborator. RLS must grant access via `venue_members` regardless of which party is the top-level owner.
- Extend every venue-data table's RLS (`menus, menu_items, orders, bookings, loyalty*, reviews, guests, analytics, link_events, ...`) so access is allowed if the user is a `venue_member` of that venue — and **never** across venues.
- Agency retains access to its own clients (unchanged).
- **Get a security review on the RLS step before go-live.**

---

## 6. Build order (verify each before the next)
1. **SQL:** `venue_members` + host-ownable venues + RLS across venue-data tables. *(security review)*
2. **Host mode + routing:** `host.tawaslo.com` boots venue mode — auto-select the venue, host-only nav (the F&B set above), hide agency/social/HQ, block switching venues.
3. **Self-serve signup + billing:** host account → create venue (host-owned) → pick host package → free trial → pay (Tap/Polar).
4. **Agency invite + bundle:** "Invite venue owner" flow + bundled access while a client.
5. **Lifecycle:** detach → ownership transfer → 30-day grace → soft paywall → convert.
6. **Pricing page:** add the "For Venues" host cards (§4).
7. **QA:** log in as a self-serve host and an agency-invited host; confirm each sees only their venue and nothing else; confirm the agency still sees all its clients; attempt cross-venue access and confirm it's blocked.

---

## 7. Explicitly do NOT
- Don't put host-operational features (loyalty scan, order board, reservations desk) into the agency dashboard.
- Don't reveal any region/language/locale in host-facing UI or copy.
- Don't refactor or break the live agency app; keep host code modular.
- Don't ship the RLS changes without a security review.
