# Tawaslo Platform Watch — 6 July 2026

Weekly scan of developer changelogs and content publishing docs across every network Tawaslo integrates with or plans to. This note focuses on what is new since the 29 June watch, so items already actioned last week are only flagged if their status moved.

## Bottom line

Two items this week actually touch a live Tawaslo feature. Instagram raised the carousel cap from 10 to 20 frames, and the Tawaslo composer still hardcodes 10, so users cannot use the extra slides. Everything else is a cost note, a future opportunity, or a network Tawaslo does not integrate yet. Last week's Instagram hashtag cap fix is confirmed live in the code (MAXTAG ig:5), so that one is closed.

---

## 1. What changed, by platform

**Instagram**
* Carousels now allow up to 20 photos or videos per post, double the old limit of 10. Source: https://embedsocial.com/blog/new-instagram-features-2026/
* You can reorder carousel slides after a post is live by long pressing and dragging. This is an app only change, no API action. Source: https://socialbee.com/blog/instagram-updates/
* Insights added new data points, share rate, skip rate, and views over time, plus a tabbed layout and swipe between reels to compare. Source: https://napoleoncat.com/blog/instagram-new-features-and-updates/
* Reels can now carry a clickable overlay link, but only for Meta Verified accounts or via the Edits app export, so it is not an API publish feature. Source: https://www.socialmediaexaminer.com/what-clickable-reels-links-and-hashtag-limits-mean-for-your-2026-instagram-strategy/

**Facebook and Meta Graph**
* No new breaking change this week. The legacy reach and impressions retirement in favour of Media Views is still the June 2026 deadline flagged last week. Source: https://developers.facebook.com/docs/instagram-platform/changelog

**Threads**
* Instagram now counts Threads replies and shows likes on cross posted content inside the Instagram app. Minor, no API action. Source: https://embedsocial.com/blog/new-threads-features-2026/
* Third party publishing is still open through the Meta stack Tawaslo already uses. Still not integrated. Source: https://developers.facebook.com/blog/post/2026/04/14/whats-new-in-the-threads-api/

**WhatsApp Cloud API**
* The 1 July 2026 rate card is now in effect. Bahrain, Tawaslo's home market, stays inside the Rest of Middle East regional pricing and did not change. Qatar moved to standalone pricing, and several other markets were moved out of their regional buckets to standalone rates. Source: https://www.ycloud.com/blog/whatsapp-api-message-pricing-update-effective-july-1-2026
* Meta launched its own Business Agent Platform on 1 July, an AI that answers WhatsApp users automatically, priced per token at about 4 to 5 cents per typical message, with billing starting 1 August. Source: https://help.aliyun.com/en/chatapp/whatsapp-messaging-fee-update-on-july-1-2026

**TikTok**
* No new breaking change this week. Content Posting API still requires the separate audit before any post can be public, as noted before. Source: https://developers.tiktok.com/doc/changelog

**LinkedIn**
* Version 202606 is now the current Marketing and Community Management version. Older versions keep sunsetting on the one year cycle. Build against 202606. Source: https://learn.microsoft.com/en-us/linkedin/marketing/versioning

**X**
* No new change this week. Pay per use remains the default since February, writes with a link cost far more, and unverified accounts are capped near 50 original posts a day. Source: https://postproxy.dev/blog/x-api-pricing-2026/

**YouTube**
* No new change this week. The cheaper videos.insert cost and the dedicated daily upload bucket from earlier this year still stand. Source: https://www.socialcrawl.dev/blog/youtube-data-api-2026

**Google Business Profile**
* No new change this week. Recurring posts via RecurrenceInfo and review reply status remain available. Source: https://developers.google.com/my-business/content/latest-updates

**Pinterest (not integrated, future watch)**
* The note property was removed from pin create and read. New creative_type values were added, including COLLAGE. Board response schema was refactored and campaign objectives must be updated before 1 February 2027. Source: https://developers.pinterest.com/docs/changelog/changelog/

---

## 2. What affects Tawaslo and how

* Instagram carousel cap. This limits a live feature. The composer refuses a tenth image and shows the message Up to 10 images in a carousel. Users on Instagram can now post up to 20, so Tawaslo is leaving value on the table and looks behind. This is the one item to fix this week.
* WhatsApp pricing. Bahrain is unchanged, so Tawaslo Concierge cost is steady. Only matters if Tawaslo expands into Qatar or the other markets that moved to standalone rates, in which case the pricing shown to those clients should be rechecked against the 1 July card.
* Meta Business Agent Platform. Not a break, but a signal. Meta now sells the same auto reply value Tawaslo InboxAI offers on WhatsApp, priced per token. Worth watching as competition and as a possible backend option.
* Instagram Insights new metrics. An opportunity, not a break. Share rate, skip rate, and views over time are new fields Tawaslo analytics could surface.
* Everything else. No live Tawaslo feature is broken or limited by the other platforms this week.

---

## 3. Recommendations, with rough effort

**A. Raise the Instagram carousel cap to 20. High priority. Very small effort.**
One spot to change. In `src/TawasaloApp.js` at line 6517 the guard reads:

`if (isImage && images.length >= 10) { setMediaWarning('Up to 10 images in a carousel.'); break; }`

Change `>= 10` to `>= 20` and update the warning text to say 20, including the Arabic copy nearby. Confirm the publish path in `api/meta-publish.js` does not impose its own 10 cap. About 15 to 30 minutes.

**B. Recheck Gulf expansion pricing against the 1 July card. Low priority unless expanding. Small effort.**
If Tawaslo quotes WhatsApp cost for Qatar or any market that just moved to standalone rates, update those figures from the 1 July 2026 rate card. No change needed for Bahrain. Under half a day.

**C. Note the Meta Business Agent Platform. Low priority. No code.**
Add it to the competitive watch. It answers WhatsApp users per token from 1 August. Decide later whether to position InboxAI against it or use it as an option. No build work now.

**D. Surface new Instagram Insights metrics. Low priority. Small effort.**
When convenient, add share rate, skip rate, and views over time to the analytics view where reel and post insights are read. Roughly half a day per surface.

**E. Keep LinkedIn on version 202606. Folded into existing work.**
When the LinkedIn integration ships, set the version header to 202606. No extra work beyond the planned build.

**F. Confirm the Meta Media Views migration landed. Carryover from last week. Medium effort if not done.**
The reach and impressions retirement deadline is June 2026. If the switch to Media Views and Media Viewers is not already in, prioritise it, since old metric fields may now return empty. One to two days if still pending.

---

Reviewed against each platform's developer changelog and recent reputable coverage for roughly the last two weeks. The only item that limits a live Tawaslo feature this week is the Instagram carousel cap. The rest are cost notes, opportunities, or networks not yet integrated.
