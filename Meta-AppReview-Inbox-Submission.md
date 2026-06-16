# Tawaslo — Meta App Review Submission (Inbox + Analytics)

App: **Tawaslo** · App ID **1652475822681144**
Submit ALL THREE together, attach the SAME combined video to each:
- **`instagram_business_manage_comments`** (Inbox – comments)
- **`instagram_business_manage_messages`** (Inbox – DMs)
- **`instagram_business_manage_insights`** (real Analytics & Reports)

> One combined screencast covers all three: connect → Inbox (comments + DMs + reply) → Analytics + Reports.

---

## 0. The recording question — how do we record with no live data?

You record **two things**, and that's enough:

1. **The real part** — logging in, connecting an Instagram professional account, and the **permission consent screen** (this is real and is what Meta most wants to see).
2. **The feature flow** — open the Inbox and click **"Preview with sample data."** This fills the Inbox with example comments and DMs so you can demonstrate viewing, filtering, and replying. Narrate clearly that this is how the agency reads and replies to their clients' Instagram comments and DMs.

Meta's reviewer then tests the *live* functionality themselves with their own test account after they grant the permission. They do **not** expect approved-only real data in your screencast. This is the standard way social tools pass review.

---

## 1. Permission usage descriptions (paste into the "How will your app use this permission?" field)

### instagram_business_manage_comments
Tawaslo is a social media management platform for agencies and brands. Agencies connect their clients' Instagram professional accounts and use Tawaslo's unified Inbox to read and respond to the comments their audience leaves on the client's posts.

We use `instagram_business_manage_comments` to:
1. Display incoming comments on connected accounts' media inside a single unified Inbox, so an agency managing many clients can see all comments in one place.
2. Let the agency reply to those comments directly from Tawaslo (posted back to Instagram on the connected account's behalf).

Comments are fetched only for Instagram professional accounts the user explicitly connects via Instagram Login, and are shown only to that workspace's authorized team members. We do not store comment content beyond what is needed to display and reply within the session.

### instagram_business_manage_messages
Tawaslo's unified Inbox also lets agencies read and reply to Instagram Direct Messages sent to their connected clients' professional accounts.

We use `instagram_business_manage_messages` to:
1. Display incoming DM conversations in the unified Inbox.
2. Send replies on behalf of the connected account, so agencies can manage all client conversations from one place.

We respect Instagram's messaging policies and the 24‑hour messaging window, and only access conversations for accounts the user connects. Messages are shown only to authorized team members in that workspace.

### instagram_business_manage_insights
Tawaslo shows agencies analytics for their connected clients' Instagram professional accounts — reach, impressions, engagement and follower trends — in the Analytics and Reports sections. We use `instagram_business_manage_insights` to retrieve this metadata for accounts the user connects, and present it as dashboards and exportable client reports.

We use `instagram_business_manage_insights` to:
1. Display account- and post-level metrics (reach, impressions, engagement, follower growth) on the Analytics dashboard.
2. Generate exportable PDF client reports from that same metadata.

Insights are retrieved only for Instagram professional accounts the user explicitly connects, and shown only to authorized team members in that workspace.

---

## 2. Screencast script (record in English, ~2–3 minutes)

Record at a clean 1280×720+ resolution. Speak as you click.

1. **Intro (5s):** "This is Tawaslo, a social media management platform for agencies. I'll show how we use Instagram comments and messages permissions."
2. **Log in:** Go to tawaslo.com → Log In → sign in to the agency workspace.
3. **Connect Instagram (the real grant — do NOT skip):** Sidebar → **Social Accounts** → click **Connect** on Instagram → the Instagram/Facebook **login and permission consent screen appears**. Say: "The agency connects their client's Instagram professional account and grants permission to manage comments and messages." Approve, and show the account now connected.
4. **Open the Inbox:** Sidebar → **Inbox**. Say: "All of the connected client's comments and DMs come into one unified inbox."
5. **Show the data (sample preview):** Click **"Preview with sample data."** Then:
   - Click the **Comments** tab — say: "Here are comments left on the client's posts. The agency can reply to each one directly."
   - Click a comment → show the **reply box** and the **Brand voice** AI reply suggestion → type/insert a reply. Say: "We post this reply back to Instagram using `instagram_business_manage_comments`."
   - Click the **DMs** tab — say: "Direct messages from the audience appear here, and the agency replies from Tawaslo using `instagram_business_manage_messages`."
6. **Analytics (insights permission — do NOT skip):** Sidebar → **Analytics**. Say: "Tawaslo pulls the connected account's Instagram insights — reach, impressions, engagement and follower trends — using `instagram_business_manage_insights`." Scroll through the metric cards and charts. (If live data isn't approved yet, click **Preview with sample data** so the dashboard populates, and narrate that this is how real account insights are displayed.)
7. **Reports:** Sidebar → **Reports** → open/generate a report and show the **Export PDF** button. Say: "The same insights become an exportable client report."
8. **Close (5s):** "This lets agencies manage every client's Instagram comments, messages and analytics from one place — that's our use of these three permissions."

---

## 3. Reviewer test instructions (paste into the "Instructions for reviewers" field)

Provide Meta a working test login + steps:

1. Go to **https://www.tawaslo.com** and click **Log In**.
   - Test email: `__________`  (create a test account for the reviewer)
   - Test password: `__________`
2. In the sidebar, open **Social Accounts** and click **Connect** on **Instagram**. Log in with an Instagram **professional (Business or Creator)** account and grant all requested permissions.
3. Open **Inbox** in the sidebar. Connected account's comments and DMs load here.
4. Click a comment to reply (uses `instagram_business_manage_comments`); open the **DMs** tab to view/reply to messages (uses `instagram_business_manage_messages`).
5. Note: a connected Instagram **professional** account is required (personal accounts are not supported by the Instagram API).

---

## 4. Before / alongside submitting — checklist

- [ ] `instagram_business_manage_comments` → **Add to App Review**
- [ ] `instagram_business_manage_messages` → **Add to App Review**
- [ ] `instagram_business_manage_insights` → **Add to App Review**
- [ ] Fill the **three** usage descriptions (section 1) in **Review → Requests**.
- [ ] Upload the **one combined** screencast (section 2 — inbox + analytics) and attach it to all three.
- [ ] Add reviewer test login + steps (section 3).
- [ ] Submit all three together.
- [ ] After approval, switch the app from **Development → Live**.

> The "Add to App Review" button is greyed out until the **June 7 submission** (basic + content publish) finishes reviewing. The moment it clears, add all three above in one submission.

> Note: real comments and DMs will only appear in the Inbox **after** Meta approves these permissions (Advanced Access). Nothing else needs changing in Tawaslo — the Inbox is already wired for it.
