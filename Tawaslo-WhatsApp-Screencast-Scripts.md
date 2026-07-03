# Tawaslo — WhatsApp App Review Screencast Scripts

Two short clips for Meta. Record each in **one take, no cuts**. Narration optional — the on-screen actions are what count. Keep each under ~2 minutes.

Have ready before recording:
- Your **test number** added as a recipient in WhatsApp Manager (you + tgab).
- Your `PHONE_NUMBER_ID` and a temporary `ACCESS_TOKEN` (from WhatsApp Manager / App Dashboard → WhatsApp → API Setup).
- The `hello_world` template (or your own approved template).
- A clean terminal and your phone on screen (or screen-mirrored).

---

## Video A — Sending and receiving a message (~30–45 sec)

**Goal:** show a real message sent via the API arriving in WhatsApp.

1. Open a clean terminal, full screen. (No unrelated tabs/windows.)
2. Show the cURL command on screen, then run it:

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

3. Let the **200 OK** response with the `messages` id show clearly for a second.
4. Cut to your **phone**: show the WhatsApp message landing in the chat.
5. (Optional) Type a quick reply back from the phone to show two-way messaging.

**Optional narration:** "Tawaslo sends a WhatsApp message on behalf of a connected business through the Cloud API. The API returns success, and the message arrives on the recipient's WhatsApp."

---

## Video B — Creating a message template (~30–45 sec)

**Goal:** show a template being created and submitted for approval.

1. Open **WhatsApp Manager → Message Templates**.
2. Click **Create template**.
3. Fill in: a **name** (e.g. `weekend_offer`), **category** (Marketing or Utility), **language** (English).
4. Type the **body text** (e.g. "Hi {{1}}, this weekend enjoy 20% off at our restaurant. Reply to book a table.").
5. Click **Submit** and let the "submitted / pending review" state show on screen.

**Optional narration:** "From Tawaslo, a business creates and submits a WhatsApp message template for Meta approval, then uses it to message opted-in customers."

---

## After recording
- Save each as its own file (e.g. `tawaslo_wa_videoA.mp4`, `tawaslo_wa_videoB.mp4`).
- Attach both in the App Review form alongside the justification text in `Tawaslo-WhatsApp-MetaReview.md`.
- Submit `whatsapp_business_messaging` + `whatsapp_business_management`, bundled with the Instagram permissions.

## Common rejection traps to avoid
- Demo must clearly show the permission in action (a real send + a real template create).
- No unrelated browser tabs or windows on screen.
- Make sure Business Verification is green and `tawaslo.com/privacy` is live before submitting.
