# Tawaslo — Meta App Review Submission Pack (Instagram)

Paste-ready use-case descriptions + screencast scripts for each Instagram permission. Each permission is reviewed **separately** and needs **its own screencast** showing the full flow on a real test account the reviewer can reproduce.

**App setup reminders**
- OAuth redirect URI to register: `https://tawaslo.com/api/instagram-oauth`
- Scopes requested at login: `instagram_business_basic, instagram_business_content_publish, instagram_business_manage_comments, instagram_business_manage_messages, instagram_business_manage_insights`
- Before submitting: Business Verification complete, Privacy Policy URL live, Data Deletion URL live, a real IG Business/Creator **test account** with a few posts + comments, and test login credentials added in App Review → Notes.
- Top rejection reason: the reviewer can't reproduce your steps. Narrate every click; keep one video per permission.

---

## 1. instagram_business_basic

**Powers:** reading the connected account's profile and media (the foundation every other feature builds on).

**Use-case description (paste):**
> Tawaslo is a social media management platform for agencies and brands. After a user connects their Instagram Business or Creator account via Instagram Login, this permission is used to read their account profile and existing media so we can display their connected account, show their posts inside Tawaslo, and let them manage their presence. It is used only for accounts the user owns and explicitly connects.

**Screencast script:**
1. Log in to Tawaslo with the test user.
2. Go to **Social Accounts**, click **Connect via Instagram**.
3. Complete the Instagram Login authorization on the test IG account.
4. Show the account now appearing under **Connected accounts** with its name/handle and media count.

---

## 2. instagram_business_content_publish

**Powers:** the Publisher — composing and publishing posts, Reels and carousels.

**Use-case description (paste):**
> Agencies use Tawaslo to create and publish content to their own connected Instagram Business accounts. This permission is used to publish photos, carousels and Reels that the user composes inside our Publisher, either immediately or on a schedule they set. Content is only ever published to the account the user has connected and authorized.

**Screencast script:**
1. In Tawaslo, open **Publisher**, select the connected Instagram account.
2. Upload an image (or multiple for a carousel), write a caption.
3. Click **Publish now**.
4. Switch to the Instagram app/website and show the post now live on the test account.

---

## 3. instagram_business_manage_comments

**Powers:** the Inbox — reading and replying to comments.

**Use-case description (paste):**
> Tawaslo provides a unified Inbox so brands can keep up with engagement. This permission is used to read comments on the connected account's media and to reply to those comments from within Tawaslo, helping the brand respond to its audience in one place. Only the connected, authorized account's comments are accessed.

**Screencast script:**
1. From a second account, leave a comment on one of the test account's posts.
2. In Tawaslo, open **Inbox** — show the comment appearing (with the platform labelled "Instagram").
3. Type a reply in Tawaslo and send it.
4. Show the reply now visible on the post in the Instagram app.

---

## 4. instagram_business_manage_messages

**Powers:** the Inbox — reading and replying to direct messages.

**Use-case description (paste):**
> Tawaslo's Inbox lets brands manage direct messages alongside comments. This permission is used to read incoming Instagram DMs to the connected account and to reply to them from within Tawaslo, so a brand can handle customer conversations in one workspace. Only messages sent to the connected, authorized account are accessed.

**Screencast script:**
1. From a second account, send a DM to the test account.
2. In Tawaslo, open **Inbox**, filter to **DMs** — show the message appearing.
3. Reply to the DM from Tawaslo.
4. Show the reply delivered in the Instagram app.

---

## 5. instagram_business_manage_insights

**Powers:** the Analytics and Reports pages.

**Use-case description (paste):**
> Tawaslo shows brands how their content performs. This permission is used to read insights for the connected account and its media — reach, impressions, engagement and follower metrics — which we present in our Analytics dashboard and monthly reports. Data is shown only to the user for their own connected account.

**Screencast script:**
1. In Tawaslo, open **Analytics** with the connected account selected.
2. Show the metrics loading — reach, impressions, engagement, top posts.
3. Open **Reports** and generate/preview the report built from those insights.

---

## Submission order & tips
1. Submit all five together in one review cycle (cleaner than several).
2. Provide the test login + connected IG test account in App Review → Notes.
3. If one permission is rejected, Meta tells you which and why — fix that one screencast and resubmit; the others stand.
4. Keep each video focused on a single permission, fully reproducible, with narration/captions.

*Source: Meta for Developers — Instagram Platform App Review (developers.facebook.com/docs/instagram-platform/app-review).*
