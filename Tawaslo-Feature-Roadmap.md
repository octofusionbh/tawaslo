# Tawaslo — Feature Roadmap (vs Hootsuite, Buffer, Sprout, Later, Metricool, Publer, SocialBee, Vista Social)

> Goal: match every major competitor feature, then pull ahead with a bilingual EN+AR / GCC moat no global tool has.
> Legend: **FE** = frontend-only (no new platform-API approval needed) · **API** = needs platform access/approval.

## Already shipped (parity achieved)
Multi-account publishing (IG/FB; TikTok/LinkedIn/X in progress) · composer (feed/reel/story, carousels, per-slide alt text) · bilingual AI captions + brand voice · AI image studio · planner with bulk + recurring scheduling · one-click AI month plan · analytics + branded PDF reports + hosted report links · unified inbox (comments + DMs) with AI reply assistant · engagement logging + reports · client approval workflow · campaigns · Meta ads · listening/trending · media library · clients/team with roles · repost-to-Story · billing + trial lifecycle.

---

## Tier 1 — quick, high-leverage, frontend-only (build first)
1. **Saved hashtag groups** — reusable hashtag sets inserted into the composer. (FE, Low)
2. **First-comment scheduling** — auto-post hashtags/links as the first comment after publish. (rides existing IG/FB API, Low)
3. **Best-time-to-post** — recommended optimal slots from the account's own analytics. (FE, Med)
4. **AI strategy generator** — brief → full content strategy (pillars, cadence, themes); extends the month-plan. (FE, Low–Med)
5. **Link-in-bio page** — hosted bio mini-page per client with link blocks + latest posts + click tracking; reuses the `/r/token` hosting pattern. (FE, Low–Med)

## Tier 2 — differentiators + strong FE features
6. **Hijri / GCC calendar engine** — schedule & auto-plan around Ramadan, Eid, National Days; prayer-time-aware best-time. *(moat — no competitor has this)*
7. **Arabic dialect tone + hashtag intelligence** — Gulf / Egyptian / MSA / Levantine tone control + Arabic hashtag suggestions. *(moat)*
8. **AI sentiment + crisis radar** — EN+AR sentiment on inbox/mentions, alert before a thread escalates. *(moat, extends inbox AI)*
9. **Evergreen recycling / content categories** — auto-requeue top posts on recurring slots. (FE, Med)
10. **UTM builder + link shortener/tracking** and **auto-watermark on publish**. (FE, Low)

## Tier 3 — valuable, heavier or API-gated
11. RSS / blog auto-import → drafts. (FE)
12. Inbox saved replies + automation rules / auto-responders. (FE)
13. New networks after TikTok/LI/X: YouTube, Pinterest, Google Business, Threads. (API each)
14. Review management (Google Business Profile first). (API)
15. Canva integration in composer. (API)
16. **Agency client portal** — branded client login: calendar, analytics, approvals, digests in EN/AR. *(differentiator, builds on approvals)*

## Tier 4 — defer (high cost / strategic)
Competitor benchmarking · employee advocacy · influencer/UGC discovery · in-app video editor · mobile app · browser extension.

---

### Build approach
One feature at a time, each parse-verified before the next. Frontend-only items ship without waiting on any platform approval. API-gated items queue behind the relevant platform access.
