# Tawaslo — Pickup Ordering module (design)

Lives **inside the Menu section**. Turns the view-only menu into a "browse → order → pay → pick up" flow, with each restaurant paid directly via Tap split payments. Payments flip on once Tap marketplace onboarding is done; everything else can be built and used now.

---

## 1. The links, generated per restaurant
Generated in the Menu section, each with **Copy** + **QR** + **Open**:

| Link | URL | Purpose | Chat & book? |
|---|---|---|---|
| **Customer menu** | `tawaslo.com/menu/{slug}` | Send to guests — browse the menu | ✅ yes |
| **Host presentation menu** | `tawaslo.com/menu/{slug}?present=1` | The restaurant shows this on their **own tablet** in-house | ❌ hidden |
| **Order for pickup** | `tawaslo.com/order/{slug}` | Guests — browse + cart + checkout + pay | ✅ order assistant |
| **Staff back-office** (PIN) | `tawaslo.com/kitchen/{slug}` | Restaurant staff — orders, sales, **edit menu** | ❌ |

**Two menu views, one menu:** the **customer** view carries the "Chat & book" Concierge; the **host presentation** view is the same menu with the chat widget hidden (just a clean, tap-to-browse display for the in-restaurant tablet). It's the same `slug`, only a `?present=1` flag flips the chat off.

The WhatsApp Concierge can send the customer menu or the order link automatically.

---

## 2. Data model (Supabase)

**Menu display mode (per restaurant):**
- `menus.photo_mode text default 'all'`   -- **all** (every item shows a photo) | **none** (clean text menu, no photos) | **per_item** (each item decides)
- `menu_items.show_photo boolean default true`  -- only used when `photo_mode = 'per_item'`; a toggle on each item
- `menu_items.on_pickup boolean default false`   -- **"also on pickup menu"** toggle: item shows on the view menu always, and on the order/pickup page only if this is on. Host adds an item once and picks whether it's orderable.

So a client picks one of three: **With photos**, **No photos**, or **Per item** (then toggles the photo on/off per dish). Applies to the view menu, the order page, and what the Concierge references.

**Extend `menus`** (add columns):
- `pickup_enabled boolean default false`
- `pickup_pay_mode text default 'online'`   -- online | at_pickup
- `pickup_prep_min int default 20`           -- default prep time shown to guest
- `pickup_hours jsonb`                        -- weekday windows ordering is open
- `pickup_min_order numeric default 0`
- `tap_destination_id text`                   -- the restaurant's Tap Destination ID (from onboarding)
- `commission_pct numeric default 0`          -- Tawaslo/Octopus platform fee %

**New table `orders`:**
```
id            uuid pk
client_id     uuid            -- the restaurant
menu_id       uuid
order_no      text            -- short human code, e.g. #A3F9
customer_name text
customer_phone text
items         jsonb           -- [{name, qty, variant, addons[], price, line_total}]
subtotal      numeric
fee           numeric         -- platform commission
total         numeric
currency      text            -- BHD / SAR
status        text default 'new'     -- new | accepted | preparing | ready | picked_up | cancelled
pay_status    text default 'unpaid'  -- unpaid | paid | refunded
pay_ref       text            -- Tap charge id
pickup_at     timestamptz     -- requested pickup time
note          text
created_at    timestamptz default now()
```
RLS: owner reads/updates their own orders (via client_id → clients.owner_id); public can INSERT an order (guest checkout); Tap webhook (service role) marks paid.

---

## 3. Owner side — new "Ordering" tab in the Menu page
- **Enable pickup ordering** (toggle).
- **Settings:** pay mode (Pay online / Pay at pickup), prep time, ordering hours, minimum order, commission %.
- **Payments:** paste the restaurant's **Tap Destination ID** (from Tap onboarding) — until then, only "Pay at pickup" is available.
- **The two links** (Menu view + Order for pickup) with Copy / QR / Open.
- **Orders queue** (live): tabs **New · Preparing · Ready · Done**. Each order card shows items, customer, pickup time, total, pay status, and one-tap actions: **Accept → Preparing → Ready → Picked up** (or Cancel/Refund). New orders ping + optional WhatsApp/print.

## 4. Customer side — `tawaslo.com/order/{slug}` (no login)
Browse by category → tap item (choose variant/add-ons/qty) → **cart** → **checkout** (name, phone, pickup time) → **pay**:
- **Pay online:** Tap hosted checkout (Benefit/mada/Apple Pay/cards).
- **Pay at pickup:** order placed as unpaid (if the restaurant allows it).
→ **Confirmation** with order number + live status. Works standalone or opened from the WhatsApp Concierge.

**AI assistant on the order page:** the same **Concierge** brain (trained per restaurant) runs here in an *order & support* mode — a "Chat & order" bubble that answers menu/allergen questions, recommends and adds items to the cart, upsells, and handles support (pickup time, "where's my order?"). One trained assistant, three surfaces: view menu, order page, WhatsApp.

---

## 4b. Restaurant staff link — POS-lite back office (`/kitchen/{slug}`)
The restaurant's own people don't have a Tawaslo login, so you **generate one persistent, PIN-locked link** (same pattern as the reservations host-stand). Generated once in the Ordering settings, it's **always live and current** — Copy / QR / Open. Three tabs:

1. **Live orders** — the incoming board (New · Preparing · Ready · Picked up), tap to advance status. This is what the counter/kitchen watches during service (auto-refresh + new-order sound).
2. **Sales** — today's **income**, order count, average order value, and **top-selling items**; switch to week/month. The POS-style read on how they're doing.
3. **Availability (86 list)** — quick **sold-out toggles** per item (marks it unavailable on the menu, order page, and to the Concierge instantly). Lightweight inventory — not full stock counts, just in/out.
4. **Menu (edit)** — the host **edits their own menu here**: add/edit an item (name, price, category, photo), and per item flip **available**, **on pickup menu**, and **show photo**. Self-serve — the restaurant maintains its own menu + pickup menu without a Tawaslo login, and changes reflect instantly on all views.

PIN-locked (4-digit, set by you). Scoped to this one restaurant only — orders, sales, and their own menu; no access to account settings or other clients.

---

## 5. Payment flow (Tap split)
1. Guest checks out on `/order/{slug}`.
2. App creates a **Tap Charge** with a `destinations` split:
   - restaurant's **Destination ID** → their share (subtotal),
   - Octopus account → **commission** (fee).
3. On Tap success (webhook), the order is created/marked **paid** and drops into the restaurant's queue; guest sees confirmation.
4. Tap **settles the restaurant to their own bank** — Trio in **SAR**, Bahrain restaurants in **BHD** — on the payout schedule. Octopus's fee is already skimmed.

**Until Tap is live:** ship with **Pay at pickup** only (fully functional ordering + queue, money collected in person). Flip on **Pay online** the moment the Destination IDs exist — no rebuild.

---

## 6. Build order (phased)
1. DB: `orders` table + `menus` columns + RLS.
2. Owner "Ordering" tab: enable toggle, settings, the two links (Copy/QR), live orders queue.
3. Public `/order/{slug}`: menu browse → cart → checkout → "Pay at pickup" confirmation.
4. Tap: onboard restaurants → store Destination IDs → wire Charges API split + webhook → enable "Pay online".
5. Notifications: new-order ping + WhatsApp message to the restaurant.

Phases 1–3 are buildable now; phase 4 waits on Tap onboarding.
