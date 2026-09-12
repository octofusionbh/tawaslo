# Tawaslo Platform Watch, 24 August 2026

Coverage window: roughly 10 August to 24 August, with anything still inside its migration deadline carried forward.

**Headline:** the two urgent items this week are LinkedIn, where version 202508 was switched off on 17 August and Legacy Geo ads targeting dies on 31 August, and Meta, where the v26.0 protocol retirements silently break common HTTP client habits and go platform wide on 27 October.

---

## 1. What changed, by platform

### Meta (Graph API and Marketing API v26.0, shipped 29 July 2026)

Everything below is live on v26.0 now and extends to every remaining supported version on 27 October 2026.

* Five legacy request behaviours retired: the `pretty` parameter, the `debug` parameter and its response envelope, the `date_format` parameter, root level `GET /?ids=...` batch requests, and `If-None-Match` / ETag handling that produced 304 responses. `debug_token` is unaffected. [Source](https://ppc.land/meta-blocks-47-commerce-endpoints-as-graph-api-v26-0-lands-today/)
* Legacy Page node fields deprecated for New Pages Experience pages: `current_location`, `genre`, `network`, `parking`, `start_info`, plus the `auto_publish_page_info_updates` setting. Requesting them returns a version error. [Source](https://ppc.land/meta-blocks-47-commerce-endpoints-as-graph-api-v26-0-lands-today/)
* Instagram Explore Feed placement removed. Ad sets naming it now error on create and update.
* Messenger Stories: the `story` value is silently stripped from `messenger_positions`, with no error returned.
* Poll ad creative creation blocked. Existing poll ads keep running and can still be paused, rebudgeted, rescheduled.
* Commerce Order Management API, 47 endpoints, blocked with no replacement.
* Delivery Estimate fields `daily_outcomes_curve`, `budget_guardrail`, `estimate_dau` removed with no replacement.
* Special Ad Categories (Housing, Employment, Financial): `advantage_audience` must now be set explicitly to 1 or 0 on new ad set creation for constrained audience setups.
* Ads in WhatsApp Status: third party Marketing API callers must now include `wamo_whatsapp_identity_spec` in creatives, and carousels support up to 10 cards.
* Graph API v20.0 is removed from the platform on 24 September 2026. v21.0 follows on 21 January 2027.

### Instagram (publishing API)

* Nothing new. The Instagram Platform changelog's most recent entry is still 6 February 2026 (`enable_fb_login` in OAuth). [Source](https://developers.facebook.com/docs/instagram-platform/changelog)
* Carried forward: the five hashtag cap is a platform enforced limit, not a suggestion, applying to posts and Reels across all account types, and it counts hashtags in the first comment too. [Source](https://later.com/blog/ultimate-guide-to-using-instagram-hashtags/)
* App side only, no API surface yet: a Replace Audio tool for swapping music on already published feed posts and carousels, carousel reordering after publish, and per slide carousel captions. [Source](https://metricool.com/instagram-news/)

### Facebook (Pages publishing)

* No publishing specific changes. The Page field deprecations above are the item that touches Tawaslo.

### Threads

* Nothing new. Latest changelog entry is 3 March 2026 (token free oEmbed). [Source](https://developers.facebook.com/docs/threads/changelog/)
* Worth noting because it is widely misreported: the ghost posts, text attachments, GIFs, spoilers and reply approvals batch landed between October 2025 and February 2026, not this month.
* Still binding: posts with more than five links fail with `THREADS_API__LINK_LIMIT_EXCEEDED`.

### WhatsApp Cloud API

* Per message rate card updates for Saudi Arabia, India, Pakistan and Turkey, and eight new billing currencies including SAR and AED. Bahraini dinar is not among them. [Source](https://blueticks.co/blog/whatsapp-business-pricing-change-2026-per-message)
* The big one, 1 October 2026: replies inside the 24 hour customer service window stop being free. Human agent and third party AI replies get billed per message. Meta Business Agent replies move to per token billing. [Source](https://blog.peppercloud.com/whatsapp-api-pricing-everything-you-need-to-know/)
* Caveat: both items come from reseller blogs, not Meta's own pricing page, which the fetch tooling could not reach this run. Treat the direction as reliable and the exact rates as needing confirmation against Meta's official pricing docs before you reprice anything.

### TikTok

* Nothing. The official developer changelog's most recent entry is 4 June 2026 and it is a Data Portability documentation refresh. [Source](https://developers.tiktok.com/doc/changelog)
* Correction worth recording: several summaries currently claim "Content Posting API added photo posting, 4 August 2026". That is wrong. Photo posting shipped 3 November 2023. No action needed.
* Ads side: Smart+ and manual buying are being unified into a single flow, and TikTok Growth Max for Mini Games launched in August. Neither touches organic publishing.

### LinkedIn

* Version 202508 was sunset on 17 August 2026, one week ago. 202509 goes on 15 September and 202510 on 15 October. [Source](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes)
* Legacy Geo for ads targeting stops working entirely on 31 August 2026. Campaign creation with legacy geo returns 400 `INVALID_VALUE_FOR_FIELD`. Bing geo is the replacement.
* The top level `location` field is being removed from `/v2/me` and `/v2/people`. It may already return null. Migrate to `geoLocation` with the `geo~` projection.
* Additive in 202608: Matched Audiences API generally available, account level dynamic UTM parameters, new `MARKETING_QUALIFIED_LEAD` and `SALES_QUALIFIED_LEAD` conversion types. New cap of 1,000 DMP segments per sponsored account, returning 429 `SEGMENT_LIMIT_EXCEEDED`.

### X / Twitter

* 13 August 2026: the `video_total_views` metric in the Ads API was redefined. It now counts views that are 100 percent in view for at least three seconds plus manual play button clicks. The old MRC style definition (50 percent in view for two seconds) no longer applies. [Source](https://docs.x.com/changelog)
* Context still in force: Owned Reads priced at $0.001 per resource since 20 April 2026, and since 4 May 2026 retweets are no longer returned in keyword search results.

### YouTube

* 6 August 2026, documentation only: dead `contentDetails.like`, `.favorite` and `.subscription` references removed from the activities docs. [Source](https://developers.google.com/youtube/v3/revision_history)
* Carried forward and more important: since 1 June 2026 `videos.insert` and `search.list` bill against their own separate quota buckets rather than the shared 10,000 unit pool.

### Google Business Profile

* Nothing new. Latest entry is 24 July 2026, adding `reviewReplyUrl` to review reads. [Source](https://developers.google.com/my-business/content/latest-updates)
* Carried forward and unbuilt as far as I know: `RecurrenceInfo` on `LocalPost` has allowed native recurring posts since 7 April 2026, and `PolicyViolation` plus `ReviewReplyState` now expose why a review reply was rejected.

### Pinterest and Snapchat

* Pinterest: developer terms and guidelines were updated in August 2026, clarifying permitted use of Pinterest data. Worth a read if Pinterest is on the roadmap. [Source](https://developers.pinterest.com/docs/changelog/changelog/)
* Snapchat: campaigns must move from `objective` to `objective_v2_properties`, and FEED can now be bundled with CHAT_FEED for lower funnel goals. [Source](https://developers.snap.com/api/marketing-api/Ads-API/changelog)

---

## 2. What actually affects Tawaslo

Ranked by risk.

1. **LinkedIn 202508 is already dead.** If any Tawaslo request still sends `LinkedIn-Version: 202508`, it is failing right now, not in future. This is the only item on the list that could be breaking production today.
2. **LinkedIn Legacy Geo, seven days out.** If Tawaslo builds LinkedIn ad campaigns with legacy geo IDs, campaign creation starts returning 400 on 31 August.
3. **Meta v26.0 protocol retirements.** These are quiet breakers. Any helper that appends `pretty=1` for readable logs, sets `date_format`, or fans out with `GET /?ids=`, breaks on v26.0 and breaks everywhere on 27 October. ETag caching layers silently stop getting 304s and start paying full response cost.
4. **WhatsApp 1 October service window billing.** This is a margin question for Concierge, not a code question. Every automated reply Tawaslo sends inside the 24 hour window becomes a billed message. If Concierge pricing assumes free in window replies, the unit economics change on 1 October.
5. **Meta Page field deprecations.** `parking` and `current_location` are exactly the fields an F&B product tends to surface on a venue profile. Any Tawaslo screen showing parking info for a New Pages Experience page will start erroring.
6. **X `video_total_views` redefinition.** Nothing breaks, but any X video reporting Tawaslo shows a client will step down in absolute numbers around 13 August with no campaign explanation. Clients will ask.
7. **LinkedIn `location` field removal.** If Tawaslo shows a connected LinkedIn profile location anywhere, expect blanks.
8. **Instagram Explore Feed and Messenger Stories placements.** Only bites if Tawaslo exposes manual placement selection in an ads builder. Explore errors loudly, Messenger Stories fails silently, which is worse.
9. **YouTube split quota buckets.** If Tawaslo hit quota ceilings before, the shape of the problem changed. Uploads and search now exhaust independently.
10. **Instagram five hashtag cap.** Not new, but this is the item most likely to be quietly wrong in the composer. Worth a five minute verification rather than an assumption.

---

## 3. Recommendations

**Do this week**

* **Audit LinkedIn version headers.** Grep the codebase for `LinkedIn-Version` and any hardcoded `2025` or `2026` version string. Move everything to `202608`. Then set a recurring reminder so a version never expires under you again. Effort: half a day, plus regression testing on organisation posting.
* **Migrate LinkedIn ads geo targeting to Bing geo** if Tawaslo creates LinkedIn campaigns at all. Hard deadline 31 August. Effort: one to two days depending on whether geo IDs are stored per client.
* **Verify the Instagram hashtag cap in the composer.** Find the hashtag validation constant in the post composer, confirm it is 5 and not 30, and confirm the counter also counts hashtags typed into the first comment field, since Instagram counts those against the same cap. Effort: under an hour if the limit is a single constant.

**Do before 27 October**

* **Sweep the Meta HTTP client layer.** Search for `pretty`, `date_format`, `debug=`, `?ids=`, and any ETag or `If-None-Match` conditional request logic in the Meta wrapper. Replace `?ids=` fan out with proper Graph batch requests, drop the retired parameters, and remove the 304 code path. Effort: one to two days, mostly in one file if the Meta client is centralised.
* **Bump to Graph API v26.0 and remove any v20.0 references.** v20.0 disappears on 24 September. Effort: one day plus a publishing regression pass across Instagram, Facebook Pages and Reels.
* **Remove the deprecated Page fields** from whatever venue profile query Tawaslo runs. Drop `current_location`, `genre`, `network`, `parking`, `start_info` from the field list and hide the corresponding UI. If parking info matters to F&B clients, replace it with a Tawaslo owned field rather than a Meta read. Effort: half a day for the API change, more if it needs a replacement data model.

**Do before 1 October**

* **Model the WhatsApp Concierge cost change.** Pull a month of Concierge reply volume, split it into template versus in window service replies, and price the in window replies at the new per message rate for Bahrain and the Gulf markets. Decide whether Concierge stays flat rate or moves to a message allowance. Confirm the rates against Meta's own pricing documentation first, since this run's sources were resellers. Effort: one day of analysis, then a pricing decision.
* **Consider adding a reply budget cap per conversation** in Concierge so a runaway automation cannot burn a client's allowance. Effort: two to three days.

**Nice to have, no deadline**

* **Add a note to X video reporting** explaining the 13 August metric redefinition, so the step down is annotated rather than queried. A one line footnote on the report is enough. Effort: under an hour.
* **Migrate LinkedIn profile location** reads to `geoLocation` with the `geo~` projection. Effort: two hours.
* **Build Google Business Profile recurring posts** using `RecurrenceInfo`. This is a real feature Tawaslo could ship for F&B clients running weekly specials, and it removes a scheduling job Tawaslo currently has to fake. Effort: three to five days.
* **Surface GBP review reply rejection reasons** using `PolicyViolation` and `ReviewReplyState`, so clients see why a reply did not publish instead of it silently vanishing. Effort: two days.

---

## Sources

* [Meta Graph API v26.0 release coverage, PPC Land, 30 July 2026](https://ppc.land/meta-blocks-47-commerce-endpoints-as-graph-api-v26-0-lands-today/)
* [Instagram Platform changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
* [Threads API changelog](https://developers.facebook.com/docs/threads/changelog/)
* [LinkedIn Marketing API recent changes](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes)
* [X API and Ads API changelog](https://docs.x.com/changelog)
* [TikTok for Developers changelog](https://developers.tiktok.com/doc/changelog)
* [YouTube Data API revision history](https://developers.google.com/youtube/v3/revision_history)
* [Google Business Profile latest updates](https://developers.google.com/my-business/content/latest-updates)
* [Pinterest developer changelog](https://developers.pinterest.com/docs/changelog/changelog/)
* [Snapchat Marketing API change log](https://developers.snap.com/api/marketing-api/Ads-API/changelog)
* [Instagram five hashtag cap explainer, Later](https://later.com/blog/ultimate-guide-to-using-instagram-hashtags/)
* [WhatsApp per message pricing change, Blueticks](https://blueticks.co/blog/whatsapp-business-pricing-change-2026-per-message)
* [WhatsApp October 2026 service window billing, Pepper Cloud](https://blog.peppercloud.com/whatsapp-api-pricing-everything-you-need-to-know/)
* [Instagram feature roundup, Metricool](https://metricool.com/instagram-news/)
