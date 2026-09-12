# Orderlo — Business & Build Blueprint

*A living document. The full, money-making venue operating system. Built as its OWN separate app — the live Tawaslo app is never modified. Launched only when it's genuinely perfect.*

An Octo Fusion product · Manama, Bahrain

---

## 🛑 Golden rule
**Orderlo is a separate, standalone app.** Never edit or "implement Orderlo inside" the live Tawaslo app (`C:\dev\tawaslo\src\TawasaloApp.js`, `C:\dev\tawaslo\api\*`) — that is a live product with paying customers. You may **read/copy** Tawaslo's proven code *out* into Orderlo, but you **never change the original**. If a step seems to need touching Tawaslo, **stop and ask first.**

---

## 1. What Orderlo is

Orderlo is the operating system a venue runs its front of house on — menu, ordering, pickup, reservations, loyalty, an AI host on WhatsApp, and (the big one) a real POS. It serves restaurants, cafés, shops, salons and clinics across the Gulf.

Two front doors, one system underneath:

- **Orderlo** — the host/venue product (`orderlo.store`).
- **Tawaslo** — the agency/management side; agencies connect to a venue by code and run it on the owner's behalf.

The diner never sees either brand — every message goes out in the venue's own name.

---

## 2. How it makes money

Orderlo earns in **three stacked ways** — this is the business, not just the app:

