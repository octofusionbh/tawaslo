# Tawaslo Platform Watch, 31 August 2026

Weekly scan of developer changelogs and content publishing docs across every network Tawaslo integrates with or plans to. Covers what moved since the 17 August watch.

## Bottom line

Two things need attention today. LinkedIn ends legacy geo support for ads targeting on 31 August, and separately the LinkedIn version fallback flagged a fortnight ago is still `202401` in both API files, which is now three sunsets out of date. YouTube changed what a public view means on 27 August, and Tawaslo reads `viewCount` directly, so client analytics will show a step change that is not real growth. The WhatsApp October rate cards land tomorrow. The Instagram carousel cap is still hardcoded at 10 for the fourth watch running.

---

## 1. What changed, by platform

**LinkedIn**
* Version `202608` is current. New in August: Matched Audiences API is generally available to all qualified developers, and the Conversions API adds `MARKETING_QUALIFIED_LEAD` and `SALES_QUALIFIED_LEAD` types. Source: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-06
* DMP Segments API now caps each sponsored account at 1,000 segments. Over that, `/dmpSegments` returns a `429` with `SEGMENT_LIMIT_EXCEEDED`. Applies to all versions. Source: same changelog
* Legacy Geo for ads targeting stops working entirely on 31 August 2026, today. Campaign creation using legacy geo returns a `400` with `INVALID_VALUE_FOR_FIELD`. Bing geo is the replacement. Source: same changelog
* The top level `location` field is being removed from `/v2/me` and `/v2/people` responses. It may already return empty or null. Migrate to `geoLocation`. Source: same changelog
* Sunsets ahead: `202509` on 15 September, `202510` on 15 October. `202508` already went on 17 August. Source: same changelog

**YouTube**
* 27 August 2026: YouTube aligned public view counting across long form, Live and Shorts. A public view now counts the moment a video begins to play, including autoplay. Engaged views are unchanged and still drive monetization and most core analytics. The `viewCount` field description in the `channels` and `videos` references was updated to match. Source: https://developers.google.com/youtube/v3/revision_history
* No other API change this fortnight. Granular quota buckets for `videos.insert` and `search.list` still stand from 1 June. Source: same page

**WhatsApp Cloud API**
* Still on track for 1 October 2026, when service messages and in window utility templates become chargeable at the same per message rate as utility and authentication templates in each country. Meta publishes exact country rates by 1 September, which is tomorrow. Source: https://sendpulse.com/blog/whatsapp-service-message-pricing
* The 72 hour free entry point window from Click to WhatsApp ads is not affected. Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
* Meta Business Agent token billing has been live since 1 August. No change since last watch. Source: https://www.wati.io/en/blog/whatsapp-service-message-pricing/

**Instagram**
* No entry on the official Instagram Platform changelog since 6 February 2026. The publishing surface has not moved. Source: https://developers.facebook.com/docs/instagram-platform/changelog
* Product side only: First Draft for Reels launched 25 August, which auto assembles a rough cut from clips the creator has already selected. Instagram is also testing Series, a profile hub that groups related Reels, and pushed guidance on caption quality. All app only, no endpoint. Source: https://www.socialmediatoday.com/news/instagram-launches-first-draft-for-reels/828789/
* Hashtag cap remains five per post or reel. Tawaslo already matches this. Source: https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/
* Standing from April: the Content Publishing API supports the partnership ads label at publish time, plus collaborative media endpoints and aggregated view, like and comment metrics. Still unbuilt in Tawaslo. Source: https://www.socialmediatoday.com/news/meta-expands-instagram-management-apis/818385/

**Facebook and Meta Graph**
* Login with Facebook entered open beta on 27 August 2026, aimed at fewer steps and less maintenance in the login flow. Worth a look before the next app review cycle. Source: https://developers.meta.com/blog/
* Graph API v26.0 and Marketing API v26.0 remain the current release, with the Messenger Stories and Instagram Explore Feed ad placements removed. Note that Meta's two changelog pages give different removal dates for older versions, so verify before relying on either. Source: https://developers.meta.com/blog/
* No Pages publishing or scheduling change this fortnight.

**Threads**
* Nothing new. The most recent material items remain March 2026 parameters for replies and quote posts, and April 2026 page backed Threads accounts for ads. Source: https://www.threads.com/@threadsapi.changelog

**TikTok**
* The developer changelog moved twice, on 19 and 25 August, but both entries are Data Portability API documentation about Login Kit dependency. The Content Posting API is untouched. Source: https://developers.tiktok.com/doc/changelog
* No pricing change. Content Posting API remains free, and unreviewed apps still force published posts to private visibility. Source: https://developers.tiktok.com/docs/en/content-posting-api-get-started

**X**
* No change since the last watch. Pay per use remains the default for new developers at roughly $0.015 per post created and roughly $0.20 when the post carries a link. Source: https://postproxy.dev/blog/x-api-pricing-2026/

**Google Business Profile**
* Nothing new since 24 July, when `reviewReplyUrl` became retrievable through `reviews.get`, `reviews.list` and `batchGetReviews`. Source: https://developers.google.com/my-business/content/change-log
* Standing and still unbuilt for F&B: `RecurrenceInfo` for scheduling recurring local posts, and up to 200 dish photos through `updateFoodMenus`, both from 7 April. `PolicyViolation` on rejected review replies from 1 July. Source: same page

**Pinterest and Snapchat (not integrated, future watch)**
* Nothing material for a publishing integration. Pinterest continues free Trial and Standard tiers with published per category rate ceilings and a rule barring caching of most API data, which would constrain a Tawaslo analytics cache if Pinterest is ever added. Source: https://developers.pinterest.com/docs/overview/welcome/

---

## 2. What affects Tawaslo and how

