# Calibre & Co. Storefront

## Decision

Calibre's public storefront is built from the existing Calibre codebase and infrastructure. Wix is not part of the target architecture.

Use:
- Calibre public site for catalogue and item pages
- Supabase for public catalogue data, publication state, orders and later webhook-backed sale events
- Square for card checkout and payment processing
- Resend for transactional email
- GitHub for code and deployment
- existing cPanel/web hosting for the public site and compatible hosted assets

## Core rule

The Item remains the source of truth.

Publishing must not require manually re-entering the watch or collectible into a separate ecommerce CMS.

Target flow:

Acquire → Identify → Service / Prepare → Value → Publish → Square checkout → Sold → Preserve history

## Phase 1 — Square Payment Links

The first working commerce layer uses Square Payment Links.

For each public item:
1. Publish the item from Calibre.
2. Set visibility to `For sale`.
3. Paste the item's Square Payment Link into the Square Buy now field.
4. Save the checkout link.
5. The public item page shows `Buy now with Square`.

Only the public checkout URL is stored by Calibre. Card details, PCI-sensitive data and payment processing remain entirely with Square.

Public commerce shape:

```js
public_data: {
  schemaVersion: 3,
  price: "395",
  currency: "AUD",
  availability: "for_sale",
  checkout: {
    provider: "square",
    url: "https://..."
  }
}
```

Checkout is displayed only when:
- publication status is `for_sale`
- provider is `square`
- checkout URL is valid HTTPS

## Phase 2 — Server-created Square checkout

When Square API credentials are connected, replace manual Payment Link entry with a secure server-side action.

Recommended flow:

Calibre Sale page → secure server/Supabase Edge Function → Square API → payment link returned → public record updated.

Rules:
- Square access tokens never enter browser JavaScript or GitHub.
- Browser sends only item ID / sale intent to the secure server function.
- The server derives the authoritative title, price and item reference from Calibre data.
- Idempotency keys prevent accidental duplicate checkout creation.

The public site does not need to change when Phase 2 arrives because it already consumes the same `public_data.checkout` contract.

## Phase 3 — Payment confirmation

Square webhook → secure endpoint → verify signature → record order/payment → mark Item sold → close/disable checkout → update Business figures → send confirmation through Resend.

Do not mark an item Sold from a browser redirect alone. The authoritative event must be a verified Square payment/webhook event.

## Storefront scope

Initial public site stays deliberately lean:
- Home
- Shop / catalogue
- Item / Watch Passport page
- About
- Guides / education later
- Contact
- Privacy / terms

A cart is not required initially. Most Calibre stock is unique, quantity-one inventory, so direct Buy now checkout is the simplest and safest first model.

## Privacy

Never publish:
- acquisition cost
- profit or margin
- private workshop notes
- customer details
- supplier/private sourcing information
- internal IDs or credentials

Only explicitly selected publication data and media may appear publicly.
