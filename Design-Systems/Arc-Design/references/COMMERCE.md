# Commerce UI patterns

Patterns for headless WooCommerce storefronts using Arc + Weave. All styles use tokens from `../tokens/arc-tokens.css`.

---

## Product card (PLP / grid)

**Structure:** image → title → price → optional badge → CTA or link to PDP.

| Element | Spec |
|---------|------|
| Card | `background: var(--color-surface)`; `border: 1px solid var(--color-border)`; `border-radius: var(--radius-md)`; `box-shadow: var(--shadow-card)` |
| Image | Aspect ratio 1:1 or 4:5; `object-fit: cover` |
| Title | `--text-body-size`, `--font-sans`, `--color-text-primary`, max 2 lines ellipsis |
| Price | `--text-price-size`, weight 600; sale: strikethrough muted + accent/danger for sale price |
| Badge | "Sale", "New" — `--color-danger` or `--color-warning` background, small label text |
| CTA | Optional "Add to cart" on hover/desktop; mobile may navigate to PDP only |

**Grid:** `gap: var(--space-4)`; responsive columns per `LAYOUT.md`.

---

## Product detail page (PDP)

| Zone | Content |
|------|---------|
| Gallery | Primary image + thumbnails; keyboard-accessible |
| Title | Display or heading size |
| Price | Price row with compare-at if on sale |
| Variants | Select controls (size, color) — use input/select patterns from COMPONENTS |
| Quantity | Stepper or number input, min 1 |
| Primary CTA | **Add to cart** — full-width on mobile, min-height 44px |
| Secondary | Wishlist/share optional — ghost button, not accent-filled |
| Description | Body text, prose max-width ~65ch |

**States:**

| State | UI |
|-------|-----|
| Loading | Skeleton blocks or "Loading product…" |
| Adding | Button disabled, label **Adding…** |
| Success | Brief confirmation or cart drawer opens |
| Error | Inline alert: **We couldn't update your cart.** + **Try again** |
| Out of stock | Disabled CTA, muted label **Out of stock** |

---

## Cart (drawer or page)

| Element | Spec |
|---------|------|
| Line item | Thumbnail, title, variant, qty stepper, line price, remove (danger text/icon) |
| Subtotal | Label + amount, right-aligned |
| Checkout CTA | Primary accent button — **Proceed to checkout** (or WC-native flow label) |
| Empty | Illustration optional; **Your cart is empty** + link **Continue shopping** |

**Optimistic UI (`useOptimisticCart`):** show pending qty/line changes immediately; reconcile on server response; rollback on error with message above.

---

## Checkout

Checkout UI is largely **WooCommerce-hosted** in v0.1 (Store API hands off to native gateways). Arc storefront may only show:

- Order summary sidebar (read-only line items)
- Trust signals (secure checkout copy)
- Loading/error states consistent with PDP

Do not redesign WC checkout fields in v0.1 unless embedded in iframe with documented constraints.

---

## PLP / collection

- Filters: sidebar (desktop) or sheet (mobile); use surface + border tokens
- Sort: select control from COMPONENTS
- Pagination: numbered or "Load more" — not infinite scroll without loading indicator
- Breadcrumbs: muted text, `/` separators

---

## Price display

```html
<!-- Regular -->
<span class="price">R 1 299.00</span>

<!-- Sale -->
<span class="price price--sale">
  <span class="price__compare">R 1 599.00</span>
  <span class="price__current">R 1 299.00</span>
</span>
```

Use `Intl.NumberFormat` with store currency in app code; design system only defines typography/color roles.

---

## Accessibility

- Focus visible on all interactive elements (`--focus-ring`)
- Cart updates announced to screen readers (`aria-live="polite"`)
- Product images have meaningful `alt` from catalog data
- Color is not the only indicator for sale/stock (use text labels)