1. **Subscriptions (the core MRR).** Billed through **Tap Payments**. Two products, paid separately — no bundling, no shared bills, no confusion.

   **Orderlo — hosts always buy their own.** Any package they choose.
   - **Starter** — free 14-day trial.
   - **Pro** — fixed price, per venue (reservations, loyalty, AI host).

   **Tawaslo — agencies always pay. No free tier.**
   - **Freelancer** — solo, managing a few clients.
   - **Professional · Agencies** — fixed price.
   - **Enterprise · Brands** — fixed price.
   - **Partner** — custom / talk-to-us · franchises, chains, white-label, very large orgs.

   **Coupons — the growth weapon.** Every Tawaslo plan comes with coupons; each coupon = **3 months of Orderlo free** for one client venue. Agencies use them to win clients ("sign with us — 3 months of Orderlo free").
   - Freelancer → **1** · Professional → **3** · Enterprise → **5** · Partner → **custom**.
   - Coupons **refresh yearly** — keeps agencies subscribed and bringing venues.
   - At redemption the venue puts a **card on file** → converts to paid automatically after 3 months (smooth, no chasing).
   - **Even during the free months, Orderlo earns the Tap fee** on every order — free venues make money from day one.

   **One venue = one Orderlo bill** (the host's). A coupon just discounts it to zero for 3 months. The agency connects by **code** to manage — billing and management stay separate. The host always owns their data.
2. **Usage add-ons.** Metered extras on top of the plan — extra Concierge chats, WhatsApp message volume, extra locations/seats. (Meter + top-up already exists in the Concierge.)
3. **Payment processing (the big upside).** When we run POS + online checkout on **Tap**, Orderlo can take a **small per-transaction fee** on money flowing through the system. This is how POS companies become unicorns — the software gets them in, the payments make the margin.

Plus the **agency channel**: agencies pay for Studio and resell Orderlo to their own clients — distribution without our own sales team.

---

## 3. The product — every module (built vs to build)

| Module | What it does | Status |
|---|---|---|
| **Menu & catalog** | Digital menu/products, prices, photos, per-item toggles, display mode | ✅ Built |
| **QR generator** | Branded QR poster; extend to per-table QRs + printable packs | ✅ Built · extend |
| **Ordering & pickup** | WhatsApp + web ordering, orders board, order AI assistant | ✅ Built |
| **Reservations** | Table/appointment bookings, reminders, no-show cutting | ✅ Built |
| **Loyalty & win-back** | Rewards for regulars, automatic nudges | ✅ Built |
| **Guest CRM** | Profiles from every order/booking | ✅ Built |
| **Reviews** | Collect & manage reviews | ✅ Built |
| **AI Concierge** | Trained AI host — answers, orders, books, Arabic & English | ✅ Built |
| **Reports & analytics** | Pickup, reservations, revenue attribution | ✅ Built |
| **Occasion / seasonal menus** | Ramadan, Eid, Valentine's, National Day — date-scheduled themed menus | 🔷 New (extends Menu) |
| **POS — Counter mode** | Staff ring up walk-in/phone orders, cash/card, send receipt | 🔶 New (medium) |
| **POS — Full** | Floor plan, tables, split bills, kitchen display, shifts, cash reconciliation, hardware (printer, drawer, card reader), offline | 🔴 New (major) |
| **Tap Payments** | Subscription billing + online/POS checkout + per-transaction fee | 🔶 New |

**So ~80% of the product already exists.** The new builds are: occasion menus, POS (counter → full), and the Tap payment layer.

---

## 4. The three dashboards

1. **Host dashboard** *(the venue's admin — mostly built)*
   Where the owner runs everything: menu, orders, reservations, loyalty, guests, reviews, the Concierge trainer, reports, billing, team, settings. Tailored by business type (restaurant / shop / services).

2. **Agency cockpit — Tawaslo** *(mostly built)*
   Agencies see all their clients, connect to each venue by code, manage social + venue from one place, revoked by the host with a click.

3. **HQ admin dashboard — the business control room** *(largely built for Tawaslo, inherits to Orderlo)*
   Where **you** run the company: subscribers, **MRR/revenue**, usage & API metrics, support/copilot, feature flags, error logging, team & roles. This is what makes it a *business* you can steer — and much of it already exists from the Tawaslo HQ work.

---

## 5. The journeys

- **Host onboarding** — signup → business type + industry → tailored dashboard → connect WhatsApp → first menu/QR. (Prototype exists; build Orderlo-branded.)
- **Agency onboarding** — signup → add clients → connect venues by code.
- **Trial → paid** — 14-day trial with real limits, then a clean trial-end lock and Tap checkout to upgrade.

---

## 6. Tech & infrastructure

- **Frontend** — React app, light-first with dark mode, the Orderlo brand system.
- **Backend/data** — Supabase, Row-Level Security (`is_my_workspace`, admin checks), per-workspace isolation.
- **Hosting** — Vercel; serverless APIs (publishing, WhatsApp, payments, cron).
- **Domains** — `orderlo.store` (host) + `tawaslo.com` (agency), per-client subdomains (`marinacafe.orderlo.store`).
- **Messaging** — WhatsApp on **Orderlo's shared number by default** (sender shows *Orderlo*, and every message names the venue — "Marina Café: your order's ready"). Free marketing + zero setup for the venue. **Connect-your-own-number** is a paid upgrade. Run a few Orderlo numbers as volume grows.
- **Payments** — Tap Payments (merchant account required).
- **Email** — transactional (Resend / Zoho).
- **Backups & safety** — nothing removed from the live system until replaced and proven.

---

## 7. Trust, compliance, approvals

- **Tap merchant account** — apply & get approved (like the WhatsApp submission).
- **WhatsApp Advanced Access** — in progress.
- **Data ownership** — the venue owns its data; agencies get revocable access; deleting an agency never deletes venue data.
- **RLS everywhere** — no workspace can see another's data.

---

## 8. Build roadmap — small, careful, non-breaking

Built inside Tawaslo, one verified chunk at a time. Nothing ships or gets removed without your approval.

**Phase 0 — Brand & shell** *(now)*
Orderlo brand, logo, multi-page marketing site, blueprint. → *In progress.*

**Phase 1 — Stand up Orderlo as its own app**
Start a **brand-new standalone Orderlo app** (own project/folder, own auth, Orderlo-branded host dashboard + nav). Reuse Tawaslo's venue logic by **reading/copying it out** — **never editing the live Tawaslo app.** Build the first module(s) (recommend Menu → Ordering/Pickup) end-to-end. Do **not** modify Tawaslo in place.

**Phase 2 — Occasion menus + polish**
Seasonal/occasion menus; QR upgrades; de-AI + design polish pass across every screen.

**Phase 3 — Tap Payments**
Subscription billing on Tap; online checkout on Tap; groundwork for the per-transaction fee.

**Phase 4 — POS (Counter mode)**
Staff-facing till: ring up orders, cash/card via Tap, receipts. The first real POS slice.

**Phase 5 — POS (Full)**
Floor plan, tables, split bills, kitchen display, shifts/cash reconciliation, hardware, offline.

**Phase 6 — HQ hardening**
Orderlo-specific admin: subscribers, MRR, usage, support, flags, errors — the business control room.

**Phase 7 — Launch**
When Orderlo is genuinely perfect as its own app, launch it. (Any future data migration from Tawaslo happens only with explicit, careful, non-breaking approval — never automatically, never in Phase 1.)

---

## 9. The quality bar ("perfect")

Every chunk must pass:
- **Non-breaking** — the live system keeps working; new sits beside old until proven.
- **No AI tells** — no emoji, no buzzwords, no fake/demo data, no "Claude" feel.
- **Real data only** — zero fabricated numbers anywhere a customer can see.
- **Build-verified** — each change checked before moving on.
- **You approve** — build → you review → then ship.

---

*Next: we lock the plan, then start Phase 1 — putting the Orderlo face on the suite that's already built.*
