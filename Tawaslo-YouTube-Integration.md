# Tawaslo — YouTube Integration

Built to match the existing platform pattern (Instagram / Facebook / LinkedIn / TikTok). This doc covers **what clients get**, **what analytics are available**, **what's shipped vs. next**, and the **Google setup** to switch it on.

---

## 1. Why YouTube matters for your clients

YouTube is the #2 search engine in the world and the dominant long-form + Shorts video platform — something none of your other connected networks fully cover. For an agency, adding YouTube means:

- **One more channel under management** — more value per client, a reason to upsell, and parity with (or ahead of) Hootsuite/Buffer/Later, who treat YouTube as an add-on.
- **Reach the audience that lives on video** — GCC audiences over-index on YouTube for how-to, product, food, and entertainment content. Clients in F&B, retail, education, and real estate especially benefit.
- **Repurpose what they already make** — the same vertical video that goes to TikTok/Reels can post to **YouTube Shorts**; landscape cuts become full uploads. One shoot, every platform.
- **Evergreen discovery** — unlike a feed post that dies in a day, a YouTube video keeps earning views and subscribers for months. That's a strong retention story for the client.
- **Cross-channel reporting** — clients see YouTube next to Instagram/TikTok in one analytics view and one branded PDF, instead of logging into YouTube Studio separately.

**The pitch to a client:** *"We now manage, schedule, preview, and report on your YouTube channel in the same place as everything else — including subscribers, views, and watch time."*

---

## 2. Analytics clients can get

Pulled live from the YouTube Data API + YouTube Analytics API (same shape as the Instagram analytics, so it renders in the existing Analytics page and the branded PDF):

**Channel level**
- Subscribers (shown as "followers")
- Total channel views (shown as "reach")
- Total video count
- Channel name, handle, avatar, description

**Last-30-days time series** (needs the analytics scope — see setup)
- Daily **views**
- **Estimated watch time** (minutes) — the metric YouTube itself optimizes for

**Per-video (recent uploads)**
- Title, thumbnail, publish date
- Views, likes, comments per video
- A computed **engagement rate** (likes + comments ÷ videos ÷ subscribers)

> If only the basic scope is granted, channel stats + per-video stats still work; the daily watch-time chart simply stays empty until the analytics scope is approved.

---

## 3. What's shipped in this build

| Piece | Status | Where |
|---|---|---|
| **Connect a YouTube channel** (OAuth) | ✅ Done | Connections page card is now live (was "Coming soon") |
| **OAuth token exchange + channel info** | ✅ Done | `api/linkedin-oauth.js` (`provider: 'youtube'`, `state=yt`) |
| **YouTube post preview** | ✅ Done | Publisher live preview — 16:9 video card with play badge, title, channel, action row |
| **YouTube analytics** (channel + videos + watch time) | ✅ Done | `api/instagram-analytics.js` (`platform: 'youtube'`) → Analytics page |
| **Publishing / video upload** | ⏳ Next phase | See §5 |

Everything above is **frontend + read APIs**, so it works the moment the Google credentials are set — no posting approval needed to connect, preview, and report.

---

## 4. Google setup (to switch it on)

Do this once in **Google Cloud Console** (console.cloud.google.com):

1. **Create a project** (or reuse one) → **APIs & Services → Enable APIs**: enable **YouTube Data API v3** and **YouTube Analytics API**.
2. **OAuth consent screen** → External → fill app name (Tawaslo), support email, logo, homepage `https://tawaslo.com`, privacy `https://tawaslo.com/privacy`, terms `https://tawaslo.com/terms`.
3. **Scopes** — add:
   - `.../auth/youtube.upload` (publish videos — phase 2)
   - `.../auth/youtube.readonly` (channel + videos)
   - `.../auth/yt-analytics.readonly` (watch-time charts)
4. **Credentials → Create OAuth client ID → Web application**:
   - **Authorized redirect URI:** `https://tawaslo.com/api/linkedin-oauth`  *(YouTube is folded into that handler to stay under Vercel's 12-function cap, exactly like TikTok/X)*
   - Copy the **Client ID** and **Client secret**.
5. **Vercel → Settings → Environment Variables** (Production), then redeploy:
   - `YOUTUBE_CLIENT_ID` = the client ID
   - `YOUTUBE_CLIENT_SECRET` = the client secret
   - `REACT_APP_YOUTUBE_CLIENT_ID` = the **same** client ID (the frontend builds the auth URL with this)
6. **Google verification:** while the app is in *Testing*, add your channel's Google account as a **Test user** and connecting works immediately. To open it to all clients, submit for **Google OAuth verification** (similar to Meta's review — needs the consent-screen details above + a demo video; `youtube.upload` is a sensitive scope and gets the most scrutiny).

After step 5, the **Connect** button on the YouTube card goes live, previews render, and analytics pull real numbers.

---

## 5. Publishing (the next phase)

Connecting, previewing, and analytics are done. **Posting a video to YouTube** is intentionally phase 2 because video upload is heavier than a text/image post:

- YouTube uses a **resumable upload** protocol for the video file. Large files don't fit cleanly in a single serverless request, so the clean implementation is either a **client-side resumable upload** straight to YouTube (browser → Google, with our token) or a small dedicated upload worker.
- It rides the `youtube.upload` scope (already requested in the connect flow) and Google's review of that sensitive scope.

**Recommended build order for phase 2:** browser-side resumable upload from the composer → set title (caption), description, privacy (public/unlisted/private), and Shorts flag → poll processing status → log to `social_accounts`/posts like the other platforms.

---

## Quick test checklist (once env vars are set)
1. Connections page → **YouTube → Connect** → pick a Google account that owns a channel → it saves and shows the channel name + subscriber count.
2. Publisher → with the YouTube account selected (top "Viewing" filter → it appears) → the preview shows the **16:9 YouTube card**.
3. Analytics → select the YouTube account → subscribers, views, and recent videos load live.
