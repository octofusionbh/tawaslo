# Tawaslo Platform Watch, 22 September 2026

Weekly scan of developer changelogs and content publishing docs across every network Tawaslo integrates with or plans to. Covers what moved since the 14 September watch.

## Bottom line

Three real changes this week and one hard deadline in two days.

Graph API v20.0 is removed on **24 September**, confirmed at source on Meta's version table. Twenty call sites in the repo still point at v19.0, which was already below the floor, so those calls have been running on borrowed time and the floor is about to rise again. This is now the single highest risk item in the codebase and it has been open for seven watches.

LinkedIn published `202609`, so the fallback in the code is now twenty one months stale. WhatsApp's non template pricing page finally rendered at source this run, which is the first independent confirmation of the October charges since the doc started failing to fetch in early September, and it changes one thing the last two watches assumed. YouTube raised the thumbnail upload ceiling from 2MB to 50MB.

Meta also shipped a WhatsApp Business Tools MCP on 15 September that the last watch did not catch.

---

## 1. What changed, by platform

**Facebook and Meta Graph**

* **v20.0 is removed on 24 September, two days from now.** Confirmed directly on the version table, not from secondary reporting. v19.0 shows as expired on 21 May 2026 and v18.0 on 26 January 2026. v21.0 runs to 21 January 2027. Source: https://developers.facebook.com/docs/graph-api/changelog
* 15 September 2026: **Meta Business Messaging MCP** launched. It connects an AI coding agent to the WhatsApp Business Platform so you can create accounts, add numbers, build templates and send test messages programmatically. Source: https://developers.facebook.com/blog/post/2026/09/15/whatsapp-business-messaging-mcp-ai-agent/
* No v27.0 announcement. v26.0 from 29 July remains the current release. Source: https://developers.meta.com/blog/

**WhatsApp Cloud API**

* The non template pricing page opened cleanly this run and confirms the October timeline at source. From **1 October 2026** Meta charges per message for service messages, which have been free since November 2024, and for utility templates sent inside an open 24 hour customer service window, which have been free since July 2025. Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages
* **Correction to the last two watches.** That same page states plainly that service messages have **no volume tiers**. The widely repeated claim of 1,000 free service messages per business phone number per month appears only in reseller blogs and is not in Meta's documentation. Treat the pooled number problem as a per message cost problem, not a free allowance problem. Secondary claim source, for contrast: https://blog.peppercloud.com/whatsapp-api-pricing-everything-you-need-to-know/
* Service message rates equal utility and authentication rates for the same market. Bahrain sits on the Rest of Middle East card at country code 973. Rates effective 1 October were due to be published by 1 September.
* **Meta Business Agent** is a distinct message category, live and chargeable since 1 August at one global rate of $2.00 per 1M tokens, roughly 4 to 5 cents per message. Tawaslo Concierge runs its own AI, so every Concierge reply is a **service** message and gets the per message charge from 1 October, plus whatever the model costs separately. Same source.
* Payment method must be on file before **30 September** or Meta stops delivering service messages once they become chargeable. Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages

**LinkedIn**

* **`202609` is now the latest published version.** New in it: `accountIntelligence` finder gains `campaignGroup`, `objectiveType` and `seniority` filters, `adAnalytics` gains a `MEMBER_DESIGNATED_MARKET_AREA` pivot, and `/conversionEvents` accepts `hashedFirstName` and `hashedLastName`. A 180 day attribution window was added on `/conversions` across all active versions. Source: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-08
* Sunset clock: `202509` went on 15 September as expected. `202510` goes **15 October**, `202511` on **16 November**. Same source.

**YouTube**

* 14 September 2026: maximum upload size for `thumbnails.set` and `playlistImages.insert` raised from **2MB to 50MB**. Source: https://developers.google.com/youtube/v3/revision_history
* Carried from last week and still live: 11 September added `fhd`, `qhd` and `uhd` thumbnail sizes, and 27 August changed public view counting to count at play start across all formats. Same source.

**Instagram**

