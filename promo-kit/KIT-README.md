# Tawaslo — Feature Snippet Kit

Animated product snippets to extend the V1 web promo. Built to match the existing
neon-purple / glass-panel / 3D style, in the same format so they drop straight into the timeline.

**Format:** 1080 × 1920 (vertical), 25 fps, H.264 / yuv420p. Same as `Tawaslo-web promo en-20-7-2026-V1`.

There are two ways to use this kit:
1. **Ready** — drop the finished `.mp4` clips (or the whole reel) straight into the edit.
2. **Editable** — take the transparent panel PNGs + background element and animate/restyle them yourself,
   or open the source and re-render anything.

---

## 1) Ready clips  (`ready-clips/`)

Each feature is its own clip (~4.6–5.0s) with a fly-in panel, live micro-interactions, and a caption.

| File | Feature | Caption |
|---|---|---|
| `01_dashboard.mp4` | One dashboard / analytics | Run every brand **from one screen** |
| `02_planner.mp4` | Plan & auto-publish | A month of content, **scheduled in minutes** |
| `03_ai.mp4` | AI Studio (captions, Arabic) | AI writes, replies **and sells — in Arabic** |
| `04_whatsapp.mp4` | WhatsApp engine | Orders & bookings, **straight to WhatsApp** |
| `05_google.mp4` | Google Business | Win on Google — **reviews on autopilot** |
| `06_menu.mp4` | Living menu | Update your menu live, **never reprint again** |
| `07_pickup.mp4` | Pickup ordering | Take orders direct — **skip the delivery cut** |
| `08_reservations.mp4` | Reservations | It books the table **while you run the floor** |
| `09_audience.mp4` | Who it's for | Built for the way you work (agencies / freelancers / corporates / restaurants & shops) |

- `tawaslo_features_reel.mp4` — all nine stitched in order (~43s), ready to append to V1.

**Eyebrow labels** (small tracked caps at top of each clip):
ONE DASHBOARD · PLAN & AUTO-PUBLISH · AI STUDIO · WHATSAPP ENGINE · GOOGLE BUSINESS ·
LIVING MENU · PICKUP ORDERING · RESERVATIONS · BUILT FOR EVERYONE

---

## 2) Editable assets  (`editable/`)

- `panels/*_panel.png` — each UI panel as a **transparent, high-res PNG** (neon glow included, no background).
  Drop over your own background and animate however you like (fly-in, parallax, zoom).
- `background/tawaslo_bg_still.png` — the purple starfield background as a still.
- `background/tawaslo_bg_loop.mp4` — the animated background on its own (subtle star twinkle), loopable.

That combination lets an editor rebuild any scene from scratch: background layer + panel layer + your own text.

---

## 3) Source  (`source/`)

Node scripts that generate everything (no browser needed — pure canvas → ffmpeg).

- `lib.js` — background, glass panel, logo lockup, cursor, toast, caption helpers.
- `bodies.js` — the UI content for each feature (dashboard, planner, ai, whatsapp, google, menu, pickup, reservations, audience).
- `engine.js` — scene definitions (copy, durations, order) + the per-frame compositor.
- `mkvideo.js` / `mkbg.js` — render a scene / the background to mp4.

**Re-render after editing copy or timing:**
```
npm install                       # installs @napi-rs/canvas
node mkvideo.js dashboard full ready-clips/01_dashboard.mp4
```
Scene copy, durations and order all live at the top of `engine.js` (the `SCENES` object) — change text there and re-render.

---

## Brand spec (so restyling stays on-model)

**Colors**
- Background: `#341560` → `#1C0F3C` → `#0A0617` (radial, top-centre)
- Magenta glow (lower): `#C4369E`  · Violet bloom (top): `#965AFF`
- Neon panel rim: `#FF62AD` → `#A855F7` → `#5F8DFF`
- Caption keyword gradient: `#FF77BF` → `#7AA2FF`
- Eyebrow gradient: `#FF8FCE` → `#8FB0FF`
- Success / WhatsApp green: `#34D399` · `#25D366`
- Review stars gold: `#F4C150`
- Body text: `#FFFFFF` headings · `#C9B6E6` / `#A08FC0` muted

**Type**
- Rendered with Liberation Sans Bold/Regular (Arial/Helvetica-equivalent). In your editor use **Arial Bold / Helvetica Bold** for a match.
- Symbols (stars, triangles) use DejaVu Sans.
- Captions: bold, centered; line 1 white, line 2 = gradient keyword.

**Motion**
- Panel: fly up from below + fade + slight scale (ease-out ~0.9s), then a gentle float.
- Content animates in staggered (cards/rows/messages appear one by one); numbers count up; a soft light-sweep crosses the panel; cursor + a live notification for the dashboard.
- Caption fades/rises in around the 1s mark.

No emojis anywhere (by design).
