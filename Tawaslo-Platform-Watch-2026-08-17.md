# Tawaslo Platform Watch, 17 August 2026

Weekly scan of developer changelogs and content publishing docs across every network Tawaslo integrates with or plans to. Covers what moved since the 3 August watch.

## Bottom line

One item is live today and can break a shipped feature: LinkedIn version `202508` sunsets on 17 August 2026, and Tawaslo's code falls back to `202401`, a version that died over a year ago. Any LinkedIn call made without `LINKEDIN_API_VERSION` set in the environment is rejected outright. Everything else this fortnight is quiet. The Instagram carousel cap is still hardcoded at 10 for the third watch running.

---

## 1. What changed, by platform

**LinkedIn**
* Version `202508` is removed from the platform on 17 August 2026, today. `202509` follows on 15 September. `202607` is the current release. Source: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-06
* From July 2026 the `adCampaigns` API defaults `creativeSelection` to `OPTIMIZED` for `SPONSORED_INMAILS` campaigns with the `LEAD_GENERATION` objective, where the combination previously returned a 400. Applies to all versions, not just 202607. Source: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-06
* Product side, LinkedIn shipped a member reporting control for AI generated filler content and new AI creative options inside Campaign Manager. No API surface. Source: https://socialbee.com/blog/social-media-news/

**YouTube**
* 6 August 2026: references to `contentDetails.like`, `contentDetails.favorite` and `contentDetails.subscription` were removed from the `activities` documentation because the API never returned them. Documentation cleanup only. Source: https://developers.google.com/youtube/v3/revision_history
* The granular quota buckets for `videos.insert` and `search.list` introduced on 1 June still stand, as does the cheaper upload cost. Source: https://developers.google.com/youtube/v3/revision_history

**WhatsApp Cloud API**
* Meta Business Agent token billing went live on 1 August at roughly two dollars per one million tokens. Already flagged on 3 August, now in effect. Source: https://www.wati.io/en/blog/whatsapp-service-message-pricing/
* Service messages and in window utility templates become chargeable on 1 October 2026. Meta publishes the exact country rate cards by 1 September, so the numbers Tawaslo needs for the Concierge cost model arrive in about two weeks. Source: https://sendpulse.com/blog/whatsapp-service-message-pricing

**Instagram**
* Audio replacement on published posts rolled out from 21 July, and Instagram is testing adding content straight to Highlights without posting a Story first. Both are app only with no publishing endpoint. Source: https://socialbee.com/blog/instagram-updates/
* Hashtag cap remains five per post or reel, unchanged since the December 2025 rollout. Tawaslo already matches this. Source: https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/

**Facebook and Meta Graph**
* No versioned or out of cycle change this fortnight. `v24.0` is still the version the changelog index serves as current. Source: https://developers.facebook.com/docs/graph-api/changelog

**Threads**
* Nothing new. The last changelog entry remains 3 March 2026, oEmbed without an access token. Source: https://developers.facebook.com/docs/threads/changelog

**TikTok**
* Nothing new. The developer changelog has published nothing since 4 June 2026, now ten weeks quiet. Source: https://developers.tiktok.com/doc/changelog
* Product side, TikTok is testing a profile grid opt out for posts and opened a Mini Dramas ad format. No Content Posting API impact. Source: https://socialbee.com/blog/social-media-news/

**X**
* No change since the last watch. Pay per use remains the default for new developers, at about $0.015 per post created and about $0.20 when the post contains a link. Legacy Basic and Pro subscribers continue migrating across. Source: https://docs.x.com/x-api/getting-started/pricing
* Note that the $0.20 link rate is the item that matters most for Tawaslo, since F&B posts routinely carry a menu or booking link.

**Google Business Profile**
* 24 July 2026: `reviewReplyUrl` can now be pulled through `reviews.get`, `reviews.list` and `batchGetReviews`. Small but useful for deep linking a reply from the Tawaslo inbox. Source: https://developers.google.com/my-business/content/latest-updates
* No new deprecation. The Performance API migration and the Q&A sunset remain the standing items. Source: https://developers.google.com/my-business/content/sunset-dates