* Official Instagram Platform changelog still tops out at **6 February 2026**. The publishing surface has now been static for over seven months. Source: https://developers.facebook.com/docs/instagram-platform/changelog
* Product side, all app only, none exposed through the API: a **Replace Audio** tool that swaps music on already published feed posts and carousels without losing engagement, **First Draft** auto assembly for Reels, **Series** for episodic reels, a new Story composer UI on iOS and a compact pill music box for Reels. Source: https://socialbee.com/blog/instagram-updates/
* Hashtag cap remains five per post or reel. Tawaslo already matches. Source: https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/

**TikTok**

* No change affecting publishing. The official changelog tops out at **4 June 2026**, a Data Portability documentation update. Content Posting API untouched. Source: https://developers.tiktok.com/doc/changelog
* Note a source discrepancy. Search indexes surface August 2026 entries on `developers.tiktok.com/docs/en/changelog` that do not appear on `developers.tiktok.com/doc/changelog`. The two paths are serving different content. The August items described, photo posting and URL pull, are both long standing capabilities from 2023, so the indexed entries look like restated documentation rather than new product. Nothing to act on either way.
* Unaudited clients still have all posted content forced to private visibility.

**Threads**

* Could not verify this run. The official changelog returned a Meta error page. No secondary source reports anything after the April 2026 Page backed Threads accounts item. Blocked URL: https://developers.facebook.com/docs/threads/changelog

**X**

* No change. Pay per use remains the default since February 2026. Follow, like and quote post write endpoints remain Enterprise only since 20 April. Legacy Pro ended 14 August. Source: https://postproxy.dev/blog/x-api-pricing-2026/
* Still secondary reporting only. X's own announcement would not open again this week.

**Google Business Profile**

* No new entry. Latest remains **24 July 2026**, `reviewReplyUrl` retrievable on reviews. Page last touched 28 August with nothing added. Source: https://developers.google.com/my-business/content/latest-updates
* Still unbuilt: `RecurrenceInfo` for recurring local posts from 7 April, `PolicyViolation` on rejected review replies from 1 July, `ReviewMediaItem` from 20 April.

**Pinterest, not integrated**

* September 2026: Pinterest now **automatically appends UTM parameters** to eligible ad destination URLs unless the advertiser opts out, and this cannot be managed through the API. Also new, agency owned ad account endpoints. Worth knowing if Tawaslo ever adds Pinterest reporting, since exact URL matching will break. Source: https://developers.pinterest.com/docs/changelog/changelog/
* Separately, all ad campaigns must migrate to objective simplification by 1 February 2027.

**Snapchat, not integrated**

* Nothing since 6 May 2026. Source: https://developers.snap.com/api/marketing-api/Ads-API/announcements

---

## 2. What affects Tawaslo and how

* **Graph v19.0 across twenty call sites, and the floor rises in two days.** Reverified this morning, unchanged from last week. `api/meta-oauth.js` has 7 at lines 25, 34, 41, 64, 72, 81 and 89. `api/meta-publish.js` has 9 at lines 24, 51, 134, 138, 140, 144, 146, 152 and 157. `api/instagram-analytics.js` has 2 at lines 15 and 24. `api/instagram-inbox.js` has 1 at line 11. `api/meta-ads.js` has 1 at line 8. That covers social publishing, page discovery, Instagram account linking, inbox and ads reads. The four WhatsApp `/messages` calls sit separately on v21.0 at `api/cron.js:403`, `api/generate-caption.js:820` and `api/meta-publish.js:386` and `:398`, so WhatsApp sending is safe until January 2027. Only the social side is exposed on Thursday.

* **LinkedIn version fallback, seventh watch open.** `api/linkedin-oauth.js:188` and `api/meta-publish.js:162` both still read `process.env.LINKEDIN_API_VERSION || '202401'`, and `LINKEDIN_API_VERSION` is still not set anywhere in the repo. `202401` retired in January 2025. With `202609` now published the fallback is twenty one months behind.

