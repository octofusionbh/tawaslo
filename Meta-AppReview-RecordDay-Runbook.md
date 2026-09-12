# Meta App Review — Record Day Runbook (Inbox + Ads together)

Goal: record ONE session, submit **5 permissions** in two groups, using **Octo Fusion's own** IG + FB accounts (they have an app role, so everything works in development mode — no client tester invite needed).

Submitting:
- **Inbox group** → `instagram_business_manage_comments`, `instagram_business_manage_messages`, `instagram_business_manage_insights` — see `Meta-AppReview-Inbox-Submission.md`
- **Ads group** → `ads_read`, `ads_management` — see `Meta-AppReview-Ads-Submission.md`

---

## STEP 0 — Prerequisites (before recording)

**A. Get the Inbox rejection reason.** Inbox was submitted once and rejected. Meta rejects identical resubmissions. Find it in **App Dashboard → App Review → Requests** (or the alert email) and paste it to Claude — we fix the screencast/instructions before resubmitting.

**B. Complete Business Verification** (Business Settings → Security Center). Required for `ads_management`.

**C. Two env vars in Vercel, then redeploy:**
- `REACT_APP_IG_INBOX=1` → Instagram connect requests comments + DMs scopes
- `REACT_APP_META_ADS=1` → Facebook connect requests `ads_read` + `ads_management`
- Leave `ADS_LIVE` **unset** (boost stays in safe test mode).

**D. One code line (Claude applies when integrating Codex's design pass — do NOT edit the file while Codex has it):**
In `connectMeta`, add the ads scopes so the flag in C actually has something to switch on:
```js
const adsScope = ["ads_read", "ads_management"];
const scope = [
  ...baseScope,
  ...(process.env.REACT_APP_META_IG === '1' ? igScope : []),
  ...(process.env.REACT_APP_META_ADS === '1' ? adsScope : []),
].join(",");
```

**E. Reconnect Octo Fusion's accounts** AFTER C+D are deployed, so the fresh tokens carry the new scopes:
- Instagram → reconnect (consent screen should now list comments + DMs)
- Facebook → reconnect (consent screen should now list ads_read + ads_management)

**F. Sanity check the features work for octofusion:**
- Inbox → opens, shows comments/DMs (or "Preview with sample data")
- Ads → Performance tab pulls the ad account; Boost opens

---

## STEP 1 — Record (one screen recording, ~4–5 min, 1280×720+, English, narrate as you click)

1. Intro: "Tawaslo, a social media management platform for agencies."
2. **Log in** to the agency workspace.
3. **Connect Instagram** → show the **consent screen** listing comments + DMs + insights → approve.
4. **Connect Facebook** → show the **consent screen** listing ads_read + ads_management → approve.
5. **Inbox:** view comments, reply to one; view a DM, reply (or "Preview with sample data"). Narrate the agency use case.
6. **Analytics/Reports:** show reach/engagement + an exported report (covers `manage_insights`).
7. **Ads → Performance:** campaigns + per-ad table + Export CSV (covers `ads_read`).
8. **Ads → Boost** a post: objective, budget, audience, create (paused). (covers `ads_management`).
9. Close: "All data is only accessed for accounts the user connects, shown only to authorized team members."

Save the file once; the same video attaches to all five permissions.

---

## STEP 2 — Submit in the App Dashboard

For each permission, paste the matching **usage description** + **reviewer instructions** from the two pack files, attach the video, and provide the **reviewer test login** (an agency workspace with IG + FB + ad account already connected).

- Inbox descriptions + script → `Meta-AppReview-Inbox-Submission.md`
- Ads descriptions + instructions → `Meta-AppReview-Ads-Submission.md`

Submit both groups. Then paste any follow-up questions Meta sends back here and Claude will draft the responses.

---

## Quick checklist

- [ ] Inbox rejection reason retrieved + fixed
- [ ] Business Verification complete
- [ ] `REACT_APP_IG_INBOX=1`, `REACT_APP_META_ADS=1` set + redeployed
- [ ] ads-scope code line merged (with Codex's design pass)
- [ ] Octo Fusion IG + FB reconnected (new scopes on the token)
- [ ] Inbox + Ads verified working for octofusion
- [ ] Screencast recorded
- [ ] 5 permissions submitted with descriptions + instructions + video + test login
