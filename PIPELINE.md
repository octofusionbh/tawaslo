# Tawaslo — Build pipeline (after the Codex redesign is wired)

Everything here was **designed by Codex but has no real source yet**, so it is hidden on
live data rather than faked. This is the to-build list once every page is converted.

Status key: 🟥 needs a database column · 🟨 needs an integration or API · 🟦 needs product thinking

## Schema gaps — restaurant suite

| Page | Missing | Needs |
|---|---|---|
| Reservations | Bookings on/off switch | 🟥 `booking_settings.enabled` |
| Reservations | Minimum notice, book-ahead window | 🟥 two columns on `booking_settings` |
| Reservations | Table turn duration, held-slot grace | 🟥 columns on `booking_settings` |
| Reservations | Largest online party | 🟥 own column (today's `capacity` is seats-per-slot) |
| Reservations | Table "out of service" | 🟥 `dining_tables.out_of_service` |
| Reservations | Space type (indoor / outdoor / separate floor) | 🟥 `dining_rooms.type` |
| Reservations | Table width and depth | 🟥 two columns on `dining_tables` |
| Reservations | Guest experience / booking preview tab | 🟦 depends on all of the above |
| Menu | Featured dish | 🟥 `menu_items.featured` |
| Menu | Multiple menus per client | 🟥 today one `menus` row per client |
| Menu | Menu type, introduction, service note | 🟥 columns on `menus` |
| Menu | Brand colours + font | 🟥 `menus.theme` is a preset name, not a palette |
| Menu | Dish photos, plate artwork, visual layout | 🟥 no photo column on `menu_items` |
| Menu | Preparation time in minutes | 🟥 `menu_items.lead_hours` is whole hours |
| Menu | Category guest note | 🟥 categories are bare strings |
| Menu | Menu import | 🟨 no backend |
| Guests | Lifetime spend, visit count, tags | 🟥 columns on `guests` + reliable guest matching |

## Missing signals — analytics and dashboard

| Page | Missing | Needs |
|---|---|---|
| Analytics | Impressions, profile views | 🟨 retired by Meta — find a replacement metric |
| Analytics | Facebook / LinkedIn / TikTok figures | 🟨 only Instagram is wired today |
| Analytics | Audience quality (returning, engaged, non-follower) | 🟨 derive from Meta insights |
| Analytics | Channel comparison table, top post | 🟨 needs per-network analytics |
| Analytics | Link clicks | 🟨 join `short_links` clicks to posts |
| Dashboard | Creative signals (best time, strongest format) | 🟦 real analysis over the client's own history |
| Dashboard | "Ideas for you" | 🟨 wire to the real Suggested engine |
| Dashboard | "Needs changes" vs "awaiting approval" split | 🟥 approvals need a status of their own |
| Inbox | Priority, mood, AI reply suggestions | 🟨 AI pass over each message |

## Features Abdulla asked for

| Item | Notes |
|---|---|
| Alt text | Already applies to image posts; extend across media library and approvals |
| Reel music | Track choice on reels |
| Google / Apple sign-in | After launch, once sign-ups reopen |
| Code splitting | Bundle is ~780 kB gzip; needs TawasaloApp.js split by route |

## Housekeeping

| Item | Notes |
|---|---|
| Old media URLs | Posts still point at the old Supabase project's storage — needs re-upload |
| Every `*classic` route | Old pages kept reachable as a fallback; remove once the new ones are proven |

## Added while wiring Orders and Loyalty

| Page | Missing | Needs |
|---|---|---|
| Orders | Service types (delivery, shipping) | 🟥 only pickup exists on `menus` |
| Orders | Location, business timezone, tax display | 🟥 columns on `menus` |
| Orders | Scheduled-orders toggle | 🟥 `pickup_days_ahead` is always in force |
| Orders | Live order destination, order email, reference prefix | 🟥 `order_no` is random today |
| Orders | Customer status updates, checkout languages and note | 🟥 columns |
| Orders | Link and QR | 🟨 ShareGenerator builds demo URLs |
| Loyalty | "63% of members returned" | 🟨 needs a return-rate calculation |
| Loyalty | Recent return activity feed | 🟥 no activity table |
| Loyalty | "Regulars who have not returned" + Bring-back filter | 🟦 needs lapsed-member logic |
| Loyalty | Member memory (favourite, note) | 🟥 columns on `loyalty_cards` |
| Loyalty | Business type, program name, qualifying action, expiry | 🟥 columns on `loyalty_programs` |
| Loyalty | Card serial number | 🟥 no serial column |

## Added while wiring Reviews, Guests and Fill My Tables

| Page | Missing | Needs |
|---|---|---|
| Reviews | Rating trend ("+0.3 this month") | 🟦 compare periods |
| Reviews | Customer signals (quality, service, value, speed) | 🟨 analyse review text |
| Reviews | "Opportunity this week" | 🟦 product thinking |
| Reviews | Would-recommend %, response rate | 🟥 columns |
| Reviews | Touchpoints board, private-feedback prompt | 🟥 columns on `review_settings` |
| Reviews | Review tags, replies and status | 🟥 columns on `reviews` (replies are session-only today) |
| Guests | Remembered spend | 🟥 column on `guests` |
| Guests | Preferred table or seat | 🟥 column |
| Guests | Country-code picker | 🟦 one `phone` column today |
| Guests | "Returning guests %" / "Known preferences %" | 🟦 define the measure |
| Fill My Tables | Recoverable covers, expected-lift band | 🟦 needs a model |
| Fill My Tables | Floor-plan dots | 🟥 no booking-to-table link |
| Fill My Tables | Per-guest signals (near the venue, no booking) | 🟨 location + booking join |
| Fill My Tables | Audience presets (regulars, nearby, no booking) | 🟥 no stored equivalent |

## Added while wiring Concierge and Campaigns

| Page | Missing | Needs |
|---|---|---|
| Concierge | Unread counts, Open/Done status, conversation type | 🟥 columns on `wa_threads` |
| Concierge | Intent, priority, assigned owner | 🟥 columns |
| Concierge | Service cue ticket ("hold this table") | 🟦 link threads to bookings |
| Concierge | Per-message timestamps and read receipts | 🟥 `messages` stores role + content only |
| Concierge | First-response time | 🟦 needs message timestamps first |
| Concierge | Guest recorded spend | 🟥 column on `guests` (same gap as Guests page) |
| Campaigns | Posts belonging to a campaign | 🟥 `posts.campaign_id` does not exist |
| Campaigns | Approval progress, content progress | 🟦 depends on the link above |
| Campaigns | Campaign artwork / contact sheet | 🟦 depends on the link above |

## Added while wiring Suggested and Link in bio

| Page | Missing | Needs |
|---|---|---|
| Suggested | Priority rank, "rising locally" signal, act-this-week moment | 🟦 an actual ranking model |
| Suggested | Suggested platform, format and timing | 🟦 product thinking |
| Suggested | "Why it fits this brand" | 🟨 AI pass against the brand voice |
| Suggested | Category tabs | 🟥 RSS items carry no category |
| Link in bio | Page views, unique views, click rate | 🟥 nothing records a bio page view — needs a view counter |
| Link in bio | Subscribers / email signup | 🟨 no signup implementation at all |
| Link in bio | Traffic sources, 14-day activity chart | 🟥 depends on the view counter |
| Link in bio | **QR code** | 🟨 Codex's generator draws a random pattern, NOT a scannable code. The `qrcode` package is already installed — small job, real value |
| Link in bio | Campaign attribution, scheduled content, owned audience | 🟨 advertised but unimplemented |
| Link in bio | Several bio pages per client | 🟦 the redesign models exactly one |