* **WhatsApp October cost, and the free allowance assumption was wrong.** Two watches assumed a free service message allowance to build a counter against. Meta's own page says service messages have no volume tiers, so from 1 October every Concierge auto reply costs the Bahrain utility rate, first message onwards. That changes the shape of the fix. The pooled `WA_PHONE_ID` fallback at `api/meta-publish.js:375` and `api/cron.js:366` is no longer a shared allowance problem but a **cost attribution** problem: without per client separation there is no way to bill the right client for the right messages.

* **WhatsApp outbound logging hole, unchanged and now urgent.** Reverified. Only `api/generate-caption.js:848` writes an outbound `wa_messages` row. `api/meta-publish.js:362` logs inbound only. The `wa_broadcast` loop at line 386, the single send at line 398 and the cron send at `api/cron.js:403` write nothing. Nine days from chargeable, Tawaslo has no record of most of what it sends. Note that the pricing page documents a cleaner route than counting rows: the `pricing` object on message status webhooks now carries `billable`, `category` and `type`, and the Pricing Analytics API accepts `pricing_category: SERVICE`. Reading Meta's own billing signal beats reconstructing it.

* **Payment method before 30 September.** Eight days. If no payment method sits on the WhatsApp Business Account, Concierge replies simply stop delivering on 1 October. This is an account admin task, not a code task, and it is the cheapest catastrophic failure on the list to avoid.

* **YouTube thumbnail upload ceiling.** Nothing in the repo uploads thumbnails today, so no breakage. Worth noting only if video upload is ever added.

* **YouTube high resolution thumbnails, second watch open.** `api/trends.js:39` reads `high || medium || default`, `api/instagram-analytics.js:235` reads only `medium || default`, and `api/linkedin-oauth.js:68` reads only `medium || default`. Client facing cards still show 480px images where 1080p or 4K is free on the same response.

* **Instagram carousel cap, seventh watch open.** `src/TawasaloApp.js:8427` still reads `images.length >= 10` with the copy "Up to 10 images in a carousel." Instagram accepts twenty.

* **Instagram hashtag cap, still correct.** `MAXTAG` at `src/TawasaloApp.js:11717` reads `{ ig:5, tiktok:20, x:5, fb:30, li:15 }`, the trim helper at 11743 enforces it, and the caption prompt at `api/generate-caption.js:497` instructs a maximum of 5. No action.

* **Instagram Replace Audio, a support question not a code change.** Clients will start swapping audio on posts Tawaslo published. Nothing breaks, but any cached media or thumbnail Tawaslo holds may drift from what is live. Worth a line in client documentation rather than a ticket.

* **YouTube view counting distortion, still unannotated.** `api/trends.js:48` and `api/instagram-analytics.js:212` and `:254` parse `statistics.viewCount`. Charts straddling 27 August still show a step that is not real growth, and line 254 still maps `viewCount` into a field labelled `reach`.

* **TikTok, Threads, X, GBP, Pinterest, Snapchat.** Nothing forced this week.

---

## 3. Recommendations, with rough effort

**A. Move every Graph call off v19.0. Today or tomorrow. Two to three hours.**
Twenty call sites across five files, plus the four already on v21.0 that should join them. Replace every hardcoded version with one shared constant, for example `const GRAPH_V = process.env.GRAPH_API_VERSION || 'v25.0'`, exported from a small constants module. v25.0 is the safe target: it predates the v26.0 protocol retirements and stays supported well past October. After the swap run one publish, one page discovery, one Instagram link, one inbox pull and one ads read. This is the only item on the list with a deadline inside the week.

**B. Fix the LinkedIn version fallback. Twenty minutes, same sitting as A.**
`api/linkedin-oauth.js:188` and `api/meta-publish.js:162`, change `'202401'` to `'202609'`. Put it in the same constants module as A so the two files cannot drift, and set `LINKEDIN_API_VERSION=202609` in Vercel so the fallback never runs. Add a quarterly bump reminder while you are there: `202510` goes 15 October and `202511` on 16 November.

**C. Add a payment method to the WhatsApp Business Account. Before 30 September. Fifteen minutes, no code.**
Eight days. Without it Concierge stops delivering on 1 October. Do this before anything else on the WhatsApp list, because the rest of the WhatsApp work is worthless if delivery halts.

