# Tawaslo Platform Watch, 12 October 2026

## Bottom line

Graph API v20.0 was removed on 24 September, and the code still has about twenty calls on v19.0 (already expired 21 May). WhatsApp service message charges started 1 October. LinkedIn version 202510 sunsets on 15 October. Everything else this week is minor.

## 1. What changed, by platform

**Meta (Instagram, Facebook, Graph)**
* Graph v21.0 and up have no sunset date; v19.0 and v18.0 are expired. Source: https://developers.facebook.com/docs/graph-api/changelog
* Instagram caps captions at 5 hashtags, rolling out gradually since December 2025. Not confirmed whether the API enforces it. Source: https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/
* Content Publishing API can set the paid partnership label at publish; Reels reposts, saves and shares metrics added. Source: https://www.socialmediatoday.com/news/meta-expands-instagram-management-apis/818385/
* Facebook is moving video into Reels; Instagram Live video ads are generally available. Source: https://orthotropy.com/en/insights/social-media-platform-updates-2026-10
* One secondary source says Marketing API v24.0 expires 6 October. Meta's own table does not show it. Unverified.

**WhatsApp Cloud API**
* From 1 October service messages and in window utility templates are charged. Status webhooks now show type regular instead of free_customer_service. Source: https://www.courier.com/blog/whatsapp-pricing-changes-october-2026

**Threads**
* Scheduled posts can carry text attachments and GIFs, spoiler tags, reply approval, and search now works from 100 followers. Source: https://www.socialmediatoday.com/news/meta-updates-threads-api-with-more-third-party-app-integrations/817502/
* Podcast tools and richer insights rolling out. Source: https://orthotropy.com/en/insights/social-media-platform-updates-2026-10

**TikTok**
* No Content Posting API change. Advertiser AI tools announced; no API detail. Source: https://developers.tiktok.com/doc/changelog

**LinkedIn**
* Version 202509 sunset 15 September; 202510 sunsets 15 October. Version 202609 is current. Source: https://orthotropy.com/en/insights/social-media-platform-updates-2026-10

**X**
* Pay per use: posts $0.015, posts with a URL $0.20. Video limits now follow the posting user's Premium status (403 above 20 minutes for default accounts) since 1 September. Source: https://docs.x.com/changelog

**YouTube**
* Granular quota buckets (videos.insert separate from the rest) since 1 June; thumbnail upload limit 50MB; brandPartner part on videos.insert. Source: https://developers.google.com/youtube/v3/revision_history
* Shorts seasons and episodes rolling out (Studio feature, no API). Source: https://orthotropy.com/en/insights/social-media-platform-updates-2026-10

**Google Business Profile**
* 9 October: DietaryRestriction adds GLUTEN_FREE and DAIRY_FREE for food menus. 24 July: review reply URLs. 7 April: recurring scheduled posts. Source: https://developers.google.com/my-business/content/change-log

**Pinterest, Snapchat:** Pinterest auto UTM on ads from 15 September. Snapchat: nothing found.

## 2. Impact on Tawaslo

* v19.0 calls are expired and risk failing: api/meta-oauth.js, meta-ads.js, meta-publish.js, instagram-analytics.js, instagram-inbox.js. Highest risk item.
* WhatsApp Concierge replies are service messages and now cost money per message (api/cron.js, api/generate-caption.js).
* Hashtag cap of 5 is already enforced in the caption prompts in api/generate-caption.js (lines about 497 and 625). No change needed, but manual captions are not capped.
* X video posting could 403 for non Premium users.
* LinkedIn 202510 sunset affects any pinned version header.

## 3. Recommendations

1. Replace every v19.0 and v21.0 in api/*.js with one shared GRAPH_VERSION constant set to v23.0 or later. Effort: 1 to 2 hours plus a smoke test of connect, publish, analytics and inbox. Do this first.
2. Log WhatsApp status webhooks with type regular and add a per client Concierge message counter for billing. Effort: half a day.
3. Add a soft warning in the composer when a caption has more than 5 hashtags. Effort: 30 minutes.
4. Check the LinkedIn version header in the code and move it to 202609. Effort: 1 hour.
5. Optional: add partnership label toggle to Instagram publishing and Reels saves and shares to analytics. Effort: half a day each.
6. Optional: surface X video length errors with a clear message. Effort: 1 hour.
7. Optional: add gluten free and dairy free tags to the Google Business menu sync. Effort: 1 hour.
