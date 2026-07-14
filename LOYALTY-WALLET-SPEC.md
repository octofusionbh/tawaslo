# Tawaslo — Loyalty Wallet Pass: Spec + Roadmap

**Status:** planned (not built). Testing the current push comes first. This is the plan we start on right after.

**Why:** closes the retention loop no competitor owns — diner gets a loyalty card → we capture their phone → WhatsApp win-back → repeat visit → more stamps. Uses the phone numbers you already collect from orders & bookings, and the WhatsApp broadcast that's already wired.

---

## The picture (three audiences, phased — don't build one app for all three)

| Audience | What they get | Form | Phase |
|---|---|---|---|
| **Diner** (end customer) | Loyalty card: stamps, rewards, "come back" pushes | **Apple/Google Wallet pass** — no app, no install | **Phase 1 (now)** |
| **Host / venue** (restaurant staff & owner) | Check orders, bookings, revenue, scan/redeem loyalty | Installable app (PWA first, native later) | **Phase 2 (later)** |
| **Client** (your agency customer) | Manage social, menus, multiple venues | Stays the web dashboard (mobile-friendly) | Ongoing — no separate app |

---

## Phase 1 — Loyalty Wallet Pass (the launch target)

### How it works, end to end
1. Diner orders or books (already captures name + phone) → offered **"Add loyalty card to Wallet"** (link / QR at checkout, on the menu page, and in the WhatsApp confirmation).
2. They tap once → card lands in Apple Wallet or Google Wallet. No download.
3. Each visit, staff adds a stamp (scan a QR / tap in the host view) → the card **updates live** in their phone.
4. On reward unlocked (e.g. 6th coffee free) → push notification on the pass + optional WhatsApp message.
5. Quiet customers (no visit in X days) → **WhatsApp win-back broadcast** to the same phone list.

### What I build (on your current Vercel + Supabase stack)
- `loyalty_cards` + `loyalty_events` tables (member, venue, stamps, rewards, phone).
- Pass generation service: signed Apple `.pkpass` + Google Wallet object via the Wallet API.
- Pass **update** endpoint (stamp added → push to the phone).
- "Add to Wallet" button + QR on the menu/checkout/confirmation.
- Stamp/redeem control in the host view (simple, staff-facing).
- Ties the phone number into the existing WhatsApp broadcast list.

### What only YOU can set up (accounts / logistics)
- Apple Developer Program membership — **$99/year** → gives the Pass Type ID + signing certificate.
- Google Wallet API issuer account — **free**.
- Decide the default reward rule (e.g. "buy 6, get 1 free") — can vary per venue.

---

## Simple roadmap

**Step 0 — Now:** finish testing the current push (use TEST-CHECKLIST.md). Confirm Publisher + invites + WhatsApp broadcast are clean.

**Step 1 — In parallel (you):** register Apple Developer ($99/yr) + Google Wallet issuer (free). Send me nothing sensitive — just confirm when they're active.

**Step 2 — Build (me):** loyalty tables + pass generation + "Add to Wallet" button + host stamp control. Hidden behind a flag like we did with Tap payments, so it never disturbs live users.

**Step 3 — Wire the loop (me):** stamp → live pass update → reward push → WhatsApp win-back tie-in.

**Step 4 — Pilot:** turn it on for ONE real restaurant. Issue ~20 cards, add stamps, confirm updates + a win-back message land.

**Step 5 — Launch:** flip the flag on for all venues once the pilot is clean.

**Phase 2 (later):** host app (PWA → native). Separate codebase, some store logistics on you. Not now.

---

## Sequencing with what you're already finalizing
- **CR (commercial registration)** and **Tap Payments** onboarding come first — they gate real money movement and the automated payout flow.
- Loyalty wallet has **no payment dependency**, so it can be built alongside Tap without waiting on it.
- Order: **test current push → finalize CR + Tap → build wallet pass (flag-hidden) → pilot → launch.**

**No SQL or payment approval needed to START the wallet build** — only the two developer accounts above, and only when we reach Step 2.
