# Tawaslo Platform Watch, 3 August 2026

Weekly scan of developer changelogs and content publishing docs across every network Tawaslo integrates with or plans to. This note focuses on what moved since the 6 July watch.

## Bottom line

No platform broke a live Tawaslo feature this fortnight. The one real gap is a carryover: the Instagram carousel cap is still hardcoded at 10 in the composer, so the raise to 20 recommended on 6 July was never applied. The Instagram three hashtag story doing the rounds is a limited test on some accounts, not a global rollout, so the current five tag cap in Tawaslo still matches the enforced limit and needs no change. Two WhatsApp cost items are worth a note for the Concierge and InboxAI cost model. Everything else is an opportunity or a network Tawaslo does not integrate yet.

---

## 1. What changed, by platform

**Instagram**
* Hashtag limit stays at a hard five per post or reel, the platform enforced cap since December 2025. Some accounts are seeing a three tag test, but this is an experiment on power users, not a confirmed rollout. Posts above five tags get suppressed distribution. Source: https://www.digitalapplied.com/blog/instagram-limits-hashtags-5-organic-reach-strategy-2026 and the three tag test note at https://www.planoly.com/blog/instagram-is-limiting-hashtags
* Reels camera gained a twenty minute recording length, an undo button for clips, a slider for touch up, and a refreshed green screen. App only, no API action. Source: https://socialbee.com/blog/instagram-updates/
* Users can now drop photos directly into comments on posts and reels. App only. Source: https://napoleoncat.com/blog/instagram-new-features-and-updates/
* Clickable overlay links on reels remain limited to Meta Verified accounts, so still not an API publish feature. Source: https://www.socialmediaexaminer.com/what-clickable-reels-links-and-hashtag-limits-mean-for-your-2026-instagram-strategy/

**Facebook and Meta Graph**
* No new break this fortnight. The reach and impressions retirement in favour of Media Views remains the June 2026 deadline, so confirm that migration landed if it has not already. The metadata=1 query parameter is ignored from v25 and removed as of May 2026. Source: https://developers.facebook.com/docs/graph-api/changelog/version22.0/

**Threads**
* Meta expanded the Threads API with scheduling, ghost posts, GIFs, spoiler tags, text attachments, reply approvals, cross share to Instagram Stories, and real time publish or delete webhooks. This is the same Meta stack Tawaslo already uses. Still not integrated. Source: https://www.socialmediatoday.com/news/meta-updates-threads-api-with-more-third-party-app-integrations/817502/

**WhatsApp Cloud API**
* Meta Business Agent Platform billing started 1 August, priced per token at about two dollars per one million tokens. Source: https://www.ycloud.com/blog/whatsapp-api-message-pricing-update-effective-july-1-2026
* Meta begins charging for service messages and in window utility templates from 1 October 2026, ending the free service messaging that has been free since July 2025. This is the item that touches the Concierge cost model. Source: https://www.ycloud.com/blog/whatsapp-api-message-pricing-update-effective-july-1-2026
* The 1 July rate card stands. Bahrain, Tawaslo's home market, was unchanged. Qatar and several other markets moved to standalone rates. Source: https://www.ycloud.com/blog/whatsapp-api-message-pricing-update-effective-july-1-2026

**TikTok**
* No new change. The developer changelog has published nothing since 4 June. Content Posting API still needs the separate audit before any post can go public. Source: https://developers.tiktok.com/doc/changelog

**LinkedIn**
* Version 202607 is the current Marketing and Community Management version, with 202608 following on the monthly cycle. Send the Linkedin-Version header as YYYYMM and keep it current. Older versions sunset on a one year clock. Source: https://learn.microsoft.com/en-us/linkedin/marketing/versioning

**X**
* No new change. Pay per use remains the default. On 11 July the unverified caps were reconfirmed at fifty original posts and two hundred replies a day, and writes with a link still cost far more. Source: https://postproxy.dev/blog/x-api-pricing-2026/

