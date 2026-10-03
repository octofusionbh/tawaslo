# Tawaslo Platform Watch, 14 September 2026

Weekly scan of developer changelogs and content publishing docs across every network Tawaslo integrates with or plans to. Covers what moved since the 7 September watch.

## Bottom line

Quiet week on the changelogs. One genuinely new item across all ten platforms: YouTube added `fhd`, `qhd` and `uhd` thumbnail sizes on 11 September, which is a small free quality win Tawaslo can take in about fifteen minutes. Everything else this week is the clock running down on things already flagged. LinkedIn `202509` sunsets tomorrow and the fallback in the code is still `202401`. Graph API v20.0 is removed in ten days and twenty call sites still point at v19.0. The WhatsApp October rate card lands in seventeen days and nothing has been built against it. All four open code items from last week are still open, verified against the repo this morning.

Two things this run that previous watches missed. WhatsApp usernames and the BSUID identifier are a standing gap nobody had flagged. And the outbound WhatsApp logging is thinner than the 7 September watch stated, which matters because the October cost model was going to be built on it. Both in section 2.

---

## 1. What changed, by platform

**YouTube**
* 11 September 2026: `snippet.thumbnails.(key)` now exposes higher resolution sizes for some videos, `fhd` at 1080p, `qhd` at 1440p and `uhd` at 4K. Applies to the `activities`, `liveBroadcasts`, `playlistItems`, `playlists`, `search` and `videos` resources. This is the only new entry on any platform changelog this week. Source: https://developers.google.com/youtube/v3/revision_history
* Standing: the 1 September `videos.getRating` readonly scope addition and the 27 August public view counting change are both live and unchanged. Source: same

**WhatsApp Cloud API**
* No new changelog entry since the 2 September October rate card. Note the accuracy caveat in section 3. Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/changelog
* Bahrain remains mapped to the Rest of Middle East rate card on country calling code 973, so the October service message and in window utility template charges apply at that regional rate. Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
* Newly surfaced this week, not new from Meta: the 2K and 10K daily messaging limit tiers are being removed in favour of a 100K baseline once Business Verification or the quality scaling path completes, and business portfolio pacing batches large sends and can halt the remainder on negative feedback signals. Source: https://woztell.com/whatsapp-api-2026-updates-pacing-limits-usernames/
* Also newly surfaced: WhatsApp usernames began in test countries in June 2026 and expand through H2. Where a user adopts a username, the phone number may not be returned and BSUID, the business scoped user ID, becomes the reliable identifier. A rolling 30 day window returns the phone number after any interaction. Source: same

**Facebook and Meta Graph**
* No new developer blog post since 27 August. Graph API v26.0 from 29 July remains the current release and no v27.0 has appeared. Source: https://developers.meta.com/blog/
* Unchanged clocks: v20.0 removed 24 September, v26.0 protocol retirements extend to all remaining versions 27 October, v21.0 removed 21 January 2027.

**Instagram**
* Official Instagram Platform changelog still shows nothing since 6 February 2026. The publishing surface has now been static for seven months. Source: https://developers.facebook.com/docs/instagram-platform/changelog
* Product side, all app only and none exposed through the API: Music Highlights test on iOS, a Next post button after the end of comments, new action button animations and haptics, Custom lists in Instants, WhatsApp Calls on Instagram, and the AI Creator label replaced by a clearer AI generated profile label. Source: https://socialbee.com/blog/instagram-updates/
* Hashtag cap remains five per post or reel, in force since December 2025. Tawaslo already matches at `ig:5`. Source: https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/

**LinkedIn**
* `202608` is still the latest published version. `202509` sunsets tomorrow, 15 September. `202510` follows on 15 October. Source: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes
* Legacy Geo for ads targeting is fully off as of 31 August. The top level `location` field removal from `/v2/me` and `/v2/people` continues, migrate to `geoLocation` with the `geo~` projection. Source: same
* Standing from August: DMP Segments capped at 1,000 per sponsored account, over the line returns `429` with `SEGMENT_LIMIT_EXCEEDED`. Source: same

**TikTok**
* No change. Latest entries remain 19 and 25 August, both Data Portability API documentation about Login Kit dependency. Content Posting API untouched since the photo endpoints. Source: https://developers.tiktok.com/docs/en/changelog
* Unaudited clients still have all posted content forced to private visibility.

**Threads**
* No change. Latest changelog entry is still 3 March 2026, oEmbed without an access token. Still no native scheduling parameter, so the container plus publish pattern with an external scheduler remains the only route. Source: https://developers.facebook.com/docs/threads/changelog
* Standing limits worth remembering: 250 posts per 24 hours, more than 5 links fails with `THREADS_API__LINK_LIMIT_EXCEEDED`, carousels up to 20 items.

