# NEW COWORK SESSION — HANDOFF (read this first)

Updated 11 Sep 2026. Paste the "Kickoff prompt" (bottom) into a fresh Cowork window. **Connect BOTH folders first:** `C:\dev\tawaslo` (live app) and `C:\dev\tawaslo-dashboard-redesign` (Codex's redesign).

---

## THE JOB (in order)
1. **Implement Codex's new design into the live app** — copy the redesign's front-end over the live app's, keeping the live backend.
2. **Verify it builds**, re-apply 3 pending fixes (below).
3. **Then** (after Supabase is fixed) test → deploy → live. User pushes manually.

---

## THE TWO CODEBASES
- **Live app:** `C:\dev\tawaslo` — currently deployed at tawaslo.com (Vercel). Old design. Has the **working `api/` backend** and all env/config. Real clients use it (tgab, salomi, saloomi) — DO NOT break it.
- **Redesign:** `C:\dev\tawaslo-dashboard-redesign` — Codex's NEW design (light palette), componentized (React 19 CRA). Has `src/`, `public/`, `build/`, SQL, emails. **It has NO `api/` folder — front-end only.** Points at the **same Supabase project** and **same Meta app** as the live app, so data + permissions carry over.

---

## MIGRATION — EXACT STEPS (needs a working shell/bash)
Do the bulk copy with the shell (it was DOWN in the previous session with a mount error — confirm it works in the new session before starting):

1. **Copy** `tawaslo-dashboard-redesign/src/*` → `tawaslo/src/` (overwrite).
2. **Copy** `tawaslo-dashboard-redesign/public/*` → `tawaslo/public/` (overwrite).
3. **Copy** `tawaslo-dashboard-redesign/package.json` → `tawaslo/package.json` (redesign uses React 19, lucide-react ^1.17, react-icons ^5.6, qrcode — confirm deps).
4. **DO NOT touch or delete `tawaslo/api/`.** These serverless functions run the product: `cron.js` (scheduled publishing), `meta-publish.js` (Post now), `instagram-oauth.js` + `meta-oauth.js` + `linkedin-oauth.js` (connect accounts), `instagram-analytics.js` (dashboard numbers + the per-post `mediaInsights` action), `instagram-inbox.js`, `meta-ads.js`, `generate-caption.js`, `tap.js` (payments), `trends.js`, `send-welcome-email.js`.
5. **Keep** the live app's env vars, `vercel.json`/config, and domain untouched.
6. **Verify build:** `npm install` then `npm run build` in `C:\dev\tawaslo`. Also quick syntax check: `npx esbuild src/TawasaloApp.js --loader:.js=jsx --outfile=/dev/null --log-level=error` (exit 0 = OK; does NOT catch undefined refs, so also do the real build).
7. **SQL:** the redesign folder has migration `.sql` files (spotlight, bio, labels, etc.). Review ordering/RLS and apply in Supabase only after it's un-restricted. NEVER run blindly in production.

---

## 3 PENDING FIXES TO RE-APPLY (made in the live app this session; must be redone in the redesign, which becomes live)
1. **Planner upgrades** — a new **Published tab** (per-post views/reach/likes/comments/saves), **real inline edit** (caption/date/time), **Archive** (+ Archived modal), and **confirm-before-delete**. In the live app these were in `src/TawasaloApp.js` `CalendarPage`. In the redesign the Planner is `PlannerExperience.js` / `CalendarExperience.js` — re-implement there. The supporting API (`mediaInsights` action in `api/instagram-analytics.js`) already exists in the live `api/` (kept), so it survives the copy.
2. **Trial banner** — the "Your free trial has ended" bar must NOT show for full-access/paid accounts. In the redesign it's the `TrialBanner` component in `TawasaloApp.js`; make its effect skip when the user email is in `FULL_ACCESS_EMAILS` or `localStorage['tw_paid_'+email]==='1'`.
3. **Alt text** — show the alt-text box for ANY image post (feed/carousel), only hide it for Instagram Reels/Stories. In the redesign's Publisher, the condition should be: `images.length>0 && !(igSelected && (igFormat==='reel'||igFormat==='story'))`.

---

## HARD BLOCKERS (state these to the user; don't work around them)
- **Supabase project `gtjmpmhsiyqwhykunosc` is RESTRICTED** — exceeded storage quota. The app can't sign anyone in or load data until the owner **upgrades to Pro (~$25/mo)** or removes the spend cap in Supabase → Org → Billing. Nothing runs live until then. (Reducing storage won't clear it fast — quota is averaged over the billing period.)
- **Shell/bash was broken last session** (mount error). The migration needs it. If it's still broken, the copy can't be done — tell the user.

---