* **LinkedIn version fallback, breaking, fourth week open.** `api/meta-publish.js` line 162 and `api/linkedin-oauth.js` line 188 both read `process.env.LINKEDIN_API_VERSION || '202401'`. `LINKEDIN_API_VERSION` is still absent from `.env.local`. Any LinkedIn publish or organization lookup that falls through to the default sends a version retired in January 2025. Current is `202608`.
* **LinkedIn legacy geo ends today.** Only bites if Tawaslo creates or updates LinkedIn campaigns through the API. If it does, campaign creation starts failing with a `400` from today.
* **LinkedIn `location` field removal.** If any profile or organization lookup projects `location`, it will start returning empty. Switch to `geoLocation`.
* **YouTube view counting, silent analytics distortion.** `api/trends.js` line 48 and `api/instagram-analytics.js` line 207 both parse `statistics.viewCount`. From 27 August that number counts autoplay impressions from the first frame, so every client's YouTube view figure jumps without any change in performance. Week over week and month over month comparisons that straddle 27 August are not comparable. Tawaslo does not call `search.list`, so the granular quota change is not a concern.
* **Instagram carousel cap.** Still live. `src/TawasaloApp.js` line 7338 reads `images.length >= 10` while Instagram accepts twenty. Fourth watch in a row.
* **WhatsApp October charging.** Rates arrive tomorrow. Until then the Concierge and InboxAI cost model is still an estimate. The exposure is the closing of the free service window rather than a rate rise.
* **Instagram hashtag cap.** `MAXTAG` at `src/TawasaloApp.js` line 10637 reads `ig:5`, which matches the platform. No action.
* **TikTok, Threads, Facebook, GBP, X.** Nothing forced this fortnight.

---

## 3. Recommendations, with rough effort

**A. Fix the LinkedIn version fallback. Highest priority. Very small effort.**
In `api/meta-publish.js` line 162 and `api/linkedin-oauth.js` line 188, change the fallback from `'202401'` to `'202608'`. Lift it into one shared constant so the two files cannot drift, and set `LINKEDIN_API_VERSION=202608` in the Vercel environment so the fallback is never what is actually in play. Add a quarterly reminder to bump it, since LinkedIn sunsets on a rolling one year clock and `202509` goes on 15 September. About twenty minutes plus one publish test.

**B. Raise the Instagram carousel cap to twenty. High priority. Very small effort.**
`src/TawasaloApp.js` line 7338 reads `if (isImage && images.length >= 10) { setMediaWarning('Up to 10 images in a carousel.'); break; }`. Change `>= 10` to `>= 20` and update the English and Arabic warning copy. Confirm `api/meta-publish.js` does not cap the carousel children loop separately. Fifteen to thirty minutes. Carried four watches now and still the cheapest win on the list.

**C. Annotate YouTube view data at 27 August. High priority. Small effort.**
Two options, and the second is better. Quick version: add a note in the YouTube analytics view saying public view counting changed on 27 August 2026 and that comparisons across that date are not like for like. Better version: where Tawaslo charts YouTube views over time, draw a marker at 27 August and, if the reporting is aimed at proving performance, switch the headline metric to engaged views from YouTube Analytics rather than `viewCount` from the Data API. The quick note is about an hour. Moving the headline metric is closer to half a day since it needs a different API surface.

**D. Check LinkedIn ads targeting and profile projections. Medium priority. Small effort.**
Grep for legacy geo urns in any campaign creation path and for `projection=` strings that request `location`. If either exists, migrate to Bing geo and `geoLocation` respectively. If Tawaslo does not create LinkedIn campaigns through the API at all, this is a five minute confirmation and nothing more.

**E. Hold for the WhatsApp rate card, due tomorrow. Medium priority. No code this week.**
Meta publishes country rates by 1 September for the 1 October change. Pull the Bahrain and Gulf numbers, then run the Concierge and InboxAI cost audit against real figures rather than estimates. Half a day once the rates are out.

**F. Pick up the April Instagram API additions. Medium priority. Half a day each.**
Two are worth building now that they have been stable for four months. The partnership ads label at publish time removes a manual step for any client running creator collaborations, and the aggregated view, like and comment metrics give a cleaner number for reporting than the Instagram only figures Tawaslo shows today. Collaborative media endpoints are lower value unless clients ask for them.

**G. Google Business Profile recurring posts and Food Menus. Medium priority for the F&B side. One to two days.**
`RecurrenceInfo` on `LocalPost` means a weekly special or a Friday brunch post can be scheduled once instead of every week, which is exactly the F&B pattern. `updateFoodMenus` now takes up to 200 dish photos. Both are straight additions to the existing GBP integration and neither breaks anything.

**H. `reviewReplyUrl` and `PolicyViolation` in the GBP review view. Low priority. About two hours.**
Add both fields to the reviews fetch. Link `reviewReplyUrl` from the inbox so a reply opens directly in Google, and surface `PolicyViolation` so a rejected reply explains itself instead of silently failing.

**I. X link cost warning. Low priority. About an hour.**
Unchanged from last watch. If X publishing is live for any client, warn in the composer when a draft contains a URL, since that post costs roughly $0.20 against $0.015 without one. F&B posts carry menu and booking links constantly.

---

Reviewed against each platform's official developer changelog plus recent reputable coverage for roughly the last two weeks. One genuinely new item, the YouTube view definition, plus two carryovers that are each a few minutes of work.

Sourcing note: the WhatsApp Business Platform changelog and pricing pages both served a cached view during this run, showing April 2026 and March 2026 as most recent. The 1 October service message change is well documented across multiple business solution providers but was not confirmed on Meta's own pricing page in this run. Treat the WhatsApp section as slightly less certain than the rest and reconfirm when the rate cards publish.