**X**
* No change on the platform side. Pay per use has been the default since 6 February 2026, and legacy Pro subscriptions ended automatically after 1 September. Relevant cost shape for a publishing tool: roughly $0.015 per post created, rising to around $0.20 when the post carries a link. Source: https://postproxy.dev/blog/x-api-pricing-2026/
* I could not open the official X developer announcement to confirm those figures at source, so treat the exact numbers as secondary reporting. See section 3.

**Google Business Profile**
* No new entry since 24 July, when `reviewReplyUrl` became retrievable. Page last touched 28 August with no new item. Source: https://developers.google.com/my-business/content/latest-updates
* Still unbuilt and still the best unclaimed F&B feature on this surface: `RecurrenceInfo` for recurring local posts from 7 April, and `PolicyViolation` on rejected review replies from 1 July. Source: same

**Pinterest and Snapchat, not integrated**
* Nothing material either side this week.

---

## 2. What affects Tawaslo and how

* **YouTube high resolution thumbnails, new and easy.** Three helpers pick thumbnails and all three stop at `high` or lower. `api/trends.js` line 39 reads `high || medium || default`, `api/instagram-analytics.js` line 235 reads only `medium || default`, and `api/linkedin-oauth.js` line 68 reads only `medium || default`. Client facing cards and reports are showing a 480px image where a 1080p or 4K one is now available for free on the same response.

* **LinkedIn version fallback, sixth watch open, and the deadline is tomorrow.** `api/meta-publish.js` line 162 and `api/linkedin-oauth.js` line 188 both still read `process.env.LINKEDIN_API_VERSION || '202401'`, and `LINKEDIN_API_VERSION` is still not set anywhere in the repo. `202401` was retired in January 2025. Any LinkedIn publish or organization lookup that falls through to the default is sending a version that has been dead for twenty months.

* **Graph API v19.0 across twenty call sites, ten days to the next removal.** Confirmed this morning: 20 hardcoded `graph.facebook.com/v19.0` occurrences remain, split across `api/meta-oauth.js` (7), `api/meta-publish.js` (9), `api/instagram-analytics.js` (2), `api/instagram-inbox.js` (1) and `api/meta-ads.js` (1). Social publishing, page discovery, Instagram account linking, inbox and ads reads all run through this path. The four v21.0 calls are a separate cluster, all of them WhatsApp `/messages` at `api/cron.js` line 403, `api/generate-caption.js` line 820 and `api/meta-publish.js` lines 386 and 398. So WhatsApp sending is safe until v21.0 goes on 21 January 2027 and only the social side faces the 24 September floor, which is a cleaner split than last week's note implied.

* **WhatsApp October pricing, seventeen days out, still unmodelled, and the logging is thinner than last week's report assumed.** `api/meta-publish.js` line 375 and `api/cron.js` line 366 both fall back to a single account level `WA_PHONE_ID`, so every client sharing that fallback number draws from one pooled free service message allowance rather than each getting their own. Correction to the 7 September watch: only `api/generate-caption.js` line 848 writes an outbound `wa_messages` row. `api/meta-publish.js` logs inbound only at line 352, and both of its send paths, the `wa_broadcast` loop at line 386 and the single send at line 398, write nothing at all. `api/cron.js` line 403 is the same. So a counter built on outbound `wa_messages` rows today would see only Concierge auto replies and would miss every broadcast and every manual send. The logging hole has to be closed before any October cost model means anything.

* **WhatsApp BSUID, new gap, not yet a breakage.** Nothing in the repo reads or stores a business scoped user ID. `api/generate-caption.js` lines 838 and 848 log `from_number` as the sole identity on both inbound and outbound `wa_messages` rows, and the Concierge reply path keys entirely off that phone number. Once username adopters reach Bahrain, an inbound message from one of them will have no phone number to key on and the conversation will either fail to thread or create an orphan row. The 30 day rolling window means the failure will appear intermittently before it appears consistently, which is the worst shape of bug to debug later.

* **Instagram carousel cap, sixth watch open.** `src/TawasaloApp.js` line 8427 still reads `images.length >= 10` while Instagram accepts twenty. Line number moved from 7338 last week after the redesign, the code did not change.

* **YouTube view counting distortion, still unannotated.** `api/trends.js` line 48 and `api/instagram-analytics.js` lines 212 and 254 parse `statistics.viewCount`. Charts straddling 27 August still show a step change that is not real growth, and line 254 still maps `viewCount` into a field labelled `reach`.

* **Instagram hashtag cap.** `MAXTAG` at `src/TawasaloApp.js` line 11717 reads `{ ig:5, tiktok:20, x:5, fb:30, li:15 }` and the trim helper at line 11743 enforces it. The caption prompt at `api/generate-caption.js` line 497 also instructs a maximum of 5. Correct on all three, no action.

* **Meta v26.0 protocol retirements.** Rechecked, still no use of `date_format`, `pretty`, `debug`, `If-None-Match` or root level `/?ids=` against Graph. Nothing to fix.

* **TikTok, Threads, X, GBP, Pinterest, Snapchat.** Nothing forced this week.

---

## 3. Accuracy note on this run

