# Orderlo — Marketing Website Build Spec

A complete brief for building the Orderlo marketing website from scratch. Written so a fresh builder (human or AI) can produce the full site without any other context. Read all of it before writing code.

---

## 0. The one-paragraph summary

Orderlo is a premium "venue operating system" — one calm web app that runs a restaurant, café or shop's entire floor: point of sale, digital menu and ordering, reservations, kitchen display, loyalty, gift cards, promotions and reports. It is bilingual (English + Arabic), needs no hardware, and is built for the Bahrain / GCC market. The marketing website's job is to make a venue owner think "this looks like a real, expensive, trustworthy product" and start a free trial. Target quality bar: **Foodics, Stripe, Linear, Eat App** — real product screenshots, confident typography, trust signals, generous whitespace.

---

## 1. What we are building

A multi-page marketing website (NOT the app itself — the app is a separate React project). Plain, fast, static site.

Pages:
1. **Home** (`index.html`) — hero + product overview + social proof + CTA
2. **Product** (`product.html`) — deep feature walkthrough
3. **Pricing** (`pricing.html`) — 3 plans + FAQ
4. **For agencies** (`agencies.html`) — for people/agencies managing multiple venues (white-label)

Shared: one stylesheet (`style.css`), one sticky top nav, one footer, one scroll-reveal script.

---

## 2. Tech constraints

- **Plain HTML + CSS + a few lines of vanilla JS.** No React, no framework, no build step. Each page is a standalone `.html` file linking one shared `style.css`.
- Fonts from Google Fonts. Images may be hotlinked from a CDN (Unsplash) OR, preferred, real product screenshots stored in `/img/`.
- One small `IntersectionObserver` script for fade-in-on-scroll. Nothing heavier.
- Must be responsive (looks right on phone + desktop). Mobile: nav collapses, hero stacks vertically.
- Must open correctly by double-clicking the file (no server required).

---

## 3. Brand identity

### Logo
A "loop" mark — a rounded-rectangle loop (one continuous path) with two dot nodes: an ink dot top-left, a green dot bottom-right. It represents "one connected system." Always paired with the wordmark "Orderlo" in a heavy sans weight.

SVG for the mark (use as-is):
```html
<svg width="30" height="30" viewBox="0 0 48 48" fill="none">
  <path d="M14 14 h20 a10 10 0 0 1 0 20 h-20 a10 10 0 0 1 0 -20 z" stroke="#0E1512" stroke-width="3.6"/>
  <circle cx="14" cy="14" r="4" fill="#0E1512"/>
  <circle cx="34" cy="34" r="4" fill="#1C7A5A"/>
</svg>
```
On dark backgrounds, switch the ink parts to white and keep the green dot green.

### Colour palette
| Role | Hex | Use |
|---|---|---|
| Ink (text/dark) | `#0E1512` | Headlines, body |
| Ink soft | `#4A5751` | Sub-text, captions |
| Brand green | `#1C7A5A` | Primary buttons, accents, links |
| Green deep | `#0F5C42` | Button hover, dark panels |
| Green wash | `#EAF6F0` | Pills, soft backgrounds |
| Gold (sparing) | `#B9935A` | One accent only (e.g. underline highlight). Do not overuse. |
| Line | `#E7E9E5` | Borders, dividers |
| Page white | `#FFFFFF` | Main background |
| Wash | `#F4F8F5` | Alternating section background |

