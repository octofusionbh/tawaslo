# Tawaslo — WhatsApp App Review pack

Everything you need to submit the WhatsApp permissions to Meta. Copy-paste the justification text, follow the screencast script, tick the checklist. Bundle this with your Instagram permission review.

---

## 1. What you're requesting (Tech Provider)
Because Tawaslo manages WhatsApp **on behalf of client businesses**, Meta classifies you as a **Tech Provider**, and you need **Advanced Access** to:

| Permission | Why |
|---|---|
| `whatsapp_business_messaging` | Send and receive messages (inbox replies, broadcasts, flows) for your clients. |
| `whatsapp_business_management` | Manage clients' WhatsApp assets — phone numbers, message templates, account settings. |

---

## 2. Pre-submission checklist (do these first)
1. **Business Verification** — verify Octo Fusion in Meta Business Settings → Security Center. (Required before Advanced Access is granted.)
2. **Add the WhatsApp product** to your existing Tawaslo Meta app (App Dashboard → Add Product → WhatsApp).
3. **Grab the free test number** Meta provides → add yourself + tgab as test recipients (up to 5). Confirm you can send/receive.
4. **Create at least one message template** in WhatsApp Manager (e.g. a simple `hello_world`-style or your "weekend offer" template) and let it get **Approved** — you'll film this.
5. **Add a privacy policy URL** to the app (tawaslo.com/privacy) — Meta checks it.
6. Make sure the app's **use-case / app verification** info names Octo Fusion and tawaslo.com.

---

## 3. The demo screencasts (what Meta wants to see)
Meta asks for **two short screen recordings**. You're allowed the **shortcut versions** below — you do **not** need the finished UI to record them.

### Video A — a message being sent and received
**Shortcut (recommended):** screen-record a terminal running this cURL against your test number, then show the message arriving in WhatsApp on your phone.

```bash
curl -i -X POST \
  "https://graph.facebook.com/v21.0/<PHONE_NUMBER_ID>/messages" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "<YOUR_TEST_RECIPIENT_NUMBER>",
    "type": "template",
    "template": { "name": "hello_world", "language": { "code": "en_US" } }
  }'
```

Record: run the command → success response (200) → cut to your phone showing the WhatsApp message land. ~30–45 seconds.

*(Or, once the Tawaslo inbox is connected, just record yourself sending a reply from the app and it arriving in WhatsApp — either is accepted.)*

### Video B — a message template being created
**Shortcut:** screen-record **WhatsApp Manager → Message Templates → Create template** — fill in name, category (Marketing/Utility), language, body text → Submit. ~30–45 seconds.

*(Or record the Tawaslo template manager doing the same — either is accepted.)*

### Recording tips
- Use a clean browser/terminal, no unrelated tabs.
- Show the **whole flow** end-to-end in one take, no cuts mid-action.
- Narration optional; on-screen actions are what matter.
- Keep each clip under ~2 minutes. Upload as unlisted/public links or attach per Meta's form.

---

## 4. Justification text (copy-paste into the App Review form)

### `whatsapp_business_messaging`
> Tawaslo (tawaslo.com), operated by Octo Fusion, is a social-media management platform used by marketing agencies and businesses to manage their customer communications. We request `whatsapp_business_messaging` so our users can, from within Tawaslo, send and receive WhatsApp messages for their own business accounts: reply to incoming customer messages from a shared team inbox, send approved template broadcasts to opted-in contacts, and run automated reply flows. Each business connects its own WhatsApp Business Account and explicitly authorizes Tawaslo to act on its behalf. We only message users who have contacted the business or opted in. To test: open the connected account's inbox, view an inbound test message, and send a reply; the reply is delivered to the recipient's WhatsApp. We also send pre-approved templates for business-initiated broadcasts.

### `whatsapp_business_management`
> We request `whatsapp_business_management` so Tawaslo can manage the WhatsApp Business Account assets that each client explicitly connects to us: registering/selecting the business phone number, creating and submitting message templates for Meta approval, and reading template approval status and messaging limits. This lets agencies manage multiple clients' WhatsApp presence from one dashboard without leaving Tawaslo. To test: connect a WhatsApp Business Account, create a message template from the Tawaslo template manager (or WhatsApp Manager), and view its approval status reflected in the app. Access is scoped to accounts the user owns or has been granted access to.

### How you store / use the data (if asked)
> Messages and contact details are stored securely (Supabase, encrypted at rest) and used only to provide the messaging features the business requested. We do not sell data or use it for advertising. Businesses can delete their data on request. Opt-in/consent is tracked per contact, and only opted-in contacts receive broadcasts.

---

## 5. Common rejection reasons (avoid these)
- **No business verification** → do step 1 first.
- **Vague justification** → use the exact text above; name the permission's concrete use.
- **Demo doesn't show the permission in action** → the screencast must show a real send/receive and a real template creation.
- **Messaging non-opted-in users** → emphasize opt-in/consent (the text does).
- **Missing privacy policy** → add tawaslo.com/privacy.

---

## 6. Bundle with Instagram
Submit these two WhatsApp permissions in the **same App Review cycle** as your Instagram permissions (`instagram_business_manage_comments`, `_manage_messages`, `_manage_insights`) once the pending June 7 submission clears. One combined review, one set of screencasts to manage.

---

## 7. Order of operations
1. Business Verification + add WhatsApp product.
2. Test with the free number (you + tgab).
3. Record Video A (cURL send) + Video B (template create).
4. Paste the justification text, attach the videos, add privacy URL.
5. Submit — bundled with the Instagram permissions.
6. The backend is already built (`/api/meta-publish` handles WhatsApp send + webhook), so the inbox/broadcasts go live the moment you're approved and add the env vars.
