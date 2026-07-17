# Tawaslo — WhatsApp Templates (submit to Meta / WhatsApp Manager)

How to use this: create each template in WhatsApp Manager with the exact **name**, **category**, and **language** below, and paste the **body**. The `{{n}}` are variables Tawaslo fills automatically — the "Fills with" column shows what goes where (the order matters and matches the engine). Lead every message with the venue name so the customer always knows who it's from, even though the sender is Tawaslo.

Tip on categories: order/reservation status = **Utility** (cheap, fast approval). The "rate us / book again" ones are borderline — submit as **Utility**; if Meta rejects, resubmit as **Marketing**.

---

## Pickup / product orders

### `order_received` · Utility · en
> {{1}}: we've got your order {{2}} ✅ It'll be ready around {{3}}. We'll message you when it's ready. Questions? Contact us on {{4}}.

Fills with: {{1}} venue · {{2}} order code · {{3}} pickup time · {{4}} venue contact number

### `order_ready` · Utility · en
> {{1}}: your order {{2}} is ready for pickup 🎉 See you soon!

Fills with: {{1}} venue · {{2}} order code

### `order_thanks` · Utility · en
> {{1}}: thanks for your order! We'd love your feedback — rate us here: {{2}}

Fills with: {{1}} venue · {{2}} review link

### `order_new_host` · Utility · en  *(sent to the venue)*
> {{1}} — new order {{2}} 🛎 Customer {{3}} ({{4}}). Open your dashboard to prepare it.

Fills with: {{1}} venue · {{2}} order code · {{3}} customer name · {{4}} customer phone

---

## Reservations

### `reservation_confirmed` · Utility · en
> {{1}}: your reservation is confirmed for {{2}}, {{3}} guests. Reservation ID {{4}}. Questions? Contact us on {{5}}. We look forward to welcoming you!

Fills with: {{1}} venue · {{2}} date & time · {{3}} guests · {{4}} reservation ID · {{5}} venue contact

### `reservation_updated` · Utility · en
> {{1}}: your reservation has been updated to {{2}} for {{3}} guests. Reservation ID {{4}}. Contact us on {{5}} for anything.

Fills with: {{1}} venue · {{2}} new date & time · {{3}} guests · {{4}} reservation ID · {{5}} venue contact

### `reservation_cancelled` · Utility · en
> {{1}}: your reservation has been cancelled. We hope to see you soon — book again here: {{2}}

Fills with: {{1}} venue · {{2}} re-book link

### `reservation_noshow` · Utility · en
> {{1}}: we're sorry we missed you today. Book a new table here: {{2}}

Fills with: {{1}} venue · {{2}} re-book link

### `reservation_reminder` · Utility · en
> {{1}}: a reminder of your reservation {{2}} for {{3}} guests. See you soon!

Fills with: {{1}} venue · {{2}} date & time · {{3}} guests

### `reservation_thanks` · Utility · en
> {{1}}: thank you for dining with us! We'd love your feedback: {{2}}

Fills with: {{1}} venue · {{2}} review link

### `reservation_new_host` · Utility · en  *(sent to the venue)*
> {{1}} — new reservation for {{3}} guests on {{2}}. Guest {{4}} ({{5}}). View it in your dashboard.

Fills with: {{1}} venue · {{2}} date & time · {{3}} guests · {{4}} guest name · {{5}} guest phone

---

## Notes
- Add Arabic versions later by creating the same template names with language `ar` — the engine already reads a per-venue language setting.
- Approval is usually fast for Utility (often same day). You need Business Verification + a registered number first.
- Once approved, set `WA_TOKEN` + `WA_PHONE_ID` in Vercel and the whole engine goes live — no code change needed.
