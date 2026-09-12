# Tawaslo Platform Watch, 7 September 2026

Weekly scan of developer changelogs and content publishing docs across every network Tawaslo integrates with or plans to. Covers what moved since the 31 August watch.

## Bottom line

The WhatsApp October rate card landed on 2 September and it carries one detail nobody had before: 1,000 free service messages per month per business phone number. Tawaslo shares a single fallback `WA_PHONE_ID` across all clients, so that allowance is pooled, not per client, and the Concierge cost model needs rebuilding around that. Separately, Graph API v20.0 is removed on 24 September, seventeen days out, and twenty call sites in Tawaslo still point at v19.0, which is already past end of life. The LinkedIn version fallback is still `202401` for the fifth watch running and `202509` sunsets on 15 September. The Instagram carousel cap is still 10.

---

## 1. What changed, by platform

**WhatsApp Cloud API**
* Meta confirmed the country rates for service messages on 1 September and published the October rate card on 2 September. A service message costs the same as a utility or authentication template to the same country, effective 1 October. Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing#rate-cards-effective-october-1-2026
* New and material: every business phone number gets 1,000 free service messages per month. Billing starts at the 1,001st. The allowance resets monthly and does not roll over. Source: https://sendpulse.com/blog/whatsapp-service-message-pricing
* In window utility templates also become chargeable on 1 October, ending the exemption that has run since July 2025. Incoming customer messages stay free. Source: same
* Service messages get no volume discounts. Utility and authentication templates keep their volume tiers. Source: https://blog.peppercloud.com/whatsapp-api-pricing-everything-you-need-to-know/
* The 72 hour free entry point window from Click to WhatsApp ads and Facebook Page CTA buttons is unchanged and stays free after October. Source: same
* Meta Business Agent token billing unchanged since 1 August at $2.00 per million tokens, roughly 4 to 5 cents per reply, flat worldwide. Source: https://sendpulse.com/blog/whatsapp-service-message-pricing

**Facebook and Meta Graph**
* Graph API v20.0 is deprecated and removed from the platform on 24 September 2026. v21.0 follows on 21 January 2027. Source: https://ppc.land/meta-blocks-47-commerce-endpoints-as-graph-api-v26-0-lands-today/
* Reporting on v19.0 is inconsistent across sources, with dates ranging from February 2025 to May 2026, but every source agrees it is past end of life and outside the supported set. Treat v19.0 as unsupported. Source: https://singhamandeep.com/meta-graph-api-version-deprecation/
* The v26.0 protocol retirements extend to every remaining supported Graph API version on 27 October: `pretty`, `debug`, `date_format`, root level `GET /?ids=...`, and legacy `If-None-Match` and ETag handling. JSON comes back compact only. Source: https://ppc.land/meta-blocks-47-commerce-endpoints-as-graph-api-v26-0-lands-today/
* Also extending to all versions on 27 October: the 47 Commerce Order Management endpoints with no replacement, the Delivery Estimate fields `daily_outcomes_curve`, `budget_guardrail` and `estimate_dau`, the Instagram Explore Feed placement, Messenger Stories in `messenger_positions`, and new poll ad creative creation. Source: same
* Five legacy Page node fields deprecated for New Pages Experience pages on v26.0 and later: `current_location`, `genre`, `network`, `parking`, `start_info`, plus the `auto_publish_page_info_updates` setting. Reaches all versions in late October. Source: same
* No Pages publishing or scheduling change this week.

**Instagram**
* Still nothing on the official Instagram Platform changelog since 6 February 2026. The publishing surface has not moved in seven months. Source: https://developers.facebook.com/docs/instagram-platform/changelog
* Product side: Instagram now allows reordering images and videos inside an already published carousel, and reordering of the profile grid. Neither is exposed through the API. Source: https://napoleoncat.com/blog/instagram-new-features-and-updates/
* Series, the profile hub that bundles related Reels, is still a limited test. Bonuses for photo and carousel posts is rolling out. Both are app only. Source: same
* Hashtag cap remains five per post or reel. Tawaslo already matches. Source: https://later.com/blog/ultimate-guide-to-using-instagram-hashtags/