**D. Log outbound WhatsApp, and read Meta's billing signal rather than reconstructing it. Before 1 October. Half a day.**
Three parts. First, make every send path write an outbound row: copy the shape at `api/generate-caption.js:848` into the `wa_broadcast` loop at `api/meta-publish.js:386`, the single send at `:398`, and the cron send at `api/cron.js:403`. Record `phone_id` alongside `from_number`, plus whether the message was a template and which category. Second, subscribe to the message status webhook and store the `pricing` object it carries, `billable`, `category` and `type`, against the row. That is Meta telling you what it charged, which is better than any counter you build. Third, plan to reconcile monthly against the Pricing Analytics API with `pricing_category: SERVICE`.

**E. Settle the Concierge commercial position. This month. Half a day of thinking, not code.**
There is no free allowance. Every Concierge reply costs the Bahrain utility rate from 1 October, on top of the model cost. Either give each client their own number so costs attribute cleanly, which adds onboarding friction and one Meta review per number, or keep the pooled number and price a per message cost into the Concierge plan with a cap. Decide before the first invoice lands, not after. Meta's own comparison puts a third party AI service message at roughly 2 to 3 cents at the low end, against 4 to 5 cents for Meta Business Agent, so the margin for a self built agent is real but thinner than it was.

**F. Raise the Instagram carousel cap to twenty. Fifteen to thirty minutes.**
`src/TawasaloApp.js:8427`, change `images.length >= 10` to `>= 20` and update the English and Arabic warning copy. Confirm `api/meta-publish.js` does not cap the carousel children loop separately. Seventh watch carrying this and still the cheapest feature win on the list.

**G. Take the YouTube high resolution thumbnails. Fifteen minutes.**
`api/trends.js:39`, `api/instagram-analytics.js:235` and `api/linkedin-oauth.js:68`. Extend each fallback chain to `uhd || qhd || fhd || high || medium || default`. Absent fields fall through on their own. Check the rendering card is not width capped at 480px, otherwise the larger file downloads and gets thrown away.

**H. Annotate YouTube view data at 27 August. Medium priority. One hour.**
Add a fixed marker to any chart drawing from `viewCount` and a one line note in the client report saying YouTube changed what counts as a public view on 27 August, so figures either side are not comparable. Rename the `reach` mapping at `api/instagram-analytics.js:254` to `views`.

**I. Look at the WhatsApp Business Messaging MCP. Medium priority. Half a day to evaluate.**
Meta's new MCP handles account creation, number onboarding and template building programmatically. Number onboarding is currently the slowest part of taking on a Concierge client, and if per client numbers become the answer to E, this is what makes that decision affordable. Evaluate before committing to the pooled number path.

**J. Build Google Business Profile recurring posts for F&B. Medium priority. One day.**
`RecurrenceInfo` on `LocalPost` has been available since 7 April and maps directly onto the weekly specials pattern most F&B clients already run. Nothing forces it, but it remains the largest unclaimed feature on the GBP surface.

---

## 4. Accuracy note on this run

Better than last week. Meta's WhatsApp non template pricing page and the Graph API version table both rendered fully at source, so the October charges and the 24 September removal date are confirmed first hand rather than carried forward. The Instagram Platform changelog and the Meta developer blog also returned current content.

Three gaps remain. The Threads changelog returned a Meta error page and could not be checked at all. X's own developer announcement would not open again, so the pay per use figures stay secondary. And TikTok is serving two different changelogs on two different paths, described in section 1.

Worth flagging that the 1,000 free service messages figure, repeated in this watch twice before, does not appear in Meta's documentation. If a reseller or BSP has told you otherwise in writing, get it confirmed before 1 October.

---

*Next watch: 29 September 2026. Carry forward: Graph v20.0 removal 24 September, WhatsApp payment method 30 September, WhatsApp service and utility charging 1 October, LinkedIn `202510` sunset 15 October, Meta v26.0 protocol retirements reaching all versions 27 October, LinkedIn `202511` sunset 16 November.*