**YouTube**
* No new change. The cheaper videos.insert cost and its own daily upload bucket of about one hundred calls still stand. Source: https://developers.google.com/youtube/v3/revision_history

**Google Business Profile**
* Review replies now pass through a moderation queue, ReviewReplyState, before publishing, and reviewReplyUrl can now be pulled through the Reviews API. Minor for Tawaslo. Source: https://developers.google.com/my-business/content/latest-updates

**Pinterest (not integrated, future watch)**
* No new break beyond the earlier note. Campaign objectives still must be updated before 1 February 2027. Source: https://developers.pinterest.com/docs/changelog/changelog/

---

## 2. What affects Tawaslo and how

* Instagram carousel cap, carryover. The composer still refuses a tenth image with the message Up to 10 images in a carousel, while Instagram allows up to twenty. This limits a live feature and was flagged on 6 July but is still in the code. This is the one fix to make this week.
* Instagram hashtags. No action. The enforced cap is still five and Tawaslo already sets ig to five. The three tag figure in some July trackers is a test, not a rollout, so do not drop the limit yet. Watch it.
* WhatsApp service message charging from 1 October. This is a real cost change. Any Concierge or InboxAI flow that relied on free service messages will start to cost from 1 October. Bahrain marketing and utility pricing is unchanged, but the free service window is closing for everyone.
* WhatsApp Meta Business Agent billing from 1 August. Not a break. Meta now sells the same auto reply value InboxAI offers, priced per token. Competitive signal and a possible backend option.
* Threads API expansion. Opportunity, not a break. Scheduling, ghost posts, GIFs, and cross share to Instagram Stories are now available through the Meta stack Tawaslo already uses, so a Threads publish path is lower effort than before.
* Meta Media Views migration. Carryover. If the switch from reach and impressions to Media Views is not already in, old metric fields may now return empty.

---

## 3. Recommendations, with rough effort

**A. Raise the Instagram carousel cap to twenty. High priority. Very small effort.**
Still open from 6 July. In `src/TawasaloApp.js` at line 7156 the guard reads `if (isImage && images.length >= 10) { setMediaWarning('Up to 10 images in a carousel.'); break; }`. Change `>= 10` to `>= 20` and update the warning text to twenty, including the Arabic copy nearby. Confirm `api/meta-publish.js` does not impose its own cap on the carousel children loop. About fifteen to thirty minutes.

**B. Leave the Instagram hashtag cap at five. No action now. Watch only.**
`MAXTAG` in `src/TawasaloApp.js` at line 10408 already sets ig to five, which matches the enforced limit. Do not change it to three while three is only a test. If Instagram confirms three globally, this becomes a one character edit at that same line. No work this week beyond noting it.

**C. Plan for WhatsApp service message charging on 1 October. Medium priority. Small to medium effort.**
Review any Concierge or InboxAI flow that sends service messages or in window utility templates and confirm which will start to bill from 1 October. Update any cost figures shown to clients, and consider steering low value auto replies inside the free entry point window where possible. Roughly half a day to audit, more if pricing copy needs changes.

**D. Note the Threads API expansion as a build opportunity. Low priority. No code now.**
The new scheduling, ghost post, and cross share features run on the Meta stack Tawaslo already uses, so a Threads publish lane is now cheaper to add. Add it to the roadmap and size it when a slot opens.

**E. Keep LinkedIn on the current monthly version header. Folded into existing work.**
When the LinkedIn integration ships, send Linkedin-Version as the current month, 202607 now and 202608 next. No extra work beyond the planned build.

**F. Confirm the Meta Media Views migration landed. Carryover. Medium effort if not done.**
The reach and impressions retirement deadline was June 2026. If the switch to Media Views is not in, prioritise it since old metric fields may now return empty. One to two days if still pending.

---

Reviewed against each platform's developer changelog and recent reputable coverage for roughly the last two weeks. The only item that limits a live Tawaslo feature is the carousel cap, and that fix is still sitting in the code from two weeks ago. The rest are cost notes, opportunities, or networks not yet integrated.
