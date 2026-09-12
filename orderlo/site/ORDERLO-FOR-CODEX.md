# Orderlo — Product & Brand Brief

You are building a marketing website for **Orderlo** from scratch. This document tells you what Orderlo is, everything it does, and the brand to design it in. Build a premium multi-page marketing site that makes a venue owner trust the product and start a free trial. Quality bar: Foodics, Stripe, Linear, Eat App.

---

## 1. What Orderlo is

Orderlo is a **venue operating system** — one calm web app that runs a restaurant, café, bakery or shop's entire floor. Instead of stitching together a separate till, booking tool, loyalty app and menu, the owner gets one product the whole team already knows how to use.

- Runs in a browser on any tablet or phone. **No hardware to buy.** Printers and a cash drawer are optional, never required.
- **Bilingual: English and Arabic** (right-to-left), so the same menu and system works for both.
- Built for **Bahrain and the wider region.** Currency is Bahraini Dinar, shown to three decimals (e.g. `BHD 3.000`). VAT-aware.
- Positioned as **premium, calm and reliable** — the quiet system that takes the admin off an owner's hands.

Tagline idea: "Run the whole venue. Quietly." (Use or adapt.)

---

## 2. Who it is for

- Restaurants, cafés, bakeries, coffee shops, and small retail / service venues (salons, clinics, gyms).
- Single-venue owners who want one simple system.
- Multi-branch brands who want all their venues in one view.
- Agencies / consultants who manage venues for others and want to white-label it.

---

## 3. Everything Orderlo does (full feature list)

### Point of sale (POS)
A complete till on any tablet:
- Ring up orders from a photo menu grid; live order panel with running total.
- **Tips**, **split payments** (split a bill across cash + card + gift card), cash / card / gift card tenders.
- **Item-level discounts** and **item-level refunds** (refunds require a reason).
- **Promotions apply themselves** at the till (see promotions below).
- **Gift cards**: sell store credit and redeem it at checkout.
- **Loyalty at the till**: look up a guest, reward regulars automatically.
- **Cash drawer** management and cash movements (pay-ins / pay-outs).
- **X and Z reports** (shift reports), tax and sales totals at close.
- Mark items **sold out ("86")** and restore them; hide / show items.
- Item photos on every button.

### Lo — the built-in assistant
Lo is an assistant inside the dashboard. The owner tells it what they need in plain words and it does it in seconds — no hunting through settings on a busy night. It tolerates typos and loose phrasing.
Examples of what Lo does:
- "Add Latte for 1.6 to Drinks" → creates the item.
- "86 the cheesecake" → marks it sold out on the guest menu and the POS.
- "Pause online orders", "hide the tiramisu", "change flat white to 3.2".
- Run a promotion, add a walk-in, message the team, contact support.

### Menu & guest ordering
- A **branded, bilingual menu** guests open by QR code or a WhatsApp link.
- Guests can **order for pickup** and **book a table**.
- **Daily and seasonal menus** that switch on automatically by date.
- **Festive / seasonal covers** the owner designs in their own colours.
- Item photos and descriptions.

### Reservations
- Take bookings and appointments.
- Send reminders to cut no-shows.

### Kitchen display (KDS)
- Tickets fire to the pass and **colour by age** so nothing is forgotten.
- All-day counts so the kitchen can batch efficiently.

### Promotions engine
- Percentage or fixed-amount discounts.
- **Promo codes.**
- **Buy-one-get-one-free (BOGO).**
- Rules apply automatically at checkout.

### Loyalty & gift cards
- Reward regulars automatically.
- Sell and redeem gift cards / store credit at the counter.

### Reports
- Sales, tax, tips and shift reports.
- **Export to Excel** at the close of every day.

### Multi-venue & own-brand apps
- Run many branches under one owner with a single view across them all.
- For venues that want it, publish a dedicated app under **their own brand** on the App Store and Play Store (white-label).

---

## 4. Plans (for the pricing page)

Three tiers, 14-day free trial on any plan, no card to start, cancel anytime:

- **Starter — Free for 14 days**: Menu, QR & guest ordering; counter POS; reservations; one venue.
- **Pro — monthly** (most popular): Everything in Starter, plus promotions, loyalty & gift cards; kitchen display & full POS; reports & Excel export.
- **Brand — custom**: Everything in Pro, plus many branches in one view; own-brand app option; priority support.

---

## 5. Brand identity

### Name
**Orderlo** — always standalone. Never "Orderlo by [anything]".