**Pinterest and Snapchat (not integrated, future watch)**
* Pinterest v5 continues its steady point releases with no break relevant to a publishing integration. Snapchat had nothing material. Source: https://github.com/pinterest/api-description/releases

---

## 2. What affects Tawaslo and how

* **LinkedIn version fallback, breaking, live today.** `api/meta-publish.js` line 162 and `api/linkedin-oauth.js` line 188 both read `process.env.LINKEDIN_API_VERSION || '202401'`. `LINKEDIN_API_VERSION` is not present in `.env.local`, so unless it is set in the Vercel environment every LinkedIn publish and every organization lookup sends a version that LinkedIn retired in January 2025 and rejects. Even with the env var set, anything pinned to `202508` stops working today.
* **LinkedIn ads default change.** Only bites if Tawaslo creates Message or Conversation Ads with a lead generation objective. If it does, ad rotation silently changes from even to optimized.
* **WhatsApp service message charging on 1 October.** Unchanged from the last watch but the clock is shorter. Rates land 1 September, which is the point at which the Concierge and InboxAI cost model can actually be recalculated rather than estimated.
* **Instagram carousel cap.** Still a live limit on a shipped feature. Verified again today: `src/TawasaloApp.js` line 7156 still reads `images.length >= 10` while Instagram accepts twenty. Third watch in a row.
* **X link pricing.** Not a break, but if X publishing is enabled for clients the unit economics are roughly thirteen times worse for any post carrying a link. Worth a pricing guard or at least a warning in the composer.
* **GBP `reviewReplyUrl`.** Pure upside, no action forced.

---

## 3. Recommendations, with rough effort

**A. Fix the LinkedIn version fallback. Highest priority. Very small effort.**
In `api/meta-publish.js` line 162 and `api/linkedin-oauth.js` line 188, change the fallback from `'202401'` to `'202607'`. Better still, lift it to one shared constant so the two files cannot drift, and set `LINKEDIN_API_VERSION=202607` in the Vercel environment so the fallback is never the thing in play. Then add a calendar note to bump the value each quarter, since LinkedIn sunsets on a rolling one year clock. About twenty minutes for the edit, plus one LinkedIn publish test.

**B. Raise the Instagram carousel cap to twenty. High priority. Very small effort.**
Unchanged from 6 July and 3 August. `src/TawasaloApp.js` line 7156 reads `if (isImage && images.length >= 10) { setMediaWarning('Up to 10 images in a carousel.'); break; }`. Change `>= 10` to `>= 20` and update both the English and Arabic warning copy. Confirm `api/meta-publish.js` does not cap the carousel children loop separately. Fifteen to thirty minutes. This has now been carried three watches and is the cheapest win on the list.

**C. Hold for the WhatsApp rate card on 1 September. Medium priority. No code this week.**
Meta publishes country rates by 1 September for the 1 October service message change. Diary it, then run the Concierge and InboxAI cost audit against real numbers. Bahrain marketing and utility rates were unchanged in July, so the exposure is the closing free service window rather than a rate rise. Half a day once the rates are out.

**D. Add an X link cost warning. Low priority. Small effort.**
If X publishing is live for any client, show a note in the composer when a draft contains a URL, since that post costs about $0.20 against $0.015 without. A single conditional in the composer plus copy. About an hour.

**E. Pull `reviewReplyUrl` into the GBP review view. Low priority. Small effort.**
Add the field to the reviews fetch and link it from the inbox so a reply can be opened directly in Google. Roughly an hour or two.

**F. Leave the Instagram hashtag cap at five. No action.**
`MAXTAG` at `src/TawasaloApp.js` line 10455 sets `ig:5`, which still matches the enforced platform limit. Nothing to change.

---

Reviewed against each platform's official developer changelog plus recent reputable coverage for roughly the last two weeks. One breaking item, LinkedIn version, and one carryover, the carousel cap. Both are edits of a few minutes each.

Note on sourcing: the Meta developer documentation pages served a cached view during this run, with the Graph API index still listing `v24.0` as current while release notes elsewhere reference `v25.0` from February 2026. Nothing in the Instagram or Facebook publishing surface appears to have moved this fortnight, but treat the Meta section as slightly less certain than the others and confirm the current Graph version before any upgrade work.
