# Tawaslo — Paddle Payment Setup (step by step)

Goal: accept subscription payments with **no Commercial Registration (CR)**, with money paid out to your **ila USD account** (or Payoneer). Paddle is the Merchant of Record — it handles cards, Apple Pay, PayPal, and VAT for you.

The app is already wired. You only need to create the Paddle account, copy a few IDs into Vercel, and redeploy.

---

## Part A — Create your Paddle account (~10 min)

1. Go to **https://www.paddle.com** → **Sign up**. Choose **Paddle Billing** (the current product).
2. Enter your email, set a password, verify the email.
3. Fill your seller profile:
   - Business type: **Individual / Sole proprietor** (you don't need a CR).
   - Your name, address (Bahrain), and **website: `tawaslo.com`**.
4. Submit. Paddle reviews new accounts before **live** payments are enabled (usually 1–3 business days). **You can build and test in Sandbox immediately** while that review runs.

> Tip: Sandbox is a separate environment. You'll log into the **sandbox dashboard** to test, and the **live dashboard** to go live. Same steps in both.

---

## Part B — Set your payout method (where the money lands)

1. In Paddle dashboard → **Business → Checkout / Payout settings** (label may be "Get paid" or "Balance").
2. Add a payout method:
   - **Bank transfer (SWIFT):** enter your **ila USD account** — account holder name (must match your Paddle name), **IBAN (BH…)**, **SWIFT/BIC**, bank name. Choose **USD** as payout currency.
   - **or Payoneer / PayPal** if you prefer.
3. Payouts run **monthly** (created on the 1st, paid by the 15th) once your balance is over the **$100** minimum.

> ila opens a USD account free and **receiving a foreign-currency inward remittance is free**, so USD → ila USD account avoids conversion + SWIFT fees. (Correspondent banks may occasionally take a few dollars — normal for SWIFT.)

---

## Part C — Create the plans & prices

Create **3 products**, each with **2 prices** (monthly + annual). All in **USD**, type **Recurring**.

1. Dashboard → **Catalog → Products → + New product**.
2. Make these three products and add prices:

| Product | Monthly price | Annual price (per year) |
|---|---|---|
| Tawaslo Essential | **$54.00 / month** | **$516.00 / year** (= $43/mo) |
| Tawaslo Professional | **$109.00 / month** | **$1,044.00 / year** (= $87/mo) |
| Tawaslo Enterprise | **$219.00 / month** | **$2,100.00 / year** (= $175/mo) |

3. (Optional, later) add the AI image packs as **one-time** prices: Lite **$20.90**, Plus **$26.90**, Max **$42.90**.
4. For each price you create, Paddle shows a **Price ID** that looks like `pri_01h…`. **Copy all six** — you'll paste them into Vercel next.

> Optional but recommended: add a **10-day free trial** on each subscription price (Paddle supports trial periods), so it matches the app's "$0 due today" trial.

---

## Part D — Get your client token & approve your domain

1. Dashboard → **Developer Tools → Authentication → Client-side tokens** → copy the token. It starts with `live_…` (live) or `test_…` (sandbox).
2. Dashboard → **Checkout → Website approval** (or "Default payment link / approved domains") → **add `tawaslo.com`** (and `www.tawaslo.com`). Paddle.js only opens checkout on approved domains.

---

## Part E — Add the keys to Vercel & redeploy

1. Vercel → your Tawaslo project → **Settings → Environment Variables**. Add (Production):

```
REACT_APP_PADDLE_TOKEN        = test_xxx   (use the sandbox token first)
REACT_APP_PADDLE_ENV          = sandbox    (change to "production" when live)
REACT_APP_PADDLE_ESSENTIAL_M  = pri_…      (Essential monthly price ID)
REACT_APP_PADDLE_ESSENTIAL_Y  = pri_…      (Essential annual price ID)
REACT_APP_PADDLE_PRO_M        = pri_…      (Professional monthly)
REACT_APP_PADDLE_PRO_Y        = pri_…      (Professional annual)
REACT_APP_PADDLE_ENT_M        = pri_…      (Enterprise monthly)
REACT_APP_PADDLE_ENT_Y        = pri_…      (Enterprise annual)
```

2. **Redeploy** (env-var changes only take effect after a new deploy). Run `fix_and_push.bat`, or hit "Redeploy" in Vercel.

---

## Part F — Test in Sandbox

1. Open Tawaslo → **Billing**. Pick a plan → the **Paddle overlay** should open.
2. Pay with a **Paddle sandbox test card**: `4242 4242 4242 4242`, any future expiry, any CVC, any name.
3. Checkout should complete and the app flips to **paid**. 🎉

---

## Part G — Go live

1. Once Paddle approves your account, repeat **Part C/D** in the **live** dashboard (or promote, if Paddle offers it) to get **live** price IDs + the **`live_…`** token.
2. In Vercel, swap the env values to the live token + live price IDs, and set `REACT_APP_PADDLE_ENV = production`. Redeploy.

---

## Part H — (Later) Webhook so subscriptions persist server-side

So a user's plan/status updates automatically on subscribe, renew, or cancel:

1. Dashboard → **Developer Tools → Notifications → + New destination**.
2. URL: `https://tawaslo.com/api/paddle-webhook` (Abdulla — ping me and I'll add this endpoint into an existing API function to stay under the Vercel function limit, then give you the exact URL + the secret to paste back here).
3. Subscribe to events: `subscription.created`, `subscription.updated`, `subscription.canceled`, `transaction.completed`.

That's it. Parts A–F get you taking test payments today; G + H make it live and persistent.
