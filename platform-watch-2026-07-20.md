# Tawaslo Platform Watch

**Week of 20 July 2026** | Prepared for Octo Fusion

Coverage this run: Instagram, Facebook, Threads, WhatsApp Cloud API, TikTok, LinkedIn, X, YouTube, Google Business Profile, Pinterest.

**Headline:** Two items need action soon. Instagram has formalised a 5 hashtag cap, so any composer that still allows 30 tags now signals low intent and can suppress reach. X now charges per post and has slashed the daily posting cap, which changes the economics of scheduling to X. Everything else is either an opportunity to add features or a version bump to schedule before autumn sunsets.

---

## 1. What changed, by platform

### Instagram
- Instagram has formalised a **5 hashtag maximum** as the recommended and effective limit. More than five can flag a post as low intent and reduce reach in feed and Reels. [Later guide](https://later.com/blog/ultimate-guide-to-using-instagram-hashtags/) | [DigitalApplied](https://www.digitalapplied.com/blog/instagram-limits-hashtags-5-organic-reach-strategy-2026)
- The API still caps Reels at **90 seconds** even though the app now allows 3 minutes, and library music still cannot be attached through the API (audio must be baked into the file before upload). [Postproxy Reels guide](https://postproxy.dev/blog/instagram-reels-api-publishing-guide/)
- **Carousel music** and updated Collabs (invite up to three co creators) exist natively, but adding library tracks and tagging private collaborators is still blocked through the API. [Media Business Worldwide](https://www.musicbusinessworldwide.com/instagram-now-lets-users-add-music-to-photo-carousels/) | [bundle.social](https://bundle.social/instagram-api)
- Advanced Access for the Instagram Graph API now requires **both Meta App Review and Business Verification** for any production app serving real users. [Phyllo](https://www.getphyllo.com/post/social-media-api-guide-on-top-apis-for-developers)

### Facebook and Meta Graph API
- The `metadata=1` field introspection shortcut was **removed across all versions on 19 May 2026**. [Meta changelog](https://developers.facebook.com/docs/graph-api/changelog)
- Meta is **retiring reach, video impressions and story impressions** from the Graph API through 2026, replacing them with Media Views, Media Viewers and a new Page Viewer metric. [Meta v25 blog](https://developers.facebook.com/blog/post/2026/02/18/introducing-graph-api-v25-and-marketing-api-v25/)
- **Graph API v20 expires 24 September 2026.** Marketing API v23 already expired on 9 June, leaving v24 as the oldest supported and Meta pointing straight to v25. [Meta versions](https://developers.facebook.com/docs/graph-api/changelog/versions/) | [Kitchn Q2 update](https://www.kitchn.io/blog/meta-marketing-api-q2-2026-update)

### Threads
- The Threads API had a large 2026 expansion for third party publishers: text attachments, GIFs, spoiler tags, ghost posts, cross sharing to Instagram Stories, reply approvals and real time publish or delete webhooks. Public post search and a lower profile discovery threshold (100 followers, down from 1,000) were also added. [Meta Threads blog](https://developers.facebook.com/blog/post/2026/04/14/whats-new-in-the-threads-api/) | [Social Media Today](https://www.socialmediatoday.com/news/meta-updates-threads-api-with-more-third-party-app-integrations/817502/)

### WhatsApp Cloud API
- A **message pricing update took effect on 1 July 2026** in selected markets. Italy, Spain, UK, Hong Kong, Singapore, Hungary, Romania and Qatar saw increases across marketing, utility or authentication categories. Poland dropped. Most other markets held steady. [YCloud pricing update](https://www.ycloud.com/blog/whatsapp-api-message-pricing-update-effective-july-1-2026)

### TikTok
- The Content Posting API now supports **photo carousels** (previously MP4 only), plus Duet and Stitch permissions, branded content disclosure, geo targeting of visibility, and webhook callbacks for upload status. Cap is 6 publish requests per minute per user token, tokens expire every 24 hours. [TikTok changelog](https://developers.tiktok.com/doc/changelog) | [TokPortal guide](https://www.tokportal.com/learn/tiktok-content-posting-api-developer-guide)
- From **9 July 2026**, mandatory product attributes are required when listing or editing products in certain health supplement categories via API (Shop side). [TikTok changelog](https://developers.tiktok.com/doc/changelog)

### LinkedIn
- LinkedIn ships **monthly API versions** (header format YYYYMM, each supported about a year). From version **202605** the `/rest/events` endpoint makes `endsAt` required, a breaking change, and creator analytics endpoints changed `metricType` from object to string. [LinkedIn recent changes](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-05)
- Posts now support **quote reshare** via `reshareUrl` in LinkedInPlatformData. [Phyllo](https://www.getphyllo.com/post/social-media-api-guide-on-top-apis-for-developers)

### X (Twitter)
- Since **6 February 2026, pay per use is the default**: about $0.015 per post, but **$0.20 per post that contains a link**, and the free tier is gone. [Postproxy X pricing](https://postproxy.dev/blog/x-api-pricing-2026/) | [SocialCrawl](https://www.socialcrawl.dev/blog/x-twitter-api-2026)
- In **May 2026 the unverified daily post cap was cut from 2,400 to 50 original posts** plus 200 replies, with reposts and quotes widely reported to count toward the 50. An April restructure also moved follow, like and quote actions to Enterprise only. [Sorsa rate limits](https://api.sorsa.io/blog/twitter-api-rate-limits-2026)

### YouTube
- Good news: `videos.insert` quota cost dropped from about 1,600 units to about 100 units, so the default tier now allows roughly 100 uploads a day. But since about **24 May 2026 a hidden 429 upload limit** has been failing uploads after a small number per day, separate from the documented quota. [YouTube revision history](https://developers.google.com/youtube/v3/revision_history) | [Phyllo quota guide](https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota)
- Since **1 June 2026, `search.list` bills to its own daily bucket** capped at roughly 100 calls a day, no longer drawing from the shared 10,000 unit pool. [Phyllo quota guide](https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota)

### Google Business Profile
- The **Business Profile Performance API is deprecated**; you must migrate to `locations.fetchMultiDailyMetricsTimeSeries`. [GBP latest updates](https://developers.google.com/my-business/content/latest-updates)
- **Recurring posts** are now supported via `RecurrenceInfo` when creating a LocalPost, and `ReviewReplyState` can now be read back on reviews. The Q&A API was discontinued on 3 November 2025. A stricter review content policy took effect in April 2026. [SlashPost GBP docs](https://slashpost.ai/blogs/google-business-profile/google-business-profile-api-documentation-2026)

### Pinterest
- Standard tier **rate limits are now published** per category. In the V5 API, publishing a pin can **no longer cross share to Facebook or X**, and board category selection is deprecated. You can now declare **AI generated content** in ad creatives. [Pinterest changelog](https://developers.pinterest.com/docs/changelog/changelog/)

---

## 2. What affects Tawaslo and how

**Breaks or limits an existing feature**

- **Instagram 5 hashtag cap.** If the composer still allows up to 30 tags, Tawaslo is now actively encouraging behaviour that suppresses client reach. Highest priority, small fix.
- **X per post pricing and 50 post daily cap.** Any Tawaslo plan that schedules bulk posts to X, especially posts with links, now hits a hard 50 post ceiling and a $0.20 charge per link post. This can break scheduling volume expectations and blow up cost assumptions. Needs a product and pricing decision, not just code.
- **Meta metric retirement.** Any Tawaslo analytics view that reads reach, video impressions or story impressions from the Graph API will start returning empty or errors as Meta retires them. Must switch to Media Views, Media Viewers and Page Viewer.
- **Graph API v20 sunset on 24 September 2026** and Marketing API already at v24 minimum. If Tawaslo calls v20 or earlier, publishing and insights will break in September. Version bump before then.
- **GBP Performance API deprecation.** If Tawaslo shows Google Business insights, the old performance endpoint must move to `locations.fetchMultiDailyMetricsTimeSeries` or the metrics panel goes dark.
- **YouTube hidden upload 429.** If Tawaslo publishes to YouTube, clients may see uploads fail after a handful per day even with quota left. Needs graceful handling and client messaging.
- **LinkedIn 202605 breaking change.** If Tawaslo creates LinkedIn events or reads creator analytics, the required `endsAt` field and the `metricType` string change will break those calls unless the version header and parsers are updated.

**Opportunities (new capability Tawaslo can adopt)**

- **Threads publishing** is now mature enough for a real integration (text, GIFs, spoiler tags, cross share to IG Stories, webhooks).
- **TikTok photo carousels** through the Content Posting API, matching what the app supports.
- **GBP recurring posts**, a natural fit for an F&B client posting daily specials.
- **Pinterest AI content disclosure** flag, useful as disclosure laws spread.

**Pricing and compliance to note, no code needed today**

- **WhatsApp July pricing** matters only if Tawaslo shows cost estimates or bills clients for Concierge messages in the affected markets. Bahrain and most Gulf markets were not on the increase list except Qatar, so review any rate tables for those specific countries.
- **Instagram Advanced Access** now needs App Review plus Business Verification. Make sure Tawaslo's app already holds both before onboarding new production clients.

---

## 3. Recommendations, with rough effort

1. **Instagram hashtag cap (do this first, about half a day frontend).** In the post composer, change the Instagram hashtag limit from 30 to 5 and update the helper text to recommend 3 to 5 specific tags. Look for the max hashtag constant in the composer or validation layer (a value like `MAX_HASHTAGS = 30` or a platform config entry for Instagram) and set it to 5. Add a soft warning rather than a hard block if you want to avoid disrupting saved drafts.

2. **Meta version and metrics (1 to 2 weeks, backend).** Bump all Graph and Marketing API calls to v25 before the September v20 sunset. In the analytics module, replace reach, video impressions and story impressions with Media Views, Media Viewers and Page Viewer. Test insights panels against a live account.

3. **X scheduling guardrails and pricing (1 to 2 days code, plus a product decision).** Add a daily post counter that warns clients before they exceed 50 original posts to X, and surface the extra cost of link posts. Decide whether Tawaslo absorbs the per post fee, passes it through, or caps X volume per plan. This is more a commercial call than an engineering one.

4. **GBP performance migration (about 1 week).** Swap the deprecated Business Profile Performance calls for `locations.fetchMultiDailyMetricsTimeSeries`. While in there, add recurring posts via `RecurrenceInfo`, which is an easy win for daily specials.

5. **YouTube upload resilience (2 to 3 days).** Catch the new 429 upload error, queue and retry with backoff, and show clients a clear message that YouTube is throttling rather than a generic failure.

6. **LinkedIn version bump (1 to 2 days).** Move the version header to a current month, make `endsAt` required in any event creation flow, and update analytics parsers for the `metricType` string format.

7. **Threads integration (2 to 3 weeks, new feature).** Scope a Threads publishing connector now that the API supports the post types Tawaslo needs. Good differentiator for the roadmap.

8. **TikTok photo carousels (about 1 week).** Extend the TikTok publisher to send photo carousels, and confirm whether any F&B clients touch the health supplement categories that now require mandatory product attributes.

9. **Housekeeping (ongoing).** Confirm the Instagram app holds App Review plus Business Verification before new production onboarding, and review WhatsApp rate tables for Qatar and any affected markets Tawaslo serves.

---

*Notes: Coverage focused on official developer changelogs plus reputable coverage. The freshest items this run are the WhatsApp pricing change effective 1 July and the TikTok health supplement attribute requirement from 9 July. The Instagram hashtag cap, X pricing and posting caps, and the Meta and GBP deprecations are recent and still unactioned, so they are carried here until closed. Effort estimates are rough and assume a single developer familiar with the codebase.*
