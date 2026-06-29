# Tawaslo Platform Watch

Week of 29 June 2026. Prepared for Octo. Covers every network Tawaslo publishes to or plans to.

## Top line

Two items this week need action. Instagram is now capping hashtags at 5 in the app and suppressing reach on posts that use more, and Tawaslo currently generates up to 7 and lets the composer paste unlimited tags. Separately, Meta is deprecating the old Reach and Impressions metrics across Facebook and Instagram in June 2026, so any analytics Tawaslo reads from those fields will start returning empty. Everything else is informational or forward looking.

---

## 1. What changed, grouped by platform

### Instagram
* Hashtag cap dropped to 5 in the app, with some accounts tested at 3. Posts using more than 5 now get suppressed distribution in Explore, hashtag pages and Reels recommendations. Source: https://www.digitalapplied.com/blog/instagram-limits-hashtags-5-organic-reach-strategy-2026
* Content Publishing API can now apply the paid partnership disclosure label at publish time, instead of forcing a manual step in the app afterward. Source: https://developers.facebook.com/blog/post/2025/12/03/instragram-api-updates/
* Expanded metrics now report reposts, saves and shares, plus aggregated views, likes and comments across placements. Source: https://www.socialmediatoday.com/news/meta-expands-instagram-management-apis/818385/

### Facebook and Meta Graph API
* Post and Page Reach, Video Impressions, Story Impressions and 3 second Viewers are deprecated in June 2026. Meta replaces them with Media Views and Media Viewers, and is adding a Page Viewer metric by end of June. Source: https://developers.facebook.com/docs/graph-api/changelog
* Graph API v25 is current. The metadata=1 query parameter is now ignored and is being removed. Webhook mTLS certificates moved to the Meta CA earlier this year. Source: https://developers.facebook.com/blog/post/2026/02/18/introducing-graph-api-v25-and-marketing-api-v25/

### Threads
* The Threads API now supports full third party publishing, including ghost posts, cross sharing to Instagram Stories, text attachments, GIFs, spoiler tags, reply approvals and real time publish or delete webhooks. Profile discovery threshold dropped from 1,000 to 100 followers. Source: https://www.socialmediatoday.com/news/meta-updates-threads-api-with-more-third-party-app-integrations/817502/

### WhatsApp Cloud API
* Billing is per delivered template message across the four categories (marketing, utility, authentication, service). New rate cards take effect 1 July 2026. The markets with changes are Italy, Spain, the UK, Poland, Hong Kong, Hungary, Qatar, Romania and Singapore. Bahrain is not on the change list this round. A further pricing update lands 1 October 2026. Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing

### TikTok
* Content Posting API now supports photo posts in addition to video. Direct Post allows fully automated publishing, but any app that has not passed the separate content posting audit is locked to SELF_ONLY, meaning posts are visible only to the creator. Daily cap is around 15 posts per creator. Source: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post

### LinkedIn
* Community Management API now exposes profile and content analytics (impressions, reach, reactions, comments, reposts, video watch time). From version 202605 the metricType field changed from object to string. Media must be registered and uploaded asynchronously before it can be attached to a post. Developer support moves to a request form, with the old Zendesk path sunsetting after 15 May 2026. Source: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes

### X (Twitter)
* X made pay per use the default on 6 February 2026. No free tier for new developers. Posting costs about 0.015 dollars per post, and 0.20 dollars if the post contains a link. Following, liking and quote posting moved to Enterprise only. Legacy Basic subscribers were auto migrated to pay per use starting 1 June 2026. Source: https://postproxy.dev/blog/x-api-pricing-2026/

### YouTube
* Good news on quota. Google cut the videos.insert cost from about 1,600 units to about 100 units on 4 December 2025, so the default 10,000 unit daily quota now allows roughly 100 uploads per day instead of six. Shorts still use the same videos.insert endpoint with 9:16 vertical and duration under 60 seconds. Source: https://www.socialcrawl.dev/blog/youtube-data-api-2026

### Google Business Profile
* You can now create recurring posts through the LocalPosts API by setting RecurrenceInfo. Reviews API now returns ReviewReplyState so you can track reply moderation. Offers data was added to the performance metrics on 25 March 2026. Source: https://developers.google.com/my-business/content/latest-updates

### Pinterest
* Standard tier per category rate limits are now published as plain numbers. Trial caps stack at 1,000 requests per day per app. Apps should test new features in Sandbox before 15 June 2026 and must add the new campaign objectives before 1 February 2027. Source: https://developers.pinterest.com/docs/changelog/changelog/

---

## 2. What affects Tawaslo and how

**Breaks or limits an existing feature**

