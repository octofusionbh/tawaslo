# Tawaslo — Meta App Review Checklist (Instagram + Facebook)

Goal: get **Advanced Access** to publish posts and read/reply to comments on your clients' Instagram & Facebook accounts. Expect **2–4 weeks** of review. Start now — the code is already ready to meet it.

---

## Step 0 — Pick the right API path (decide first)

Meta now splits developers into two paths:

- **Facebook Login for Business** — connects through Facebook Pages + Business Manager. Best for an **agency managing many clients** centrally. ← **Recommended for Tawaslo.**
- **Instagram API with Instagram Login** — connects an Instagram account directly, no Facebook Page needed. Simpler, but better for single-account / creator tools.

Because Tawaslo is a multi-client agency platform, go with **Facebook Login for Business**. (Your repo already has `meta-oauth.js` / `meta-callback.js` for this path.)

---

## Step 1 — Prerequisites (do these BEFORE you submit)

These are the things reviewers check first. Missing any one = instant rejection.

- [ ] **App in the right mode** — App created at developers.facebook.com, type **Business**.
- [ ] **Business Verification** — In Meta Business Manager (Business Settings → Security Center). Requires official business documents (CR / commercial registration, proof of address). This alone can take a few days, so **start it today**.
- [ ] **Privacy Policy URL** — A public page (e.g. `tawaslo.com/privacy`) describing what data you collect and how. Add it under App Settings → Basic.
- [ ] **Data Deletion** — Either a Data Deletion Callback URL or a "how to request deletion" instructions URL. Required field.
- [ ] **App Domain + valid OAuth redirect URI** — Must exactly match your live domain (`tawaslo.com`) and your `meta-callback` route.
- [ ] **App icon + category + contact email** filled in App Settings → Basic.
- [ ] **A working test account** — A real Instagram Business/Creator account (and its linked Facebook Page) the reviewer can use, with at least a few posts and comments on it so each feature can be demonstrated.

---

## Step 2 — Request these permissions

Submit each one for **Advanced Access**. For each, you write a use-case description + record a screencast (Step 3).

**Instagram:**

- [ ] `instagram_basic` — read account profile & media (foundation; required by the others).
- [ ] `instagram_content_publish` — **publish posts, Reels, carousels, Stories.** (Core of your Publisher.)
- [ ] `instagram_manage_comments` — read & reply to comments. (Powers your Inbox.)
- [ ] `instagram_manage_messages` — read & reply to DMs. (Optional now — only request if you'll demo DM replies; it adds review burden.)

**Facebook Pages:**

- [ ] `pages_show_list` — list the Pages a user manages.
- [ ] `pages_read_engagement` — read Page posts & comments.
- [ ] `pages_manage_posts` — publish to the Page.
- [ ] `pages_manage_engagement` — reply to Page comments.
- [ ] `business_management` — manage assets via Business Manager (needed for the agency multi-client model).

> Tip: request the **minimum** set that matches what your screencast actually shows. Requesting a permission you don't clearly demonstrate is a top rejection cause.

---

## Step 3 — The submission (this is where apps get rejected)

For **every** permission above:

1. **Use-case description** — 2–4 sentences, plain language, describing exactly what Tawaslo does with it. Example for `instagram_content_publish`:
   > "Tawaslo is a social media management platform. Agencies connect their clients' Instagram Business accounts and use Tawaslo to compose and publish posts, Reels and carousels, and to schedule them for later. This permission is used solely to publish content the user creates inside Tawaslo to their own connected account."

2. **Screencast** (the #1 rejection reason in 2026 is incomplete screencasts):
   - One clear video **per permission**, showing the **complete flow** end to end.
   - Show: logging in → connecting the account via Facebook Login → performing the action (e.g. composing a post and it appearing on Instagram; opening the Inbox and replying to a comment).
   - The reviewer must be able to **replicate your exact steps** using the test account you provide. If they can't reproduce it, they deny it.
   - Narrate or caption each step. Keep it focused on that one permission.

3. **Test credentials** — Provide login details for a test user + the connected IG/FB test account in the "App Review → Notes" field.

---

## Step 4 — Submit & track

- [ ] Submit all permissions together (one review cycle is cleaner than several).
- [ ] Watch the App Dashboard → App Review status + your contact email.
- [ ] If rejected, Meta tells you which permission and why — usually "screencast didn't show X." Fix that one screencast and resubmit; you don't restart the others.

---

## Top reasons apps get rejected (avoid these)

1. **Screencast doesn't fully show the permission in use** — or reviewer can't replicate it with the test account.
2. **Business Verification not completed** — Advanced Access needs it.
3. **Privacy Policy / Data Deletion URL missing or dead link.**
4. **Requesting permissions the demo doesn't actually use.**
5. **Test account has no content** to demonstrate against (no posts/comments to publish or reply to).

---

## Recommended order for Tawaslo

1. **Today:** Start Business Verification + publish a Privacy Policy + Data Deletion page on `tawaslo.com`.
2. **This week:** Build the screencasts (publish a post, reply to a comment) using a real test account.
3. **Submit:** `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, + the Facebook Page set. Add `instagram_manage_messages` only if demoing DMs.
4. **While waiting (2–4 wks):** I finish LinkedIn connect + X, and we polish the rest of the app.

---

*Sources: Meta for Developers — Instagram Platform App Review & Overview docs (developers.facebook.com/docs/instagram-platform).*
