# Tawaslo — Meta App Review Submission (Ads)

App: **Tawaslo** · App ID **1652475822681144**
Submit together, attach the SAME combined video to both:
- **`ads_read`** — read ad account, campaign, and ad performance (Ads dashboard + reports)
- **`ads_management`** — create/boost campaigns on the connected account's behalf

> Record ONE screencast that shows: connect (consent screen with the ads permissions) → Ads dashboard reading real performance → creating a boost.

---

## 0. Prerequisites before you can record (do these first)

1. **Business Verification** must be complete in Meta Business Manager. `ads_management` is not granted without it. (Business Settings → Security Center → Verify.)
2. **Add the ads scopes to the connect flow.** In `connectMeta` (TawasaloApp.js), the Facebook dialog scope must include `ads_management` and `ads_read`. This is gated behind `REACT_APP_META_ADS=1` so it stays off for the public until approved. *(Claude folds this line in when integrating the design pass — see the runbook.)*
3. **Set `REACT_APP_META_ADS=1`** in Vercel and redeploy, so the connect consent screen actually requests the ads permissions.
4. Keep **`ADS_LIVE`** UNSET (test mode). Boost creation runs in safe test mode — no real spend — which is fine for the demo. Reviewers test live functionality themselves after granting.
5. Connect the **Octo Fusion** Facebook Page + ad account (already has an app role → works in development mode now).

---

## 1. Permission usage descriptions (paste into "How will your app use this permission?")

### ads_read
Tawaslo is a social media management platform for agencies and brands. Agencies connect their own and their clients' Facebook/Instagram business assets and use Tawaslo's Ads dashboard to monitor advertising performance in one place.

We use `ads_read` to:
1. Retrieve the connected user's ad accounts, campaigns, and ads, and display spend, reach, impressions, clicks, CPC and CPM in Tawaslo's Ads dashboard.
2. Generate exportable performance reports (per-campaign and per-ad) for the agency and its clients.

Ad data is retrieved only for accounts the user explicitly connects via Facebook Login, and is shown only to that workspace's authorized team members.

### ads_management
Tawaslo lets agencies promote a client's existing post directly from the platform, so they don't have to switch to Ads Manager.

We use `ads_management` to:
1. Create a campaign, ad set (audience + budget), creative from an existing post, and ad on the connected ad account, on the account owner's behalf.
2. Let the agency set objective, budget, duration and simple targeting (location, age) from Tawaslo's Boost screen.

Campaigns are created only on ad accounts the user explicitly connects, are created paused for review, and only for that workspace's authorized team members. We never move budget without the user initiating the boost.

---

## 2. Screencast script (record in English, ~2–3 minutes, 1280×720+)

Speak as you click.

1. **Intro (5s):** "This is Tawaslo, a social media management platform for agencies. I'll show how we use the Facebook Ads permissions."
2. **Log in:** tawaslo.com → Log In → agency workspace.
3. **Connect (the key part):** Go to Settings/Social → Connect Facebook. On the Facebook **consent screen**, point out that Tawaslo is requesting **ads_read** and **ads_management**. Approve. *(This consent screen is what Meta most wants to see.)*
4. **Ads dashboard (ads_read):** Open **Ads**. Show the performance tab pulling the connected ad account — campaigns table (spend, reach, impressions, clicks, CPC), the per-ad table, and **Export CSV**. Narrate: "This is how an agency monitors its clients' ad performance in one place."
5. **Boost (ads_management):** Pick an existing post → **Boost**. Set objective, budget, duration, and targeting (e.g. Bahrain, 18–65). Click create. Show the confirmation. Narrate: "Tawaslo creates the campaign, ad set, creative and ad on the connected account — created paused for review — so the agency can promote a post without leaving Tawaslo."
6. **Close (5s):** "Ad data is only accessed for accounts the user connects, and shown only to authorized team members."

---

## 3. Reviewer instructions (paste into the "Instructions for reviewer" field)

1. Go to https://www.tawaslo.com and log in with the test credentials provided below.
2. Open **Settings → Social accounts** and click **Connect Facebook**. Approve the requested permissions (**ads_read**, **ads_management**) on the Facebook consent screen.
3. Open **Ads** from the left navigation. The **Performance** tab shows the connected ad account's campaigns and per-ad metrics (spend, reach, impressions, clicks, CPC). Use **Export CSV** to download a report.
4. To see `ads_management`: open any post and click **Boost**, set a budget and audience, and create the promotion. The campaign is created **paused** on the connected ad account for review.
5. All ad data is scoped to the connected account and visible only to authorized workspace members.

**Test credentials:** *(fill in a reviewer login — an agency workspace with a Facebook Page + ad account already connected)*
- Email: `[FILL]`
- Password: `[FILL]`

---

## 4. Notes / gotchas

- If the consent screen shows **"Invalid Scopes"**, `REACT_APP_META_ADS=1` isn't deployed, or Business Verification isn't complete — fix both before recording.
- `ads_management` review is stricter than `ads_read`. If Meta pushes back, `ads_read` (reporting only) usually clears easily on its own; you can ship reporting first and resubmit management.
- Boost stays in **test mode** (no real spend) until `ADS_LIVE=1` — leave it unset for the review.
