# Tawaslo — Google Business Profile Integration

A dedicated **Business Profile** module (separate from social) to manage a client's Google presence — reviews, hours, links, attributes, photos, posts, and Q&A — across all their locations worldwide.

---

## 1. Why it matters for clients

Google Business Profile is where local discovery actually happens — Maps, Search, "near me," the knowledge panel. For your local clients (F&B, retail, clinics, salons, real estate) it's often more valuable than any social feed:

- **Reviews are reputation + ranking.** Replying to every review (fast, in the customer's language) lifts both trust and local ranking. Tawaslo surfaces a "needs reply" queue and drafts AI replies.
- **Accurate info wins customers.** Correct hours, phone, address, website, menu, reservation/order links — managed for every location from one screen, instead of logging into Google for each.
- **Worldwide-ready.** Multi-country locations, each with its own timezone; non-English reviews are translated and AI replies are drafted in the reviewer's own language.
- **One more retainer line.** "We manage your Google presence too" is an easy upsell that most social tools don't do well.

---

## 2. What's built (in your code now)

| Piece | Status | Where |
|---|---|---|
| **Connect Google Business** (OAuth, `business.manage`) | ✅ Done | `api/linkedin-oauth.js` (`provider: 'gbp'`, `state=gb`) + Connections card |
| **Authenticated Google proxy** (powers every action) | ✅ Done | `api/linkedin-oauth.js` (`provider: 'google_proxy'`, host-allowlisted) |
| **Business Profile page** — locations switcher, rating/reviews/posts/needs-reply stats, hours & info, links & details, reviews list **with reply**, posts, Q&A | ✅ Done | New "Business Profile" nav item → `BusinessProfilePage` |
| **Account isolation** — the GB connection never leaks into the Publisher/top-filter | ✅ Done | filtered out of social contexts |

**Honest note:** the page is fully built and wired to the real Google Business APIs, but it **could not be tested against live data** (that needs the access approval below). Once a real account connects, expect to fine-tune a few field mappings against actual API responses — that's normal for this fragmented API and quick to adjust.

---

## 3. ⏳ Apply for Google Business Profile API access — do this first (it's the bottleneck)

The API is **not open by default**. Building is done; the **approval wait is the gate** (typically a few days). Apply today so the clock runs while everything else gets set up.

**Where:** Google Cloud Console → enable the Business Profile APIs → then the **Business Profile API access request form** (linked from the API's "Get access" page).

**Justification text you can paste into the application:**

> Tawaslo (tawaslo.com) is a social-media and local-presence management platform for marketing agencies and their clients. We are requesting Business Profile API access so our customers can manage their own (and their clients', with consent) Google Business Profiles from within Tawaslo: reading and replying to reviews, updating business hours and special hours, editing business information (website, phone, address, attributes), managing menu/reservation/order action links, uploading photos, publishing local posts and offers, and answering Q&A. All access is via the business owner's own OAuth consent (scope `https://www.googleapis.com/auth/business.manage`); we never access profiles the user does not manage. Our goal is to help agencies keep accurate local information and respond to customer reviews quickly across multiple locations and countries.

---

## 4. Google Cloud setup (same project as YouTube)

1. **Enable these APIs** in your Google Cloud project: My Business Account Management API, My Business Business Information API, My Business Q&A API, My Business Place Actions API, Business Profile Performance API, and the legacy **Google My Business API** (v4, for reviews & local posts).
2. **OAuth consent screen** — add the scope `https://www.googleapis.com/auth/business.manage` (it's a sensitive/restricted scope; for all-client use it needs Google's OAuth verification, same idea as Meta's review).
3. **Credentials** → the **same Web OAuth client** you use for YouTube works here. Authorized redirect URI: `https://tawaslo.com/api/linkedin-oauth`.
4. **Vercel env vars** (Production), then redeploy:
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — your Google OAuth client (can be the same values as the YouTube ones)
   - `REACT_APP_GOOGLE_CLIENT_ID` — same client ID for the frontend
   - *(If these aren't set, the frontend falls back to `REACT_APP_YOUTUBE_CLIENT_ID`, so one Google client can power both.)*
5. **Before full approval:** add your own Google account as a **Test user** on the consent screen → you can connect and use it immediately for testing/demos. Public client access waits on the access request in §3.

---

## 5. The "create / sign in" reality (so there are no surprises)

- Signing into **Tawaslo** itself: works today.
- **Connecting a Google Business account:** works after (a) deploy, (b) the env vars above, and (c) Google approving the API access request. Until approval, only **test users** you add can connect; all clients connect after approval.

---

## 6. Full feature list & what's next

**Built & wired:** locations switcher · rating/reviews/posts/needs-reply stats · hours & info · links (website/category/description) · reviews list with **reply** · posts list · Q&A · account isolation.

**Designed, quick to extend once live data confirms the shapes:** special/holiday hours editor · attribute (amenity) chips editing · menu/reservation/order **place-action links** editor · photo upload · offer & event post types · performance insights chart (searches/calls/directions/website) · Google Business **messaging → routed into your Inbox** · bulk-reply across locations.

These are intentionally staged after first live connection, because the exact request bodies are best finalized against real API responses (which only exist once an account is connected).