## SAFETY RULES
- Real clients are live on this app — additive changes only; keep `api/`, env, config, domain.
- Data + Meta permissions are SAFE (they live in Supabase + the Meta App dashboard, App ID `1652475822681144`, not in the front-end code). Same Supabase project + same Meta app = connections and tokens carry over.
- `TawasaloApp.js` is huge — edit with targeted unique-anchor string replacements, verify after each.
- Do NOT deploy/push until: build passes, 3 fixes re-applied, Supabase restored. **User pushes manually.**

---

## ALREADY DONE THIS SESSION (don't redo)
- **saloomi RLS fix** — ran `tawaslo-team-social-access-fix.sql` in Supabase (opened `social_accounts` + `posts` to team members / admin). Live.
- **Trial-banner + alt-text + Planner fixes** — written into the LIVE `C:\dev\tawaslo\src\TawasaloApp.js` and `api/instagram-analytics.js` (not yet deployed). These get superseded by the redesign, so re-apply per above.

## LATER (not now — in priority order after the design is live)
- Host dashboard — build per `CODEX-HOST-DASHBOARD-PROMPT.md` + `HOST-PORTAL-SPEC.md` (host.tawaslo.com, host-owns-venue, self-serve + agency-bundle→grace→convert, "For Venues" price cards).
- Meta App Review — record + submit per `Meta-AppReview-RecordDay-Runbook.md` + `Meta-AppReview-Ads-Submission.md` + `Meta-AppReview-Inbox-Submission.md`.
- Streams/Competitor/Steal-This — turn on by setting `APIFY_TOKEN` in Vercel (free tier), then make them degrade honestly (no fake fallback).
- **HQ admin dashboard — the LAST thing** (already exists + wired; polish/expand per `CLAUDE-LAUNCH-HANDOFF.md` scope).

## REFERENCE FILES
In `C:\dev\tawaslo-dashboard-redesign\`: `CLAUDE-LAUNCH-HANDOFF.md` (Codex's full handoff — read it), `README.md`, `Tawaslo-Pipeline-Status.md`, `Tawaslo-Flow-Parity-Audit.md`, `Account-Flow-Handoff.md`, migration `.sql` files.
In `C:\dev\tawaslo\`: `CODEX-HOST-DASHBOARD-PROMPT.md`, `HOST-PORTAL-SPEC.md`, `Meta-AppReview-*.md`, `tawaslo-team-social-access-fix.sql`, `LAUNCH-STATUS.md`, this file.

---

## KICKOFF PROMPT (paste into the new session)
> Connect both folders C:\dev\tawaslo and C:\dev\tawaslo-dashboard-redesign. Read `C:\dev\tawaslo\NEW-SESSION-HANDOFF.md` first, then `C:\dev\tawaslo-dashboard-redesign\CLAUDE-LAUNCH-HANDOFF.md`. Task: implement Codex's new design into the live app by copying the redesign's `src` and `public` over `C:\dev\tawaslo`, KEEPING the live `api/` backend, env and config. Then run the build to verify, and re-apply the 3 pending fixes (Planner Published-tab/edit/archive, trial-banner full-access skip, alt-text for image posts). Do NOT push or deploy — I push manually, and Supabase is still restricted. Confirm the shell works before the bulk copy; if anything's missing, flag me. Don't break the live app.

---
STATUS UPDATE — 11 Sep 2026 (later session)
* Shell fixed: cause was Windows update KB5124008; uninstalled + updates paused until 25 Sep 2026. Remember to resume updates once Anthropic/Microsoft ship a fix.
* Migration DONE: redesign `src/`, `public/`, `package.json`, `package-lock.json` copied into `C:\dev\tawaslo`. `api/`, `.env.local`, `vercel.json` verified byte-identical (untouched).
* Backup of the old live front-end: `_backup-before-redesign-2026-09-11/` (git-ignored via .git/info/exclude).
* Fixes: Planner upgrades were ALREADY in the redesign (real planner route = `CalendarPage` in TawasaloApp.js; PlannerExperience is only the preview-marina demo). Trial-banner skip + alt-text condition applied to `src/TawasaloApp.js`.
* Build verified: esbuild syntax OK; `CI=true npm run build` → Compiled successfully (clean install from lockfile, in a scratch copy — local node_modules NOT reinstalled; run `npm install` locally before `npm start`).
* NOT applied (needs decision): redesign's `api/meta-oauth.js` is a hardened version (escapes error, restricts postMessage origin + redirect URI to tawaslo.com/www or PUBLIC_SITE_URL). Live api kept as-is per rules.
* Still blocked: Supabase restricted (billing). Not pushed/deployed.

## STATUS UPDATE — 12 Sep 2026 (Supabase migration + pre-launch pass)

**Supabase moved to a NEW free project: `oarlmvhgvinldkbprnfo`** (old `gtjmpmhsiyqwhykunosc` left untouched as a copy source, still storage-restricted until 30 Sep).
- Migrated via a generated one-shot SQL script: 43 tables, 9 auth users, 20 clients, all functions/policies/indexes, `media` bucket + 4 storage policies. Verified `MIGRATION COMPLETE`.
- `src/supabase.js` now points at the new URL + publishable key. `api/cron.js`, `api/tap.js`, `api/generate-caption.js` fallback URLs updated too.
- Vercel `SUPABASE_SERVICE_ROLE_KEY` updated by hand to the new project's secret key. No other SUPABASE_* vars exist in Vercel.
- Auth configured: Site URL `https://tawaslo.com`, redirect URLs for tawaslo.com + tawaslo.vercel.app, **public email sign-ups disabled**.
- NOTE: old media URLs on `gtjmpmhsiyqwhykunosc.supabase.co/storage/...` stay broken. ~20 scheduled posts need media re-uploaded.