**LinkedIn**
* `202608` is still the current version. Sunsets ahead: `202509` on 15 September, `202510` on 15 October. Source: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-08
* Legacy Geo for ads targeting stopped working on 31 August as scheduled. Campaign creation with legacy geo returns `400` with `INVALID_VALUE_FOR_FIELD`. Source: same
* The top level `location` field removal from `/v2/me` and `/v2/people` is in progress. Migrate to `geoLocation` with the `geo~` projection. Source: same
* Standing from August: DMP Segments capped at 1,000 per sponsored account with a `429` and `SEGMENT_LIMIT_EXCEEDED` over the line. Source: same

**YouTube**
* 1 September 2026: `videos.getRating` now accepts the `youtube.readonly` scope. Minor, read only. Source: https://developers.google.com/youtube/v3/revision_history
* The 27 August view counting change is now live and reflected in the `viewCount` field description on the `channels` and `videos` references. Public views count from the first frame across long form, Live and Shorts. Engaged views are unchanged. Source: same
* Granular quota buckets for `videos.insert` and `search.list` still stand from 1 June. Upload cost remains roughly 100 units after the December 2025 reduction from 1,600. Source: same

**TikTok**
* No change. The last two changelog entries, 19 and 25 August, are both Data Portability API documentation about Login Kit dependency. Content Posting API untouched. Source: https://developers.tiktok.com/docs/en/changelog
* Unaudited clients still have all posted content forced to private visibility. Source: https://developers.tiktok.com/docs/en/content-posting-api-get-started

**Threads**
* Nothing new. Latest material items remain March 2026 reply and quote post parameters, and April 2026 page backed accounts for Threads ads. Source: https://www.threads.com/@threadsapi.changelog

**X**
* No change. Pay per use has been the default since 6 February 2026. Source: https://postproxy.dev/blog/x-api-pricing-2026/

**Google Business Profile**
* Nothing new since 24 July, when `reviewReplyUrl` became retrievable. Page last touched 28 August with no new entry. Source: https://developers.google.com/my-business/content/latest-updates
* Standing and still unbuilt for F&B: `RecurrenceInfo` for recurring local posts from 7 April, and `PolicyViolation` on rejected review replies from 1 July. Source: same

**Pinterest and Snapchat (not integrated, future watch)**
* Pinterest v5 continues incremental catalog and video changes only, nothing that affects a publishing integration. Source: https://github.com/pinterest/api-description/releases
* Nothing material on Snapchat this week.

---

## 2. What affects Tawaslo and how

* **WhatsApp free allowance is pooled, not per client. New this week, and it breaks the Concierge unit economics assumption.** `api/meta-publish.js` line 375 falls back to a single account level `process.env.WA_PHONE_ID` when no per client `phoneId` is supplied, and `api/cron.js` line 323 does the same. The 1,000 free service messages are granted per business phone number, so every client sharing that fallback number draws from one pool. `concierge_usage` meters per client per month, which is the right shape for billing but gives no view of the shared allowance. From 1 October, once the pooled 1,000 are spent, every Concierge reply and every in window utility template carries a per message cost.
* **Graph API v19.0 across twenty call sites. Breaking risk, seventeen days to the next removal.** `api/meta-oauth.js`, `api/meta-publish.js`, `api/meta-ads.js`, `api/instagram-analytics.js` and `api/instagram-inbox.js` all pin `graph.facebook.com/v19.0`. v19.0 is already outside the supported set and Meta is silently auto upgrading these calls, which means Tawaslo has no control over which version actually serves them. When v20.0 goes on 24 September the floor moves again. Publishing, page discovery, Instagram account linking and ads reads all sit on this path.
* **LinkedIn version fallback, fifth watch open.** `api/meta-publish.js` line 162 and `api/linkedin-oauth.js` line 188 both still read `process.env.LINKEDIN_API_VERSION || '202401'` and `LINKEDIN_API_VERSION` is still not set anywhere. `202401` was retired in January 2025. Any LinkedIn publish or organization lookup that falls through sends a dead version.
* **Instagram carousel cap, fifth watch open.** `src/TawasaloApp.js` line 7338 reads `images.length >= 10` while Instagram accepts twenty.
* **YouTube view counting distortion, now visible in data.** `api/trends.js` line 48 and `api/instagram-analytics.js` lines 212 and 254 parse `statistics.viewCount`. Client charts that straddle 27 August now show a step change that is not real growth. `instagram-analytics.js` line 254 is worse than the others because it maps `viewCount` into a field labelled `reach`, which is now further from the truth than it was.
* **Meta v26.0 protocol retirements.** Checked the codebase: no use of `date_format`, `pretty`, `debug`, `If-None-Match`, or root level `/?ids=` against Graph. The one `ids=` hit at `api/instagram-analytics.js` line 223 is YouTube Analytics and is unaffected. Nothing to fix here.
* **Instagram hashtag cap.** `MAXTAG` at `src/TawasaloApp.js` line 10640 reads `ig:5` and the trim helper at line 7390 enforces five. Matches the platform. No action.
* **LinkedIn, TikTok, Threads, GBP, X, Pinterest.** Nothing forced this week beyond the version fallback above.