* Instagram hashtag cap. This is the big one. Tawaslo's Hashtag Lab and the caption API return up to 7 tags, and the composer lets a user paste any number. Posts that carry more than 5 now lose reach. Tawaslo is actively pushing users toward behaviour that Instagram penalises.
* Meta metric deprecation. Any Instagram or Facebook analytics in Tawaslo that read Reach, Impressions, Video Impressions or Story Impressions will return empty after the June cutover. If the dashboard shows these numbers, they will silently go to zero.

**Cost or access risk**

* X pay per use. If Tawaslo posts to X on behalf of clients through a legacy Basic key, that key was auto migrated to pay per use on 1 June. Posting now bills per post, and any post with a link (very common for F&B promos and bio links) costs 0.20 dollars each. This can add up fast at scale and should be metered.
* WhatsApp rates. Tawaslo's home market Bahrain is not in this round of changes, so Concierge messaging cost is unchanged for now. Qatar did change, so any Gulf expansion pricing should be rechecked against the 1 July card.

**Opportunity, not yet integrated**

* Threads publishing is now open to third party tools. Tawaslo does not integrate Threads today. This is a clean addition that sits next to the existing Meta connections.
* TikTok is marked Not connected yet in the app. When it is built, the content posting audit is mandatory or every post stays private. Plan the audit into the timeline.
* LinkedIn is marked Code ready, awaiting app and API review. Build against version 202605 so the metricType string change and the async media upload flow are handled from day one.
* Instagram paid partnership label at publish, GBP recurring posts and review reply status, and the YouTube cheaper upload quota are all low effort wins that improve the product.

---

## 3. Recommendations, with rough effort

**A. Cap Instagram hashtags at 5. High priority. Small effort.**
Three spots to change.
1. Caption API. In `api/generate-caption.js` the hashtag and campaign fallback uses `Math.min(7, Math.max(3, count))`. Change the upper bound to 5 for Instagram so the generator never returns more than 5.
2. Hashtag Lab display. In `src/TawasaloApp.js` around line 3552 to 3559 the tool renders every returned tag. Slice to 5 for Instagram and show a short note that Instagram now favours 5.
3. Composer guard. In `src/TawasaloApp.js` at line 6925 there is a character counter using `const lim={ig:2200,fb:63206,li:3000,tt:2200,tw:280,yt:5000}`. Add a parallel hashtag counter that counts `#` tokens in the caption and warns in amber when an Instagram account is selected and the count exceeds 5. Same pattern as the existing over limit styling.
Effort: about half a day including the bilingual copy.

**B. Migrate Meta metrics to Media Views and Media Viewers. High priority. Medium effort.**
Find every place Tawaslo requests `reach`, `impressions`, `video_impressions` or `story_impressions` from the Graph API and switch to `views` and the new Media Viewers fields, keeping the old fields only as a fallback until the cutover completes. Update any dashboard labels that say Reach or Impressions. Effort: one to two days depending on how many analytics surfaces read these fields.

**C. Meter X posting cost or warn on links. Medium priority. Small to medium effort.**
If Tawaslo posts to X, confirm whether the key is now pay per use, and add a small cost note in the composer when X is selected, especially flagging that a link makes the post cost more. If volume is low, this is informational only. Effort: half a day for the warning, more if you add real usage metering.

**D. Add Threads publishing. Medium priority. Medium effort.**
Threads now allows third party publishing through the Meta stack Tawaslo already uses. Add it as a new platform with id `th` next to the existing six in the PLATFORMS list around line 586, wire the publish call, and add its character limit (500) to the `lim` map at line 6925. Effort: two to three days for a basic text and image post path.

**E. Build LinkedIn against version 202605. Medium priority. Folded into existing work.**
Since LinkedIn is awaiting review, make sure the integration parses metricType as a string and uses the register then upload then attach media flow. No extra feature work, just build it right the first time. Effort: none beyond the planned integration.

**F. Quick wins. Low priority. Small effort each.**
* Instagram paid partnership label. Add a toggle in the composer for Instagram that sets the disclosure at publish time. Half a day.
* GBP recurring posts. If Tawaslo has the Google Business connection live, expose RecurrenceInfo so users can set repeating posts. One day. Also surface ReviewReplyState in the reviews view.
* YouTube quota. No code change needed, but the cheaper upload cost means Tawaslo can offer far more daily YouTube and Shorts uploads than before. Worth a marketing note.

---

Reviewed against each platform's developer changelog and recent reputable coverage for the last two weeks. The only items that break or limit a live Tawaslo feature this week are the Instagram hashtag cap and the Meta metric deprecation. The rest are cost notes and opportunities.
