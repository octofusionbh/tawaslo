# Tawaslo — Today's testing & to-do

_Prepared for the office session. Work top to bottom._

## 0. Do these first (deploy the latest)
- [ ] Supabase → SQL Editor → run:
  `alter table public.menus add column if not exists booking_enabled boolean default true;`
- [ ] Drag the 3 new icon files into `C:\dev\tawaslo\public\` (replace the React ones): `logo192.png`, `logo512.png`, `favicon.ico`
- [ ] Run `fix_and_push.bat`
- [ ] Open the app and hard-refresh (Ctrl+Shift+R)

## 1. New features to test (built this week)
- [ ] **Add client** — add a client, pick a Business type, confirm it saves and appears (this was silently failing before).
- [ ] **Approval link** — schedule posts → Send for approval → Share to client → open the `/a/...` link in a private window and confirm it shows the real calendar/posts (not an empty one).
- [ ] **QR poster** — Menu → Download poster → confirm it auto-saves a PNG (no print dialog), with the client's logo on top AND in the QR centre, "Powered by Tawaslo" in the footer.
- [ ] **Share dropdown** — Menu → Share → Copy link and Share to WhatsApp both work.
- [ ] **Tablet link** — Menu → Tablet link → open it (`/menu/<slug>?display=1`) → same menu, NO chat/book widget.
- [ ] **Reservations toggle** — turn "Takes reservations" OFF for a client → open its menu → chat button says "Chat with us" and offers no booking. Turn ON → "Chat & Book" returns.
- [ ] **Concierge respects booking** — with booking OFF, ask the web widget (and WhatsApp) to "book a table" → it should decline politely and offer the menu instead.
- [ ] **Logo everywhere** — browser tab icon, install/PWA icon, and menu logo all show the real Tawaslo/client logo (no React atom).
- [ ] **No white screen** — if any page errors it now shows a recoverable card with a Reload button, never a blank screen.

## 2. Instagram Story bug (salomigrills)
_Symptom: "Media ID is not available", or the Story posts as a feed post._
- Fix applied: Story containers now wait until Instagram finishes processing before publishing (the early-publish race caused "Media ID is not available").
- [ ] Post an **image** Story on salomigrills → confirm it lands as a **Story**, no error.
- [ ] Post a **video** Story → confirm it lands as a Story.
- [ ] If it STILL posts to feed or errors, note: does the account's access token start with `IGAA`/`IGQ` (Instagram Login) or is it a Facebook-Page token? Image Stories via API can behave differently by account type — we'll branch on it. Capture the exact error text.

## 3. Pending queue (tackle after testing)
- [ ] Real team invites — email + DB + accept + access
- [ ] Settings page saves to Supabase
- [ ] Account selector in Inbox & Analytics
- [ ] Fix IG account showing "Instagram" instead of @username
- [ ] Instagram hashtag cap (5) + counter
- [ ] Migrate analytics to Media Views metrics
- [ ] Wire up the email templates we created
- [ ] Set up support@tawaslo.com mailbox
- [ ] Fix broken dashboard buttons
- [ ] WhatsApp API follow-up fixes
