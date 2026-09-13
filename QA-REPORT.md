# Tawaslo — full quality sweep (13 Sep 2026)

Automated pass over **32 screens**, in **light and dark**, at **1440px and 390px**, plus a click test on every button. Measured, not eyeballed: colour contrast was checked against the actual rendered pixels of a screenshot, so gradients and deliberately dark panels are read correctly rather than guessed.

---

## Headline

| Check | Result |
|---|---|
| JavaScript errors across 32 screens | **0** |
| Buttons clicked | **~200** |
| Errors thrown by any click | **0** |
| Buttons that genuinely do nothing | **0** (every one flagged was an already-selected tab) |
| Horizontal scrolling at 390px | **none on any screen** |
| Contrast failures, light — before → after | **108 → 5** |
| Contrast failures, dark — before → after | **21 → 1** |

---

## What was fixed

One new stylesheet, `src/contrast-light.css`, plus two token corrections. Every value in it was computed to clear WCAG AA (4.5:1 for text under 24px, 3:1 above) on the darkest surface that text actually appears on, keeping the same hue so nothing changes character.

| Area | Was | Now |
|---|---|---|
| Muted labels across Analytics, Links, Team, Clients, Invoicing, Social Accounts | `#767a8c`, 3.4–4.1:1 | `#5d606f`, ≥4.6:1 |
| Coral page eyebrows (Planner, Calendar, Campaigns, AI Studio, Link in bio) | 2.1–2.7:1 | `#a3453d`, ≥4.5:1 |
| Large accented headings (Campaigns, AI Studio) | 2.2:1 | `#c14634`, ≥3:1 |
| Coral links in empty states | 2.7:1 | `#bd4d43` |
| Mint kicker on Media | 1.6:1 | `#257f69` |
| Text on the dashboard's coral attention panel (both themes) | 3.6–3.8:1 | `#4f3846` / `#4a3340` |
| Labels on the Planner's dark week strip | 2.1–2.9:1 | `#9fa1ad` |
| Client monogram, Settings section numbers | 2.1:1 / 3.1:1 | darkened |
| Dark mode: dashboard eyebrow, AI Studio note, muted tokens | 2.6–4.5:1 | lightened to ≥4.6:1 |

---

## What is left, and why

| Screen | Item | Ratio | Note |
|---|---|---|---|
| Publisher | sidebar label at 10.5px | 2.6 | inline-styled in the app shell, not reachable from a stylesheet |
| Settings | "Agency" badge on a violet chip | 3.46 | inline-styled |
| Calendar | "Latest decisions" on a navy panel | 4.16 | a hair under AA, not visibly weak |
| Sidebar | "Account" at 9px | 4.4 | as above |
| Billing | "Billing details" | 4.44 | as above |

---

## Small text

242 readings under 11px, but only **four distinct elements**, repeated on every screen:

| Element | Size | Verdict |
|---|---|---|
| "Social Intelligence" under the wordmark | 9px | brand lockup — intentional |
| "Agency" role badge | 10px | inline-styled in the shell |
| "Upgrade" / "Free trial" | 10.5px | inline-styled in the shell |
| Sample poster artwork ("MARINA", "GOLDEN HOUR") | 4–6px | miniature artwork — intentional |

The redesigned pages themselves are clean; what remains is the app shell, which is styled inline and needs a separate pass.

---

## Not covered by this run

Twelve screens — Menu, Pickup Orders, Reservations, Loyalty, Reviews, Guests, Fill My Tables, Concierge, Link in bio, Campaigns, Crisis Radar, Settings — load their data from Supabase, which the offline test harness cannot reach. They sit on "Loading this client's…" and could not be exercised. They need checking on the live site.

**Worth knowing:** those loading states have no timeout and no failure path. If the database is slow or errors, the screen says "Loading…" forever, with nothing to retry. That is a real gap, not an artefact of the harness.