### Logo
A "loop" mark: one continuous rounded-rectangle loop with two dot nodes — an ink dot at the top-left, a green dot at the bottom-right. It stands for "one connected system." Always shown with the wordmark "Orderlo" in a heavy sans weight.

Use this SVG for the mark:
```html
<svg width="30" height="30" viewBox="0 0 48 48" fill="none">
  <path d="M14 14 h20 a10 10 0 0 1 0 20 h-20 a10 10 0 0 1 0 -20 z" stroke="#0E1512" stroke-width="3.6"/>
  <circle cx="14" cy="14" r="4" fill="#0E1512"/>
  <circle cx="34" cy="34" r="4" fill="#1C7A5A"/>
</svg>
```
On dark backgrounds, make the ink parts white and keep the green dot green.

### Colours
| Role | Hex |
|---|---|
| Ink (headlines, body) | `#0E1512` |
| Ink soft (sub-text) | `#4A5751` |
| Brand green (primary, accents) | `#1C7A5A` |
| Green deep (hover, dark panels) | `#0F5C42` |
| Green wash (pills, soft fills) | `#EAF6F0` |
| Gold (one sparing accent only) | `#B9935A` |
| Line / border | `#E7E9E5` |
| Page white | `#FFFFFF` |
| Wash (alternating sections) | `#F4F8F5` |

Green is the signature colour. The site is **light and premium — never dark overall.** Dark is only allowed inside a product mockup's sidebar or a single closing call-to-action band.

### Typography
- Use **Plus Jakarta Sans** (Google Fonts), weights 400–800, for everything.
- Do **not** use a serif display face for headlines (no Fraunces, Playfair or Georgia headings). A serif headline on a cream background is the most obvious "AI-generated site" look — avoid it.
- Headlines: bold (700–800), tight line-height (~1.02), slightly negative letter-spacing. Hero headline large (~60px desktop).
- Body: ~17–19px, line-height ~1.6, ink-soft colour.

### Voice & copywriting rules
- Calm, plain, confident. Short sentences. Say what it does.
- No em-dashes used as decoration.
- Never use the word "Gulf."
- No poetic filler or clichés; no buzzwords (leverage, seamless, unlock, empower, revolutionise).
- Currency formatted as `BHD 3.000` (three decimals).
- Present "Arabic and English" as a feature.

---

## 6. Design direction & quality bar

Look at these real products for the level to hit:
- **foodics.com** — bold, confident, full of real product screenshots on tablets and screens, a wall of client logos, testimonials with photos.
- **restaurant.eatapp.co** — cleaner and softer, one big product screenshot in the hero, a ratings strip, a "problems we solve" icon grid, testimonial cards.
- **petpooja.com** — energetic, lots of proof and numbers.

**What makes them look like a real, expensive product (do this):**
1. Large, sharp **product screenshots** in framed shots with a soft shadow — the single most important thing.
2. **Trust signals**: a row of client logos, a star-rating strip, testimonials with a name and venue.
3. **Numbers / stat callouts** (e.g. "+38% repeat guests").
4. Confident sans typography, strong hierarchy, generous whitespace.
5. One accent colour used consistently.

**Avoid (these read as "AI-generated"):**
- A serif headline on a cream / beige background.
- Everything centered in one narrow column.
- Hand-drawn fake mockups instead of real screenshots.
- Tiny generic line-icons as the main hero visual.
- Vague poetic copy with no real product shown.
- Many colours, gradients everywhere, heavy shadows on everything.

---

## 7. What to build

A fast, responsive marketing site (plain HTML + CSS + a little vanilla JavaScript, no framework or build step is fine). Suggested pages:

1. **Home** — hero (headline, sub, two CTAs, product screenshot, trust strip), a three-feature overview, alternating product-showcase rows, social proof (ratings + testimonials), closing CTA.
2. **Product** — a deeper walkthrough of POS, menu & ordering, Lo, reservations, kitchen display and reports, each with a real screenshot.
3. **Pricing** — the three plans above plus a short FAQ.
4. **For agencies** — for people managing multiple venues / white-labelling, with a "what you get" grid.

Shared sticky nav (logo left; Product, Pricing, For agencies, and a green "Start free" button right) and a footer ("Orderlo · Manama, Bahrain").

**Before building visuals, capture real screenshots of the running app** (POS, guest menu on a phone, the Lo assistant, and the reports dashboard) and use those in the hero and showcase rows. Real screenshots are what make it look like a real product rather than a template.

### Definition of done
All pages built and responsive; real product screenshots used (no fake mockups); premium and light; matches the Foodics / Eat App quality bar and does not look like a generic AI template; copy follows the voice rules above.
