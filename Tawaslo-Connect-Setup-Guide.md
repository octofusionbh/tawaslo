# Tawaslo — Connecting TikTok, LinkedIn & X

A follow-along guide to switch each network on. Everything is already built in the app;
this is just creating the developer apps, copying the keys into Vercel, and (for TikTok/LinkedIn)
submitting the review.

---

## The one thing that's the same for all three

Every network uses the **same redirect URL**:

```
https://tawaslo.com/api/linkedin-oauth
```

Paste that exact URL into each portal's "redirect URI / authorized redirect URL" box —
including TikTok and X. (It says "linkedin" because all three share one backend handler;
that's intentional and correct.)

After you add any `REACT_APP_*` key in Vercel you must **redeploy** (run `fix_and_push.bat`),
because those keys are baked into the app at build time.

---

## 1) LinkedIn  (easiest — do this first)

LinkedIn must be tied to a **LinkedIn Company Page**. If Tawaslo doesn't have one yet,
create the Page first (it's free), then come back.

**Create the app**
1. Go to https://developer.linkedin.com → **My apps** → **Create app**.
2. App name: `Tawaslo`. Select your **LinkedIn Page**. Add your **Privacy policy URL**
   (`https://tawaslo.com/privacy`). Upload the logo. Create.

**Add the products** (Products tab — request each)
- **Sign In with LinkedIn using OpenID Connect** — usually instant.
- **Share on LinkedIn** — gives `w_member_social` (post as a person). Usually instant.
- **Community Management API** — *only if you want to post to company Pages.* This one
  needs review and a registered business (legal name + address). Skip for now if you just
  want personal-profile posting; add it after the CR.

**Set the redirect URL** (Auth tab)
3. Under **OAuth 2.0 settings → Authorized redirect URLs**, add:
   `https://tawaslo.com/api/linkedin-oauth`
4. Copy the **Client ID** and **Client Secret** from the Auth tab.

**Add to Vercel** (Project → Settings → Environment Variables)
```
LINKEDIN_CLIENT_ID         = <Client ID>
LINKEDIN_CLIENT_SECRET     = <Client Secret>
REACT_APP_LINKEDIN_CLIENT_ID = <Client ID>     ← same value, used by the front-end
```
5. Redeploy (`fix_and_push.bat`). Open the app → **Social accounts → LinkedIn → Connect**.

> Reference: [LinkedIn — create app & products](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)

---

## 2) TikTok

**Create the app**
1. Go to https://developers.tiktok.com → register → **create an organisation** →
   **add a new app** inside it.
2. Fill the app details and add your **Privacy policy URL** and **Terms URL**
   (`https://tawaslo.com/privacy`, `https://tawaslo.com/terms`).

**Add the products**
- **Login Kit** — required for connecting an account.
- **Content Posting API** — and turn **ON** the **Direct Post** feature.

**Set the redirect URI** (Login Kit configuration)
3. Add redirect URI: `https://tawaslo.com/api/linkedin-oauth`
4. Make sure these scopes are requested: `user.info.basic`, `video.upload`, `video.publish`.
5. Copy the **Client Key** and **Client Secret** (Manage apps).

**Add to Vercel**
```
TIKTOK_CLIENT_KEY            = <Client Key>
TIKTOK_CLIENT_SECRET         = <Client Secret>
REACT_APP_TIKTOK_CLIENT_KEY  = <Client Key>     ← same value, front-end
TIKTOK_PRIVACY               = SELF_ONLY         ← leave as-is until audited (see below)
```
6. Redeploy. The TikTok card in **Social accounts** becomes connectable.

**Submit for review** (required before posts can be public)
- Until TikTok audits the app, every post is forced **private (SELF_ONLY)** — that's why
  the env var defaults that way. You can connect and test privately now.
- Submit the app with a **demo video** + **privacy policy** (same materials we prepared for
  the Meta review). Review takes a few days to ~2 weeks.
- Once approved, change `TIKTOK_PRIVACY` to `PUBLIC_TO_EVERYONE` and redeploy. Done.

> Reference: [TikTok — create an app](https://developers.tiktok.com/doc/getting-started-create-an-app) ·
> [Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started/)

---

## 3) X (Twitter) — later, when you decide to pay

X posting is **paid** (pay-per-use). Build is done and held; switch it on only when ready.

**Create the app**
1. Go to https://developer.x.com → developer portal → create a **Project** + **App**.
2. In **User authentication settings**: enable **OAuth 2.0**, type **Web App / Confidential**,
   scopes `tweet.read tweet.write users.read offline.access`.
3. Callback / redirect URL: `https://tawaslo.com/api/linkedin-oauth`
4. Copy the **Client ID** and **Client Secret**.

**Add to Vercel**
```
X_CLIENT_ID          = <Client ID>
X_CLIENT_SECRET      = <Client Secret>
REACT_APP_X_CLIENT_ID = <Client ID>     ← same value, front-end
```
5. In the app code, flip the X card from held to live: in `SocialAccountsPage`, change the
   `tw` network entry from `live:false` to `live:true`. Redeploy.

> Cost note: ~$0.015 per post, or $0.20 per post **if it contains a link**, plus ~$0.005 per
> read. See the separate **X cost model** for per-plan limits and pricing.

---

## Quick reference — all env vars

| Network  | Vercel env vars |
|----------|-----------------|
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `REACT_APP_LINKEDIN_CLIENT_ID` |
| TikTok   | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `REACT_APP_TIKTOK_CLIENT_KEY`, `TIKTOK_PRIVACY` |
| X        | `X_CLIENT_ID`, `X_CLIENT_SECRET`, `REACT_APP_X_CLIENT_ID` |

Redirect URL for **all** of them: `https://tawaslo.com/api/linkedin-oauth`
After adding any `REACT_APP_*` value → **redeploy** (`fix_and_push.bat`).
