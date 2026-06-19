# Tawaslo — WhatsApp Business Module (Spec)

**Status:** build-ready · **Gating:** Enterprise plan only ($199) · **API:** Meta WhatsApp Cloud API (direct)

---

## 1. Why & positioning
WhatsApp dominates the GCC. Hootsuite doesn't seriously compete here for the region. A WhatsApp broadcast + support inbox inside Tawaslo, reusing our Brand Voice + Reply Assistant AI, is a genuine differentiator and a premium upsell anchor.

- **Click-to-chat (wa.me)** stays **free on every plan** — costs nothing, needs no API, spreads the brand virally through every client bio.
- **Full module** available on **Professional + Enterprise**, metered by a **broadcast credit allowance** (mirrors the existing AI image-pack model).

### Credit model (mirrors IMG_PACKS / top-ups)
| Plan | WhatsApp module | Support inbox | Included broadcast credits/mo | Buy more |
|---|---|---|---|---|
| Starter $49 | click-to-chat only | — | — | — |
| Professional $99 | full | unlimited (free) | ~1,000 | yes (top-up packs) |
| Enterprise $199 | full | unlimited (free) | ~5,000 | yes (top-up packs) |

- **1 credit = 1 outbound marketing message.** Service-window replies are **unmetered** (free to us).
- **Top-up packs priced off the worst-case (UAE ~$0.05) rate** so we never lose money on any country; healthy margin on Saudi/Bahrain (~$0.012).
- Allowance numbers above are sensible defaults — adjustable.

## 2. The API choice — Cloud API direct
Meta hosts it, **zero platform fee**, pay only Meta's per-message base rates. No BSP markup (Twilio/360dialog add $0.003–0.01/msg). We already have a verified Meta Business account + Ads connection, so setup is mostly done.

### Per-message economics (2026, GCC)
| Category | When | Saudi | UAE |
|---|---|---|---|
| **Service** | reply within 24h of customer msg | **FREE** | **FREE** |
| **Utility** | order/appointment updates | ~$0.0014 | ~$0.016 |
| **Marketing** | broadcasts/offers | ~$0.012 | ~$0.05 |
| Ad click-to-WhatsApp | 72h window | FREE | FREE |

**Revenue angle:** bundle "X broadcasts/month" into Enterprise, or bill per-broadcast with margin. Support inbox runs at $0.

## 3. Meta-side setup (the user must do this — I can't)
1. In Meta Business Suite → add a **WhatsApp Business Account (WABA)**.
2. Register a **dedicated phone number** (not used on the WhatsApp consumer app).
3. Add the **WhatsApp product** to the existing Tawaslo Meta app.
4. Request the **`whatsapp_business_messaging`** + **`whatsapp_business_management`** permissions in App Review (separate from the IG ones — bundle into the same review cycle once June 7 clears).
5. Create + submit **message templates** for approval (marketing/utility). Templates must be pre-approved before sending.
6. Set the **webhook URL** to `https://tawaslo.com/api/meta-publish` (verify token = `WA_VERIFY_TOKEN`; subscribe to the `messages` field).

## 4. Features (build order)
1. **Team inbox** — same UI as the Instagram inbox; inbound messages via webhook; agents reply within 24h window (free). **Reuses Reply Assistant + Brand Voice.**
2. **Broadcast campaigns** — pick an approved template, choose an opted-in contact list, schedule/send. Cost preview before send.
3. **Contacts & opt-in** — list with consent flag + tags; CSV import; only opted-in numbers can be broadcast to.
4. **Templates** — create/sync approved templates; show approval status.
5. **Automations & Flows ("animated" experiences)** — modern interactive messaging, all on Cloud API:
   - **Reply buttons** (up to 3 tappable buttons) + **list menus** (up to 10 options) — tap, don't type.
   - **WhatsApp Flows** — multi-screen forms *inside* the chat (book appointment, pick product, sign up, feedback). The app-like experience.
   - **Carousels** — scrollable media/product cards; shoppable catalog up to 30 items.
   - **Typing indicator** ("business is typing…") while the AI drafts.
   - **Bot flow builder**: inbound msg → button reply → Flow form → logged lead/booking, in the client's brand voice, on the free 24h service window.
6. **Click-to-WhatsApp** — already live in bio + share sheets (free tier).

## 5. Technical (as built)
- **Endpoint:** folded into **`/api/meta-publish`** (we were at Vercel's 12-function cap, so WhatsApp shares that file — no new function). Requests carry `channel:'whatsapp'`.
- **Webhook URL (set this in Meta):** `https://tawaslo.com/api/meta-publish`
  - GET verify → checks `WA_VERIFY_TOKEN`, echoes `hub.challenge`.
  - POST inbound (`object:'whatsapp_business_account'`) → best-effort insert into `wa_messages`, always 200.
- **Send actions** (POST `channel:'whatsapp'`): `action:'send'` (text), `'template'`, `'interactive'` (buttons/list/flow), `'read'`. Hits Graph `/{phone_id}/messages`. Per-client `token`/`phoneId` can be passed in the body; otherwise account-level env.
- **Tables (whatsapp-setup.sql):** `wa_messages`, `wa_contacts`. (Templates/broadcasts can live client-side until needed.)
- **Gating:** owner account = unlimited + "demo" badge; `pro|professional|agency|enterprise` → full; blank/Starter → locked. Click-to-chat ungated.
- **Env to add in Vercel (only when connecting):** `WA_TOKEN`, `WA_PHONE_ID`, `WA_VERIFY_TOKEN`, plus `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` for inbound logging.

## 6. What I can build now vs. what's blocked
- **Build now:** the entire in-app module (inbox UI, broadcast composer, contacts, templates, automations, gating, the `/api/meta-publish` WhatsApp handler). Fully demoable with sample data.
- **Blocked on Meta:** *live* sending/receiving — needs the WABA, phone number, template approval, and the new permissions (step 3). Bundle with the IG App Review.
