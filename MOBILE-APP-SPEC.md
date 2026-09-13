# Tawaslo — Mobile App

**Goal:** ship Tawaslo to the App Store and Play Store as a product feature, for every Tawaslo user (agencies, brands, freelancers) — not as an internal tool.

**Status:** planned. Nothing built.

---

## Approach: Capacitor, not a rewrite

The app is already React. Capacitor packages the existing web build inside a real native shell, so there is **one codebase**. Every fix pushed to the web ships to the app too.

| Path | What it is | Effort | Store? |
|---|---|---|---|
| PWA | Installs to the home screen from the browser | days | No |
| **Capacitor** | Same React code in a native shell | weeks | **Yes** |
| React Native rewrite | Build it all again | months | Yes |

**The catch:** Apple rejects apps that are only a website in a wrapper (Guideline 4.2, minimum functionality). It needs genuine native behaviour to pass review — which is the same work that makes the app worth having:

- **Push notifications** — a comment lands, a post needs approval, a connection dies
- **Camera / photo library** — shoot and upload on site
- **Share sheet** — share an image from another app straight into Tawaslo
- **Biometric login** — Face ID / fingerprint

---

## Scope by screen size, not by device

**Tablet — the full app.** Everything the desktop has. No reduced nav.

**Phone — a focused set.** The things you do away from a desk, plus account admin.

| Phone | Why |
|---|---|
| Inbox | Reply to comments and DMs anywhere |
| Approvals | Approve on the go |
| Calendar | See what is going out today |
| Quick post | Camera → caption → schedule |
| Notifications | The reason a phone app exists |
| Dashboard (light) | The numbers only |
| Analytics | Read-only |
| Billing, Settings, Team | Account admin |

| Phone excludes | Why |
|---|---|
| Publisher, AI Studio, Reel Studio | Real composing needs a big screen |
| Campaigns, Ads, Reports | Dense planning work |
| Media library | Bulk work |

The app already has this mechanism — `DESKTOP_ONLY` in `TawasaloApp.js`, currently just `publisher`. This extends it, split by breakpoint rather than a single flag.

---

## Tawaslo HQ stays on the web

HQ admin is managed from the web dashboard and the admin link. It is **not** in the app.

Worth knowing if that ever changes: owner mode is currently gated on the web address —

```
const onAdminHost = window.location.hostname.indexOf(ADMIN_HOST_PREFIX) === 0;
const owner = onAdminHost && (user.email === ADMIN_EMAIL || hqFlag);
```

A native app has no hostname, so an HQ login would silently drop into agency mode. Moving the HQ flag onto the profile row in the database would fix it — but only needed the day HQ goes in the app.

---

## Build order

1. Phone scope — extend `DESKTOP_ONLY` into a breakpoint-aware split
2. Capacitor shell + push notifications, camera, share sheet, biometric login
3. Store listings, review submission

**Not in this phase:** Tawaslo HQ admin (stays on the web), the host portal (see `HOST-PORTAL-SPEC.md`), and a dashboard for the users' own clients. The client approval link (`tawaslo.com/portal/<token>`) stays a browser link — it is simpler and already works on a phone.

---

## Accounts needed

Apple Developer Program and Google Play Console both charge a fee. Abdulla's call, not a technical decision.