---

## 3. Recommendations, with rough effort

**A. Model the WhatsApp October cost before it lands. Highest priority. Half a day.**
Two parts. First, add a monthly counter for outbound service messages at the phone number level, not just the client level. `wa_messages` already logs `direction: 'out'` in `api/generate-caption.js` line 848 and `api/meta-publish.js` line 362, so a monthly count of outbound non template rows keyed on phone number gives the number that matters. Surface it against 1,000 in the Concierge settings panel. Second, decide the commercial position before 1 October: either give each client their own phone number so each gets its own 1,000, or price the pooled allowance into the Concierge plan and top up. The per number option is cleaner but adds onboarding friction and one more Meta review per number.

**B. Move all Graph calls off v19.0. High priority. Two to three hours.**
Twenty call sites across five files. Replace the hardcoded version with one shared constant, for example `const GRAPH_V = process.env.GRAPH_API_VERSION || 'v25.0'`, and export it from a single small module that all five files import. v25.0 is the safe target since it predates the v26.0 protocol retirements and stays supported well past October. Do the swap, then run one publish, one page discovery, one Instagram link and one analytics pull to confirm nothing shifted. Same pattern as the LinkedIn fix below, so do both in one sitting.

**C. Fix the LinkedIn version fallback. High priority. Twenty minutes.**
`api/meta-publish.js` line 162 and `api/linkedin-oauth.js` line 188: change `'202401'` to `'202608'`, lift it into the same shared constants module as B so the two files cannot drift, and set `LINKEDIN_API_VERSION=202608` in Vercel so the fallback never actually runs. `202509` goes on 15 September, so add a quarterly bump reminder.

**D. Raise the Instagram carousel cap to twenty. High priority. Fifteen to thirty minutes.**
`src/TawasaloApp.js` line 7338 reads `if (isImage && images.length >= 10) { setMediaWarning('Up to 10 images in a carousel.'); break; }`. Change `>= 10` to `>= 20` and update the English and Arabic warning copy. Confirm `api/meta-publish.js` does not cap the carousel children loop separately. Fifth watch carrying this and still the cheapest win on the list.

**E. Annotate YouTube view data at 27 August. Medium priority. One hour.**
Add a fixed marker to any chart drawing from `viewCount` and a one line note in the client report explaining that YouTube changed what counts as a public view on 27 August, so figures before and after are not comparable. Separately, rename the `reach` mapping at `api/instagram-analytics.js` line 254 to `views`, since `viewCount` was never reach and is now further from it.

**F. Build Google Business Profile recurring posts for F&B. Medium priority. One day.**
`RecurrenceInfo` on `LocalPost` has been available since 7 April and maps directly onto the weekly specials pattern most F&B clients already run in Tawaslo. Nothing forces this, but it is the largest unclaimed feature on the GBP surface and no competitor in the region is using it.

---

*Next watch: 14 September 2026.*
