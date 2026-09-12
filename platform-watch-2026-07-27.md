# Tawaslo Platform Watch — Week of 27 July 2026

Quiet week overall. No platform shipped a breaking change to core posting endpoints in the last two weeks. Four items are worth acting on (WhatsApp pricing, LinkedIn analytics parsing, X account caps, YouTube search quota), plus one myth to actively ignore (the Instagram "5 hashtag cap"). Details below.

## 1. What changed, by platform

**WhatsApp Cloud API**
Per message pricing shifted effective 1 July 2026 (local WABA timezone). Marketing rates rose in Saudi Arabia, UK, Italy, Spain. Utility and authentication rates rose in Hong Kong (more than doubled, 0.0140 to 0.0312), Singapore, Qatar, Hungary, Romania. Poland dropped across categories. The 24 hour free service window and the 72 hour Click to WhatsApp ad window are unchanged. Cost change only, no endpoint change.
Source: https://www.ycloud.com/blog/whatsapp-api-message-pricing-update-effective-july-1-2026

**LinkedIn Marketing API (version 202607)**
Member Post and Video Statistics: the `metricType` field changed from an object to a string in the response body. This is a response shape change that can break any analytics parser. It landed in version 202605 and carries into 202607.
Also: `Linkedin-Version` header remains mandatory and non defaulting. A missing or stale header is rejected outright. Current value is 202607.
Minor additive change: `OPTIMIZED` is now accepted as `creativeSelection` for Sponsored InMail lead generation campaigns.
Source: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-07

**X / Twitter**
No new API change in the window. One policy item was reaffirmed on 11 July 2026: unverified (non Premium) accounts are capped at 50 original posts and 200 replies per day. This is a hard account level ceiling that applies regardless of your API tier, so it silently throttles any connected customer account that is not Premium.
Source: https://help.x.com/en/rules-and-policies/x-limits

**YouTube Data API v3**
No July dated entry. The relevant recent change is the granular quota rollout that began 1 June 2026: `videos.insert` cost dropped sharply (good for uploads), but `search.list` moved into its own dedicated daily bucket, effectively about 100 search calls per day. Search heavy features can hit this ceiling.
Source: https://developers.google.com/youtube/v3/revision_history

**Pinterest API**
One additive July entry: age bucket and gender targeting columns added to the account analytics report (`AGE_BUCKET`, `GENDER`). Non breaking.
Forward looking: Pinterest Developer Guidelines update takes effect 18 August 2026. Preview is live now. Worth reading before it lands.
Source: https://developers.pinterest.com/docs/changelog/changelog/ and https://policy.pinterest.com/en/developer-guidelines

**Google Business Profile API**
Nothing new dated in the July window. The current relevant context is the Reviews API `ReviewReplyState`, live since April 2026, which exposes policy violation reasons when a review reply is rejected. Any auto reply flow should handle a rejected reply rather than assume success.
Source: https://developers.google.com/my-business/content/latest-updates

**Instagram, Facebook Pages, Threads**
Nothing material in the window per the official changelogs. Latest Instagram entry is 1 June 2026 (Audio API for Reels). Latest Threads entry is 21 April 2026. No hashtag, publishing, or permission change.
Source: https://developers.facebook.com/docs/instagram-platform/changelog

**Snapchat, TikTok, Meta Ads, Google Ads**
No developer facing changes in the window. TikTok changelog is unchanged since 4 June. Snapchat Ads API unchanged since April. TikTok Ads product news (Growth Max, Smart+ tiers) is Ads Manager UI only, not an API break.

## 2. What affects Tawaslo

**WhatsApp pricing (high relevance).** Tawaslo is Bahrain based with GCC clients. Saudi Arabia marketing and Qatar utility rates both rose, so any Concierge or template messaging you bill through or pass to clients now costs more in those markets. This changes margin, not function.

**LinkedIn `metricType` change (breaks parsing if unhandled).** If Tawaslo pulls LinkedIn post or video stats, a parser that expects an object will fail on the new string format. Also confirm the app always sends `Linkedin-Version: 202607`.

**X account caps (limits a feature, needs a user warning).** Any client whose connected X account is not Premium is capped at 50 posts and 200 replies per day. Bulk scheduling to a free account will silently fail past that ceiling.

**YouTube search quota (limits search heavy features).** If Tawaslo uses `search.list` for anything (finding videos, channel lookups), you now have roughly 100 calls per day. Heavy use will exhaust it.

**GBP review replies (edge case handling).** If Tawaslo auto replies to reviews, handle the rejected state so a blocked reply does not look sent.

**Instagram "5 hashtag cap" is a myth.** Many blogs claim Instagram now caps posts at 5 hashtags. The official changelog has no such entry and enforces no such API limit. Do not build a hard 5 hashtag limit into the composer based on this. A soft advisory hint is fine, a hard cap is wrong.

## 3. Recommendations and effort

**WhatsApp pricing.** Update the internal WhatsApp cost table for Saudi Arabia, Qatar, UK, Hong Kong, Singapore and any market you resell in, then re check client margin. If billing config lives in a rates file or admin table, edit the per country values there. Effort: small, config and pricing review, about half a day.

**LinkedIn analytics parser.** Make the `metricType` reader accept both a string and an object so old and new payloads both parse. Pin the outgoing `Linkedin-Version` header to 202607. Effort: small, one parser function plus a header constant, about half a day with a test.

**X posting cap warning.** In the scheduler, when a connected X account is not Premium, show an advisory near bulk scheduling that free accounts are capped at 50 posts and 200 replies per day, and queue or throttle past that instead of failing hard. Quick win is the advisory copy near the X connect state and the compose queue. Effort: small for the warning, medium if you add real throttle logic, roughly one to two days.

**YouTube search quota.** Audit where Tawaslo calls `search.list`. Cache results, prefer direct id lookups over search where possible, and add a friendly quota message. Effort: medium, depends on how many features use search, about one to two days.

**GBP review reply state.** Handle the rejected reply state in the auto reply flow and surface the reason to the user. Effort: small, one status branch, about half a day.

**Pinterest guidelines (calendar item, not code).** Read the preview of the new Developer Guidelines before 18 August 2026 and confirm Tawaslo stays compliant. Effort: reading only, about one hour. Worth a reminder next week.

**Instagram hashtag hint.** If a hard 5 hashtag cap was already added or planned, remove it. Keep at most a soft suggestion. Effort: trivial if it exists, the value to change is the hashtag limit constant in the composer.

Nothing else this week requires code changes.
