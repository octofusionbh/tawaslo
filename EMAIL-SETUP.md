# Tawaslo — Email Setup (Zoho + Resend)

> ✅ STATUS (done): Zoho domain verified, mailboxes abdulla@ + support@ created. Namecheap: MX (3) + SPF + DKIM (zmail._domainkey) + zoho-verification + _dmarc all added. Zoho MX+SPF verified green; DKIM propagating (re-verify to green). Resend: domain tawaslo.com VERIFIED, RESEND_API_KEY already set in Vercel. Registrar = Namecheap (its Advanced DNS Type dropdown is buggy under browser extensions — added TXT via clean view / could use live chat).
> TODO later (optional): add Zoho aliases billing@/reports@/notifications@/hello@ → support@; delete stray tawaslo@ if present; read mail via Zoho app (IMAP into Gmail is paid ~$1/user/mo).


**One-line model:** every address has two halves — *sending out* and *receiving in*.
**Resend** does the sending (the app's automated emails). **Zoho** does the receiving (your real inboxes).
They are NOT "Resend for billing, Zoho for support" — both are involved in *every* address.

- **Resend** = the postman for automated emails. ONE account, verify `tawaslo.com` once, and it can send from ANY `@tawaslo.com` address. You do NOT make a Resend account per address.
- **Zoho** = the actual mailboxes. Defines which addresses can *receive* a reply, and where you read/reply by hand.

DNS lives at **Namecheap** → Domain List → tawaslo.com → Manage → **Advanced DNS** → Host Records.
(Host `@` = root; for a subdomain type only the prefix, e.g. `send`, `resend._domainkey`, `_dmarc`.)

---

## The addresses

| Address | For | Sent by (out) | Received by (in) |
|---|---|---|---|
| **billing@** | receipts, invoices | Resend (auto) | Zoho mailbox — you read replies |
| **support@** | help, team invites | Resend (auto) + you reply | Zoho mailbox — you read replies |
| **reports@** | monthly client reports | Resend (auto) | Zoho alias → support@ |
| **notifications@** | order/booking nudges | Resend (auto) | Zoho alias → support@ |
| **hello@ / info@** | general contact | you (Zoho) | Zoho alias → support@ |
| **abdulla@** | founder / sales | you (Zoho) | Zoho mailbox — your own inbox |

**One receipt, concretely:** customer pays → app fires a receipt **from billing@** via **Resend** →
customer replies → reply lands **in billing@** via **Zoho**, you read it. Same address, two halves.

The app already sends each type from the right address (billing@, reports@, notifications@, support@) —
no code change needed once Resend verifies the domain.

---

## Plan

**Zoho (free forever, up to 5 mailboxes):**
- Mailboxes: `support@`, `billing@`, `abdulla@`
- Aliases (free, all land in support@): `reports@`, `notifications@`, `hello@`, `info@`, `sales@`
- Optional: catch-all → support@ (so any address arrives somewhere)

**Resend (free tier: 3,000 emails/mo, 100/day):**
- One account, verify `tawaslo.com`, set `RESEND_API_KEY` in Vercel.

---

## Pass 1 — Zoho (do first: receiving)

1. zoho.com/mail → Sign Up → **Forever Free** plan → "Sign up with a domain I own" → `tawaslo.com`.
2. **Verify domain:** Zoho shows a record (pick **TXT**). Add in Namecheap → Advanced DNS → Add Record →
   TXT, Host `@`, Value = the `zoho-verification=zb...` string → back in Zoho, click **Verify**.
3. Create mailboxes: `support@` (make it primary), then `billing@`, `abdulla@`.
4. In Namecheap set **Mail Settings → Custom MX**, then add Zoho's **MX** records:
   - MX · Host `@` · `mx.zoho.com` · Priority 10
   - MX · Host `@` · `mx2.zoho.com` · Priority 20
   - MX · Host `@` · `mx3.zoho.com` · Priority 50
5. **SPF** (root): TXT · Host `@` · `v=spf1 include:zoho.com ~all`
6. **DKIM:** enable in Zoho (Domains → DKIM); it gives a selector (e.g. `zmail._domainkey`) + value →
   add as TXT in Namecheap → click Verify/Enable in Zoho.
7. Add the aliases (Zoho → Users → support@ → Mail Aliases): `reports@`, `notifications@`, `hello@`, `info@`, `sales@`.
8. Install the **Zoho Mail app** → sign in → you're receiving.

## Pass 2 — Resend (the app's automated sending)

1. Resend → Domains → **Add Domain** → `tawaslo.com`.
2. It gives ~3 records on a **`send`** subdomain — add each in Namecheap:
   - MX · Host `send` · (the amazonses feedback host it shows) · Priority 10
   - TXT (SPF) · Host `send` · (the `v=spf1 include:amazonses.com ~all` it shows)
   - TXT (DKIM) · Host `resend._domainkey` · (the long key it shows)
   → click **Verify** in Resend.
3. Vercel → project → Settings → **Environment Variables** → add `RESEND_API_KEY` (from Resend) → redeploy.

## Both — one DMARC (optional but recommended)
- TXT · Host `_dmarc` · `v=DMARC1; p=none; rua=mailto:support@tawaslo.com`

---

## Guardrails (avoid the common mistakes)
- **Root SPF stays Zoho-only** (`include:zoho.com`). Resend's SPF lives on the `send` subdomain — different host, no conflict. Only ONE SPF TXT per host.
- **Only ONE MX set on the root** — Zoho's. Resend's MX is on `send`, not root.
- Namecheap **Mail Settings must be "Custom MX"** or the Zoho MX won't apply.
- Propagation: usually minutes, up to a few hours.

## Vercel env (already referenced by the code)
- `RESEND_API_KEY` — required to send anything.
- Optional overrides: `NOTIFY_EMAIL` (where internal alerts go), `NOTIFY_FROM` (default `notifications@tawaslo.com`), `BILLING_FROM` (default `billing@tawaslo.com`).