Green is the signature. The site is **light and premium — never dark overall** (dark is allowed only inside the product mockup's sidebar or a single closing CTA band).

### Typography
- Headlines + body: **Plus Jakarta Sans** (weights 400/500/600/700/800). Modern, confident, geometric.
- Do NOT use a serif display face for headlines (Fraunces/Playfair/Georgia). Serif-headline-on-cream is the single biggest "AI-generated" tell — avoid it.
- Headline sizing: hero H1 ~60–64px desktop, tight line-height (~1.02), letter-spacing ~-.03em, weight 800.
- Body ~17–19px, line-height ~1.6, weight 400, colour ink-soft.

### Voice / copywriting rules
- Calm, plain, confident. Short sentences. Say what it does.
- NO em-dashes / hyphens as decoration in copy.
- NO the word "Gulf."
- NO poetic filler ("You opened a café, not a call centre" — cut this kind of thing).
- NO "AI-powered" clichés or buzzwords (leverage, seamless, unlock, empower).
- Standalone brand: it's "Orderlo," never "Orderlo by Tawaslo."
- Currency is Bahraini Dinar, formatted to 3 decimals: `BHD 3.000`.
- Bilingual product, so mention "Arabic and English" as a feature.

---

## 4. Design direction (reference-anchored)

Study these three real sites (the user's chosen references):
- **foodics.com** — bold, lots of real product screenshots on tablets/screens, a "Partnering with restaurants everywhere" logo wall (Starbucks, Dunkin, etc.), testimonials with photos. Confident and busy in a good way.
- **restaurant.eatapp.co** — cleaner, softer, guest-experience feel; big single product screenshot in hero; ratings row (G2, Capterra 4.7★); "we solve your problems" icon grid; testimonial cards.
- **petpooja.com** — energetic, colourful, dense with proof and numbers.

### What makes them look like a real $10K product (copy this):
1. **Real product screenshots**, large and sharp, in browser/device frames with soft shadows. This is 80% of it.
2. **Trust signals**: a row of client logos, a star-rating strip, testimonials with names + venue + photo.
3. **Numbers**: stat callouts ("+38% repeat guests", "30,000+ restaurants").
4. **Confident sans typography**, generous whitespace, strong hierarchy.
5. **One accent colour** used consistently.

### What to AVOID (the "made by AI" fingerprints):
- Serif headline on a cream/beige background.
- Everything centered in one narrow column.
- Hand-drawn CSS "fake" mockups instead of real screenshots.
- Tiny generic line-icons as the main hero visual.
- Poetic, vague copy with no real screenshots.
- Rainbow of colours; gradients everywhere; heavy drop shadows.

---

## 5. Assets to capture first

Before building visuals, capture **real screenshots of the actual Orderlo app** (it runs via `npm run dev` in the app repo) and save to `/site/img/`:
- `pos.png` — the point-of-sale screen (menu grid + live order panel)
- `menu.png` — the guest menu on a phone
- `lo.png` — the Lo assistant chat panel
- `reports.png` — the reports/dashboard screen
- `kds.png` — the kitchen display (optional)

Plus 1–2 real food/café photos for atmosphere (Unsplash is fine if no originals).

These real screenshots replace every fake mockup. This is the most important step.

---

## 6. Page-by-page spec

### 6.1 Global — Top nav (all pages)
- Sticky, white with slight translucency + blur, thin bottom border.
- Left: loop logo + "Orderlo" wordmark (~22px, weight 800).
- Right: text links "Product", "Pricing", "For agencies", then a green primary button "Start free".
- Current page's link is highlighted.
- Mobile: links collapse into a menu button.

### 6.2 Global — Footer (all pages)
- Loop logo, a row of links (Product, Pricing, For agencies, Talk to us), and the line "Orderlo · Manama, Bahrain."
- Light background, thin top border.

### 6.3 Home — Hero (top of index.html)
Two-column layout (text left, product shot right), NOT centered.
- **Eyebrow pill**: green wash pill, dot + "The venue operating system".
- **H1**: "Run your whole venue from one screen." — big, bold sans, with a subtle gold underline highlight on "one screen".
- **Sub**: "Point of sale, menus, orders, reservations, loyalty and gift cards — one calm system your team runs in Arabic and English. Live this afternoon." (2 lines max)
- **Two buttons**: primary green "Start free →", secondary white "See what it does".
- **Assurance row**: three items with green ticks — "No card to start", "No hardware", "Set up in minutes".
- **Right side**: the real POS screenshot (`img/pos.png`) inside a browser frame with a soft shadow. Overlap a small floating stat card on a corner: "+38% repeat guests this month".
- Subtle green radial glow behind the shot (very light, not a heavy gradient).

### 6.4 Home — Trust strip
Just below hero: "Trusted by venues across Bahrain" (uppercase, tracked, muted) + a row of venue name/logos (L'ORTO, Marina Café, Adliya Roast, Seef Bistro, Block 338). Muted, evenly spaced.

### 6.5 Home — "One system" feature trio
Section heading: eyebrow "One system", H2 "Everything the floor needs.", one supporting line.
Three cards, each: an icon, a title, one sentence, a "See how it works →" link:
1. **Point of sale** — Tips, split payments, gift cards, discounts, refunds and shift reports. On any tablet.
2. **Menu & ordering** — A branded, bilingual menu guests open by QR, with pickup, bookings and seasonal covers.
3. **Loyalty & gift cards** — Reward regulars automatically and sell store credit, redeemed at the counter.

### 6.6 Home — Big product showcase (alternating rows)
2–3 alternating image/text rows using the real screenshots:
- Row A (image right): "A till that does the whole job." + POS screenshot.
- Row B (image left): "A menu worth showing off." + phone menu screenshot.
- Row C (image right): "Run the venue by chatting." + Lo screenshot.
Each row: a small green label, an H2, a paragraph, and 2–3 ticked bullets.

### 6.7 Home — Social proof
A rating strip ("Loved by operators", stars, "4.9 average") + 2–3 testimonial cards (quote, name, venue). Use realistic placeholder testimonials clearly marked as placeholders.

### 6.8 Home — Closing CTA
A single confident band (this ONE section may use the deep-green background): H2 "Open Orderlo this afternoon.", sub "Fourteen days free. No card, no hardware, no installer.", green/white "Start free" button.

### 6.9 Product page
Hero: eyebrow "The product", H1 "One system, the whole floor.", supporting line. Then the alternating showcase rows (POS, menu, Lo) in more depth, each with real screenshots and 3 bullets. Then an "And more" band with 3 smaller cards: Reservations, Kitchen display, Reports & Excel. Closing CTA.

### 6.10 Pricing page
Hero: "Start free. Grow when you are ready." + "Fourteen days free on any plan. No card to start, cancel anytime."
Three plan cards (middle one "Most popular", accented):
- **Starter — Free / 14 days**: Menu, QR & guest ordering; Counter POS; Reservations; One venue.
- **Pro — BHD ·· / month** (most popular): Everything in Starter; Promotions, loyalty & gift cards; Kitchen display & full POS; Reports & Excel export.
- **Brand — Custom**: Everything in Pro; Many branches, one view; Own-brand app option; Priority support.
Then a 4-item FAQ: no card to start, no hardware needed, multi-branch on Brand, own-brand app on Brand. Closing CTA.

### 6.11 For agencies page
Hero: eyebrow "For agencies", H1 "Give your venues a system to run on.", supporting line about managing multiple venues and white-labelling. Then a 6-card "What you get" grid: Set up in minutes; Branded as theirs; One place to manage; Own-brand apps; Menus that sell; Real reporting. Closing card CTA "Let us set up your first venue."

---

## 7. Components & tokens (for style.css)

- **Buttons**: radius 12px, padding ~12px 22px, weight 600. Primary = green bg, white text, soft green shadow, darken on hover + lift 1px. Secondary = white bg, ink text, thin border, wash on hover.
- **Cards**: white bg, 1px line border, radius 12–16px, generous padding. Soft shadow only on raised/product elements — not everywhere.
- **Section rhythm**: alternate white and wash backgrounds. Vertical padding ~80–96px desktop.
- **Container**: max-width ~1200px, side padding 32px.
- **Product frame**: white, 1px border, radius ~20px, soft layered shadow (`0 24px 60px -20px rgba(14,40,30,.28)`), browser bar with 3 dots + a faint URL "app.orderlo.store".
- **Reveal on scroll**: elements start slightly down + transparent, fade/rise in when they enter the viewport via IntersectionObserver.

---

## 8. Definition of done

- All four pages built, sharing one stylesheet, nav and footer.
- Real product screenshots used in hero + showcase rows (no fake CSS mockups).
- Looks premium and light, matches the Foodics/Eat App quality bar, and does NOT look like a generic AI template (see section 4 avoid-list).
- Fully responsive; opens by double-click; no console errors.
- Copy follows the voice rules in section 3 (no em-dashes, no "Gulf", no filler, BHD 3 decimals).

---

## 9. A reference hero already exists

`hero-reference.html` in this folder is a hand-built example of the intended hero direction (bold sans headline, product frame, floating stat card, trust strip, green accent, light layout). Use it as the visual source of truth for the home hero, then extend that language across all pages. Swap its fake mockup for the real `img/pos.png` screenshot when available.
