# Tawaslo Platform Watch

Week of 10 August 2026. Owner: Octo Fusion.

Scope this run covered Instagram, Facebook, Threads, WhatsApp Cloud API, TikTok, LinkedIn, X, YouTube, Google Business Profile and Pinterest. A few items below predate this week but still need action, so I kept them in. Newer items are flagged as fresh.

## 1. What changed, by platform

**Instagram**
* Carousels now allow up to 20 frames, doubled from 10. You can also add collaborators to carousels, and a new Replace Audio feature lets you swap music on already published feed posts and carousels. Fresh this month. Source: https://napoleoncat.com/blog/instagram-new-features-and-updates/
* Post analytics now expose a view count field on feed posts. Source: https://embedsocial.com/blog/new-instagram-features-2026/
* Reminder still in force: the five hashtag cap that rolled out December 2025 remains the hard limit. Anything above five is stripped or blocks publishing. Source: https://later.com/blog/ultimate-guide-to-using-instagram-hashtags/

**Facebook and Meta Graph API**
* Graph API v20 reaches end of life on 24 September 2026. v19 already expired in May 2026. Source: https://singhamandeep.com/meta-graph-api-version-deprecation/
* Marketing API is phasing out ASC and AAC campaign types by September 2026. Source: https://schedulifyx.com/blog/meta-api-changes-2026-guide

**Threads**
* Post Intents gained parameters for replies and quote posts in March 2026. Container plus publish model is stable. Daily cap sits at 250 posts. Source: https://www.threads.com/@threadsapi.changelog
* Page backed Threads accounts can now run Threads ads, and existing Facebook or Instagram posts can be promoted. Source: https://embedsocial.com/blog/new-threads-features-2026/

**WhatsApp Cloud API**
* From 1 August 2026 a new Meta Business Agent category for AI replies bills per token at 2.00 USD per one million tokens. Fresh. Source: https://blueticks.co/blog/whatsapp-business-api-pricing-2026
* From 1 October 2026 service messages and in window utility replies become billable again. Several markets move to standalone rate cards, with new rates published by 1 September 2026. Source: https://www.wati.io/en/blog/whatsapp-api-pricing-guide/

**TikTok**
* No new developer changelog entries since 4 June 2026. Content Posting API stays free, capped at six publish requests per minute per user token, tokens expire every 24 hours, and unaudited apps are forced to private visibility. Source: https://www.tokportal.com/learn/tiktok-content-posting-api-developer-guide

**LinkedIn**
* Community Management API is on version 202506 with new member video analytics endpoints and a Development Tier rate limit raised from 100 to 500 requests per app. Source: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-06

**X**
* As of February 2026 the free tier closed for new developers and pricing moved to pay per usage. Posting costs about 0.015 USD per post, more with a link. Unverified accounts were cut to 50 original posts and 200 replies per day in May 2026. Source: https://www.socialcrawl.dev/blog/x-twitter-api-2026

**YouTube**
* Since June 2026 video uploads bill to their own daily bucket of about 100 uploads, separate from the 10,000 unit pool, and the old 1,600 unit upload cost is gone. Source: https://developers.google.com/youtube/v3/revision_history

**Google Business Profile**
* Reviews API now surfaces the specific policy violations behind any rejected review reply. Source: https://developers.google.com/my-business/content/latest-updates

**Pinterest**
* New AI advertiser and shopping tools launched, plus Amazon Storefront linking for creators. Posting API write limit stays at 100 requests per minute. Source: https://releasebot.io/updates/pinterest

## 2. What affects Tawaslo

Fresh this week and worth acting on:
* WhatsApp AI reply token billing started 1 August 2026. If Tawaslo Concierge flows use Meta side AI replies, cost per conversation just changed. Even if not, the 1 October return of billable service and utility replies will hit F&B clients who send order confirmations and support replies.
* Instagram carousels at 20 frames and carousel collaborators mean the composer likely caps users below what the platform now allows, so you are leaving capability on the table.

Standing items that break or limit features if ignored:
* Meta Graph API v20 end of life on 24 September 2026. If any Tawaslo app call still targets v20 or lower, publishing to Instagram and Facebook will start failing after that date. This is the highest risk item.
* Instagram five hashtag cap. If the composer still lets users add more than five hashtags, posts either fail or silently lose tags, which looks like a Tawaslo bug to clients.
* X posting caps and pay per usage. Scheduling more than 50 posts a day for an unverified account will fail, and every post now carries a real cost.

Low impact this week: TikTok, LinkedIn, YouTube, Threads, Pinterest and Google Business Profile had no breaking change for Tawaslo. LinkedIn and YouTube quota changes are favorable.

## 3. Recommendations, with effort

**Meta Graph API version. High priority, medium effort.**
Audit every Graph and Marketing API call for the version string in the URL, for example v20.0. Bump all to the current supported version and retest Instagram and Facebook publishing before 24 September 2026. Search the codebase for the version constant, likely a single config value, then run the publish test suite.

**Instagram hashtag cap. High priority, small effort.**
Set the hashtag input limit to five in the post composer. Look for the max hashtag validation value in the composer or caption component and change it to 5. Add a helper note recommending three to five relevant tags. This is a config or validation constant change plus a copy tweak.

**Instagram carousel limit and collaborators. Medium priority, small to medium effort.**
Raise the carousel frame cap from its current value to 20 in the composer validation. Adding carousel collaborator support and the Replace Audio action are larger, since they need new API fields and UI, so scope those as a follow up rather than this sprint.

**WhatsApp billing changes. Medium priority, small effort now, planning effort later.**
Confirm whether Concierge flows rely on Meta Business Agent AI replies. If yes, update client cost estimates for the per token rate. Before 1 October 2026, review any automated service and utility message flows and warn F&B clients that these become billable. No code break, but pricing and client comms need updating.

**X posting guardrails. Medium priority, small effort.**
Add a soft daily cap and a warning in the scheduler for X accounts that are not verified, around 50 posts, so client campaigns do not silently fail. This is a validation and messaging change in the scheduler.

**YouTube and LinkedIn. Low priority, monitor only.**
Both quota changes are favorable. No action beyond noting the higher LinkedIn Development Tier limit if you were previously throttled.

**Google Business Profile. Low priority, small effort optional.**
If Tawaslo surfaces review replies, you can now show clients why a reply was rejected by reading the new policy violation field. Nice to have, not urgent.

Nothing else material surfaced across the other platforms this week.
