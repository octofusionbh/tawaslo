# Tawaslo — Post-Push Test Checklist

Work top to bottom. Each item says **what to do** and **what "pass" looks like**.
Order matters: #1 first (it catches the scariest regression), then the rest.

---

## 1. Publisher — the critical one (do this first)
The publish flow was rebuilt, so confirm it still works before anything else.

- Go to **Publisher** (or Planner), write a short caption, attach one image.
- Publish to **one** connected account (Instagram or Facebook).
- **Pass:** the post goes live on the real account, no blank screen, no "Unexpected token" error.
- If it fails: note the exact error text and stop — tell Abdulla before testing more.

---

## 2. Team invite + Resend email
Confirms employees can actually be invited.

1. In the app, open **Team / Settings → invite a member**.
2. Invite **your own email** (not an employee yet).
3. **Pass:** you receive a branded "invited you to Tawaslo" email within ~2 min, and the Accept link opens the app.
4. **If no email arrives**, it's Resend setup — check:
   - Vercel → Project → Settings → Environment Variables → `RESEND_API_KEY` exists.
   - Resend dashboard → **Domains** → `tawaslo.com` shows **Verified** (green). If not, add the DNS records Resend shows and wait for verify.
5. Once your self-invite lands → safe to invite the real team.

---

## 3. WhatsApp marketing broadcast (new)
- Open a restaurant client → **WhatsApp → Broadcast** tab.
- **Pass:** recipient count shows a real number (pulled from that client's orders/bookings), estimated cost appears.
- Type an **approved** template name, pick language, hit Send.
- **Pass:** result shows "Sent to X / Y". (Reminder: template must be approved in Meta, recipients must have opted in — otherwise Meta rejects individual sends.)

---

## 4. Menu AI importer (new)
- Open a restaurant client → **Menu → Import menu with AI**.
- Upload a real menu (PDF, photo, or Excel).
- **Pass:** it reads the items, assigns categories/prices, and asks a question in chat if unsure. You can edit before saving.

## 5. Menu → Post (new)
- In the Menu, click the ✨ (wand) on any dish.
- **Pass:** it generates a caption + image and drops you into the Publisher with everything pre-filled.

## 6. Plan a week of posts (new)
- Menu → **Plan a week of posts from menu**.
- **Pass:** up to 7 posts get scheduled, one per day at 20:00.

---

## 7. Instagram tag + location (new)
- New IG post → open the **Tag accounts** and **Location** fields (IG only).
- Add a username and search a location.
- **Pass:** fields accept input, location search returns results. (No re-login required — confirmed.)

## 8. Share to client — two modes (fixed)
- On a client's calendar, open **Share**.
- Test **View only**: open the link → client sees the calendar content (not blank).
- Test **For approval**: link shows posts the client can approve.
- **Pass:** both links load real content, and the word/button "Light" is gone.

---

## 9. Quick visual checks (30 seconds each)
- **Pricing page:** Essential plan reads **"For freelancers & SMEs"**.
- **Client avatars:** social profile photos show again (no broken-image icons).
- **Streams tab:** hidden from the sidebar.
- **HQ (admin.tawaslo.com):** loads clean, no "myRole" error card; Errors / Revenue / Copilot / Team / API Usage all show real data; the Page Visibility panel lists Streams as Hidden.

---

## If anything breaks
Write down: which item #, the exact on-screen error, and which page. That's enough for a fast fix — no need to debug it yourself.

**Nothing here needs SQL.** It's all code that's already in the push.
