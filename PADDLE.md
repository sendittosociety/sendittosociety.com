# Getting Paddle live

Paddle is the **merchant of record**: they take the payment, handle sales tax and
VAT in every country, and pay you out. That is why the Terms already name them.
Nothing here can be done for you — it needs your identity documents and your
logins — but everything Paddle *checks* is already in place.

## The phone number was never required

The contact page was held back for months on the belief that Paddle demands a
phone number. **It does not.** Their domain review asks for exactly this:

| Requirement | Where it lives | Status |
|---|---|---|
| Clear product description | homepage hero | ✅ |
| Pricing or a pricing page | homepage, `$39` + the `~$52/mo` it replaces | ✅ |
| Key features / deliverables | homepage, 14 tools with one-line summaries visible without clicking | ✅ |
| Terms, Refund Policy, Privacy Policy, reachable from navigation | footer of every page | ✅ |
| Legal name in the Terms (preferred for sole proprietors) | "Christopher Leon Gales" in `terms.html` | ✅ |
| Live site with SSL | `https://sendittosociety.com` | ✅ |

Verified against the live site, not the local copy.

**The invite gate is off the homepage** for this reason — a reviewer meeting a
pass phrase rejects the domain. `/download` and `/tester` stay gated; neither is
part of what Paddle looks at. The site is still `noindex`, so it is reviewable
without being advertised.

## The three verifications

Start these early. Paddle's own docs say it "can sometimes take a few days".

1. **Domain review** — add `sendittosociety.com` under **Paddle → Checkout →
   Domains**, request approval.
2. **Business verification** — sole proprietor, Fort Collins, Colorado. Mostly
   automatic.
3. **Identity verification** — for anyone holding 25% or more. That is you,
   alone. Expect a government ID and possibly a proof of address.

## Steps

1. **Sign up live** at <https://vendors.paddle.com> — use
   **sendittosociety@gmail.com**, the address on the site. A mismatch between
   the account and the published support address is a needless review question.
2. Confirm the email, turn on 2FA immediately. This account moves money.
3. **Request domain approval** for `sendittosociety.com`.
4. **Complete business + identity verification** when they ask. Answer fast —
   this is the part with the real waiting in it.
5. **Create the product**: `Send It To Society`, one-time, **$39 USD**.
   Description can be lifted straight off the homepage.
6. Once approved, wire the checkout — see below.

## What changes on the site when it is approved

`buy.html` currently says, honestly, that checkout is by hand: email, payment
link, key. Replace that one card with Paddle.js and the price ID. Everything
else on the page — what the key unlocks, the trial-ended reassurance, the refund
promise — stays exactly as it is.

`TrialGate.tsx` in the app already points at `/buy`, so the in-app **GET A KEY**
button needs no change and no rebuild.

## The thing to remember about keys

Paddle takes the money; **it does not mint the licence key**. That still comes
from your signing key:

```
node scripts/license.mjs issue "Buyer Name" --tier founder --slots 3
```

Until that is automated by a webhook, every sale has a manual step: payment
lands, you issue a key, you email it. At the volume of the first hundred buyers
that is fine, and it is a good problem to have.
