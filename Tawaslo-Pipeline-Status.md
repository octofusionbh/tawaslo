# Tawaslo pipeline status (as of 9 July 2026)

A single view of what is done, what is left to build, and what is waiting on other companies. Pulled from the older sessions (website5, website6, the parked items sweep) plus this week's work.

## 1. Shipped this week (deployed, just needs testing)
- Add client fix (it was silently failing before)
- Approval "Share to client" link now loads the real posts, not an empty calendar
- Menu QR poster with one click PNG download (client logo on top and in the QR centre, "Powered by Tawaslo" footer)
- Menu Share dropdown (copy link, share to WhatsApp)
- Tablet display link (menu only, no chat or book) for in house tablets
- Reservations toggle (Chat and Book vs Chat with us), and the concierge respects it on both web and WhatsApp
- Real logo everywhere (tab icon, install icon, favicon)
- Instagram Story publish fix (waits for the media to finish, which stops the "Media ID is not available" error)
- White screen safety net so a page crash shows a recoverable card, never a blank screen
- Test guide saved as TODAY-TESTING-CHECKLIST.md

## 2. Safety critical before any wider launch
- Remove the hardcoded mock sidebar clients (Bloom Agency, Gulf Motors, Zara Bahrain) and load real clients from the database
- Strip the debug console logs from the inbox and the TikTok diagnostic code
- Re enable proper row level security on the clients and social_accounts tables

## 3. Core build queue
- Settings page saves to Supabase
- Account selector in Inbox and Analytics
- Real team invites (email, database record, accept flow, access control)
- Fix the Instagram account showing "Instagram" instead of the real @username
- Instagram hashtag cap of five with a live counter
- Move analytics onto the Media Views metric (Meta retired the older ones)
- Wire the email templates we built (welcome, invite) so they actually send
- Set up the support@tawaslo.com mailbox
- Fix the broken dashboard buttons
- WhatsApp API follow up fixes

## 4. Bigger builds (parked, your call to activate)
- Super admin owner dashboard: a private tawaslo.com/admin view of every subscriber, with three clean roles (Super Admin, Agency, Brand)
- URL routing per page (/inbox, /analytics, /reports) so pages are shareable and the back button works
- Carousel and multi image posting: the groundwork is in the publish API, the composer still needs wiring and testing

## 5. Waiting on other companies (status checks only, nothing for us to build)
- Instagram (Meta) review: all five permissions were submitted with the screencast, now in review. When approved, the fuller IG suite unlocks.
- TikTok app review: once approved, swap the sandbox keys to production and flip posts to public
- LinkedIn Pages API: waiting on the Microsoft vetting email and the Octo Fusion CR
- WhatsApp: phone number plus business verification plus the env vars, then the concierge answers on WhatsApp live

## 6. Test first thing tomorrow
- Everything in section 1 (see TODAY-TESTING-CHECKLIST.md)
- Instagram Story on salomigrills, to confirm the Media ID fix
- The reservation bot preview, and the guest booking link plus the host stand link (both on the Reservations page)
