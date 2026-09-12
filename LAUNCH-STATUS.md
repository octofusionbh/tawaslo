# Tawaslo — Launch status: what's LIVE vs PENDING (2026-07-25)

Hidden from subscribers (only `octofusionbh@gmail.com` sees them): Inbox, Ads, WhatsApp, Business Profile (nav) + LinkedIn/X/YouTube/Google connect cards. Flip back on per feature as each is approved.

## ✅ LIVE for customers (core product — proven, subscriber using it)
- Instagram: connect, publish, schedule, carousels + per-slide captions, analytics
- Facebook Pages: publish
- TikTok: publish (approved — verify `TIKTOK_CLIENT_KEY` env is set in Vercel)
- Scheduler, Planner, Approvals, Dashboard, Analytics, Reports (real data)
- Clients, Team, Billing, Settings, AI Studio, Media, Trending, Win Clients, Suggested, Campaigns
- Full restaurant suite: Concierge, Menu, Pickup Orders, Reservations, Loyalty, Reviews, Guests, Fill My Tables

## ⏳ PENDING — needs approval or setup

| Feature | Permission / dependency | Status | Next step | Where to check |
|---|---|---|---|---|
| **Inbox** (IG comments + DMs) | `instagram_business_manage_comments`, `_manage_messages` | **SUBMITTED → REJECTED** | Get rejection reason → fix screencast/instructions → resubmit | Meta App Dashboard → App Review + Alert Inbox |
| **WhatsApp** | `whatsapp_business_messaging`, `_management` | **NOT submitted / not set up** | Add WhatsApp product → number (SIM) → approve a template → send/receive test → submit for Advanced Access | Meta App Dashboard → WhatsApp + App Review |
| **Ads + boosting** | `ads_management`, `ads_read` | **NOT submitted** ("Ready for testing" = standard only) | Finish Ads feature (#60) → submit for App Review | Meta App Dashboard → App Review |
| **Google Business Profile** | Google Business Profile API + OAuth | **NOT started** | Google Cloud project → apply for Business Profile API access (Google review) → OAuth creds → set `GOOGLE_CLIENT_ID`/secret | Google Cloud Console + approval email |
| **YouTube** | YouTube Data API + OAuth | **NOT set up** | Google Cloud → enable API → OAuth (posting may need an audit) → set `YOUTUBE_CLIENT_ID` | Google Cloud Console |
| **LinkedIn** | LinkedIn app + posting products | **NOT set up** (`LINKEDIN_CLIENT_ID` missing) | LinkedIn Developer app → request Community Management/posting products (LinkedIn review) → set `LINKEDIN_CLIENT_ID` | LinkedIn Developer Portal → Products |
| **X (Twitter)** | X API (paid tier) | **Built but HELD** | Decide on paid X API tier (Basic ~$100/mo for posting) → keys → env | X Developer Portal |

## Priority order (fastest → biggest)
1. **Inbox resubmit** — already submitted once, closest to done. Need the rejection reason.
2. **WhatsApp** — SIM arriving; docs ready (`Tawaslo-WhatsApp-MetaReview.md`, `WHATSAPP-TEMPLATES.md`, screencast scripts). Submit alongside Inbox.
3. **Ads** — needs the Ads feature finished first, then submit.
4. **Google Business / YouTube / LinkedIn** — each is its own dev-account + review project.
5. **X** — only if the paid tier is worth it.

## Notes
- Meta permissions already approved & live: `instagram_business_basic`, `_content_publish`, `_manage_insights`, `pages_show_list`, `pages_read_engagement`, `public_profile`.
- `business_management` = "Ready for testing" (needed for full Facebook connect) — bundle into the next Meta submission.
- Claude can't read approval emails — paste rejection reasons / statuses and I'll act on them.