**Sign-ups closed / waitlist**
- `src/AuthExperience.js`: `SIGNUPS_OPEN = false`. The register route now shows a "Launching soon" screen that writes to `public.waitlist` (email unique, insert-only RLS for anon/authenticated, nobody can read it from the app). Honeypot field + 1 submission/minute guard.
- Flip `SIGNUPS_OPEN` to `true` (and re-enable sign-ups in Supabase) to reopen self-serve signup.

**HQ "Add account"** (new)
- `api/admin-create-account.js` — HQ-only. Verifies the caller's access token, checks their email against `TAWASLO_ADMIN_EMAILS` (env, comma separated; defaults to demo@tawaslo.com + octofusionbh@gmail.com), creates the auth user with the same `tawaslo_setup` metadata a normal signup writes, then sends a password-setup email. No password ever touches the server.
- `NewAccountModal` in `src/TawasaloApp.js`, opened by the "Add account" button in `OwnerDashboard`.

**Storage / performance**
- `shrinkImageBlob()` in `src/TawasaloApp.js` — every canvas/AI/logo/menu upload is now resized and re-encoded (JPEG, or capped PNG for logos) instead of saving 4 MB PNGs.
- `public/` assets optimised: 4.5 MB → ~1.0 MB (logo-transparent 994 KB→27 KB, two character sprites ~1.8 MB each → ~480 KB). Unused `newsletter-hero.gif` moved to `_to_delete/`.
- `vercel.json` gained security headers (HSTS, nosniff, SAMEORIGIN, referrer policy, permissions policy). Old copy in `_to_delete/vercel.json.bak`.
- Vercel Web Analytics: loaded on the public marketing site only, and only after the visitor enables Analytics in the cookie banner (`SiteAnalytics` in `src/MarketingExperience.js`). No npm dependency.

**Known remaining**
- JS bundle is 787 kB gzip — needs code splitting.
- Colour-contrast pass not done.
- `qrcode` had to be installed (`npm install`) — it was in package.json but missing from node_modules.
- Build verified: `Compiled successfully`. NOTHING PUSHED OR DEPLOYED.

### Later on 12 Sep — accessibility + copy
- **Access expiry on HQ-created accounts.** `api/admin-create-account.js` takes an optional `expiresAt` (YYYY-MM-DD) and stores it on the auth user as `tawaslo_access_expires`. `syncAccessExpiry()` in `src/TawasaloApp.js` (called from `prepareAccountSession`) converts it into the `tw_trial_start_<email>` clock the existing soft paywall already reads, so publishing/scheduling/AI lock on that date with no other code changes. Default in the form is today + 30 days; clearing the field means no expiry.
- **Contrast pass (WCAG AA).** Audited the built marketing site with a real DOM/computed-style checker across all 9 public routes. Dashboard DARK/LIGHT themes already pass. Fixed in `src/marketing-experience.css`: muted greys `#8b8f9e/#8c90a0/#777b8c/#787c8c/#777b8a/#777b8b → #5e6274`, `#6d7182 → #565a6b`, `#e85f55 → #c0392b`, and coral small text on light backgrounds overridden to `#b43d31` (fills/dots/buttons keep the bright coral — coral buttons already use dark ink and pass). Failing text nodes went 52 → 14, and the remainder are false positives (text over CSS gradients, which the checker reads as transparent).
- **CTA copy.** "Start free" and "Start your 30-day trial" on the marketing site now read "Join the waitlist", since they land on the coming-soon screen.

### Bundle size — investigated, no quick win (12 Sep)
Measured properly with source maps instead of guessing:
- `react-icons` looked like 1.3 MB in the source map, but tree-shaking already drops unused icons (verified: an unused icon's path is absent from the built bundle). Not a problem.
- `src/approvalImages.js` (98 KB of base64 JPEGs) is **dead code** — the block that uses `APPROVAL_IMAGES` is eliminated at build time, so it never reaches the bundle. Confirmed by rebuilding with and without it: byte-identical output.
- What remains is genuinely live: `TawasaloApp.js` (~2.1 MB of source) plus React, react-dom and the Supabase SDK.
**Conclusion:** getting below ~788 kB gzip means splitting `TawasaloApp.js` into route-level chunks — a real refactor, not a config tweak. Deferred until after launch.