Two sources would not verify at origin and you should weight them accordingly.

Meta's own documentation pages returned stale snapshots on every fetch this run. The Instagram Platform changelog came back topped out at 6 February 2026, the WhatsApp changelog at 17 April 2026, and the WhatsApp pricing page at 30 March 2026 with no October rate card section at all, even though last week's watch cited a 2 September rate card on that same pricing URL. The pages are almost certainly rendering their changelog lists client side and the fetch is getting a cached or partial render. So this week's WhatsApp and Instagram entries carry forward from the 7 September watch rather than being independently reconfirmed. Worth opening the WhatsApp pricing page in a browser yourself before you commit to any October number.

Separately, the official X developer announcement on pay per use pricing would not open, so the per post figures in section 1 come from secondary reporting rather than from X directly.

---

## 4. Recommendations, with rough effort

**A. Fix the LinkedIn version fallback. Do it today. Twenty minutes.**
`api/meta-publish.js` line 162 and `api/linkedin-oauth.js` line 188, change `'202401'` to `'202608'`. Lift it into one shared constants module so the two files cannot drift, and set `LINKEDIN_API_VERSION=202608` in Vercel so the fallback never actually runs. `202509` goes tomorrow and `202510` on 15 October, so add a quarterly bump reminder while you are in there. This has been open six watches and takes less time than reading this paragraph twice.

**B. Move all Graph calls off v19.0. This week. Two to three hours.**
Twenty call sites across five files, plus four already on v21.0 that should join them. Replace every hardcoded version with one shared constant, for example `const GRAPH_V = process.env.GRAPH_API_VERSION || 'v25.0'`, exported from the same small constants module as A so both fixes land in one sitting. v25.0 is the safe target because it predates the v26.0 protocol retirements and stays supported well past October. After the swap run one publish, one page discovery, one Instagram link, one inbox pull and one ads read to confirm nothing shifted.

**C. Take the YouTube high resolution thumbnails. Fifteen minutes.**
`api/trends.js` line 39, `api/instagram-analytics.js` line 235 and `api/linkedin-oauth.js` line 68. Extend each fallback chain to `uhd || qhd || fhd || high || medium || default`. The fields are absent on videos that do not have them, so the existing fallback handles it with no other change. Check that whatever renders these cards is not width capped at 480px, otherwise the larger file is downloaded and thrown away.

**D. Close the WhatsApp outbound logging hole, then model the October cost. Before 1 October. Half a day, now closer to a full day.**
Three parts, and the first one is new this week. First, make every send path log an outbound row. `api/generate-caption.js` line 848 already does it correctly, so copy that shape into the `wa_broadcast` loop at `api/meta-publish.js` line 386, the single send at line 398, and the cron send at `api/cron.js` line 403. Record `phone_id` on the row as well as `from_number`, and record whether the message was a template and which category, since service messages and utility templates bill differently from 1 October. Second, add a monthly counter over those rows keyed on phone number rather than on client, and surface it against the free allowance in the Concierge settings panel. Third, settle the commercial position: either give each client their own number so each gets its own allowance, or price the pooled allowance into the Concierge plan with a top up. Per number is cleaner but adds onboarding friction and one Meta review per number.

**E. Raise the Instagram carousel cap to twenty. Fifteen to thirty minutes.**
`src/TawasaloApp.js` line 8427, change `images.length >= 10` to `>= 20` and update the English and Arabic warning copy. Confirm `api/meta-publish.js` does not cap the carousel children loop separately. Sixth watch carrying this and still the cheapest feature win on the list.

**F. Add a BSUID column now, wire it later. One hour now.**
Add a nullable `bsuid` column to `wa_messages` and to the guest or contact table, and start writing it from the webhook payload alongside `from_number` even though nothing reads it yet. Doing the schema and the write now costs an hour and means that when username adopters reach Bahrain you have history to join on rather than a cold start. The read side logic, falling back to BSUID when the phone number is absent, can wait until Meta confirms regional rollout. This is the cheapest insurance on the list.

**G. Annotate YouTube view data at 27 August. Medium priority. One hour.**
Add a fixed marker to any chart drawing from `viewCount` and a one line note in the client report explaining that YouTube changed what counts as a public view on 27 August, so figures either side are not comparable. Separately rename the `reach` mapping at `api/instagram-analytics.js` line 254 to `views`.

**H. Build Google Business Profile recurring posts for F&B. Medium priority. One day.**
`RecurrenceInfo` on `LocalPost` has been available since 7 April and maps directly onto the weekly specials pattern most F&B clients already run in Tawaslo. Nothing forces this, but it is the largest unclaimed feature on the GBP surface and no competitor in the region appears to be using it.

---

*Next watch: 21 September 2026. Carry forward: Graph v20.0 removal on 24 September, WhatsApp October pricing on 1 October, LinkedIn `202510` sunset on 15 October, Meta v26.0 protocol retirements reaching all versions on 27 October.*
