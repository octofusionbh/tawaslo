# Orderlo — WhatsApp message benchmark (vs eatapp)

Reference: eatapp's live WhatsApp reservation messages (competitor). Orderlo should **match this polish and beat it** (two-way Concierge, Arabic-first). Sender is the platform (verified WhatsApp business), the **venue is named inside every message** — exactly Orderlo's model.

## Message lifecycle to build (each as a WhatsApp template)
**Reservations**
- Reservation **Confirmed**
- Reservation **Updated**
- Reservation **Reminder** (before the booking)
- **Missed / no-show** → with a re-book link
- **Thanks for dining** → with a review link

**Orders / pickup** (Orderlo equivalents)
- Order **received** → ready time
- Order **ready for pickup**
- Order **thanks** → review link

## Elements every message should carry (from eatapp, matched/improved)
- **Personalized greeting** — "Dear [name]" / localized ("Ni Hao", "Ahlan", "مرحبا [الاسم]").
- **Venue name** in the body (always).
- **Details** — date/time, guests / items, **Reservation or Order ID**.
- **Per-venue house policies** (optional block): dress code, children policy, table-hold time, max seating time.
- **Contact number** of the venue.
- **Interactive buttons** — "Call the restaurant" (call button) and "Location" (URL → Google Maps). *(WhatsApp template buttons: CALL + URL types — must be built into the templates and approved by Meta.)*
- **Links** — re-book, leave a review (with locale param for Arabic/English).
- Footer/signature — the venue's name (e.g. "— Mei Ling"), not "Orderlo" in the body.

## Where Orderlo wins
- **Two-way** — the Concierge chats and takes the booking/order in the same thread, not just outbound alerts.
- **Arabic-first** — greetings, policies and buttons in Arabic or English per guest.
- **All-in-one** — reservations + orders + loyalty + reviews from one number/thread.
- **AI-personalized** — greeting/tone adapt to cuisine and guest.

## Build notes
- These need **WhatsApp templates with buttons** (Call + URL) — richer than the plain `order_received` template already submitted. Create them in WhatsApp Manager with CALL and URL button components; each needs Meta approval.
- Variables map to the venue + booking/order data (venue name, guest name, date/time, guests, ID, contact, maps URL, rebook/review URLs).
- Keep it real — no fake policies; pull each venue's actual guidelines from its settings.
