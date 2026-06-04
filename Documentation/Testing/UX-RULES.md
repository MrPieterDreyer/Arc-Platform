# E2E UX & design rules (automated)

Agents and Playwright helpers enforce these **rule-based** checks. Source of truth: `Design-Systems/Arc-Design/`.

---

## Design tokens (computed styles)

| Rule ID | Assertion | Selector / context |
|---------|-----------|-------------------|
| `DESIGN-ACCENT-CTA` | Primary shop CTA `background-color` resolves to `rgb(3, 105, 161)` or `var(--btn-primary-bg)` chain ending at `#0369a1` | `[data-testid="add-to-cart"]`, `.arc-btn-primary`, checkout submit |
| `DESIGN-CTA-TEXT` | Primary CTA text color is white (`#ffffff` / `var(--btn-primary-fg)`) | Same as above |
| `DESIGN-BODY-TEXT` | Body copy uses `--color-text-primary` (`#1a2332`) not pure black `#000` | `main` paragraph sample |
| `DESIGN-FOCUS` | Focus visible ring uses accent hue | Tab through first interactive on page |
| `DESIGN-SPACE-GRID` | Critical spacing values are multiples of 4px | Card padding, grid gap (sample 3 nodes) |

**Implementation:** `Scripts/e2e-shared/design-assertions.ts` — read computed styles via `page.evaluate`.

---

## Commerce UX (behavior + copy)

| Rule ID | Assertion | Reference |
|---------|-----------|-----------|
| `UX-PDP-LOADING` | PDP shows loading or skeleton before product title | COMMERCE.md PDP states |
| `UX-PDP-ERROR` | Invalid slug → not found message, not blank page | |
| `UX-CART-OPTIMISTIC` | Cart count updates before network settles; reverts on forced failure | ARC-NEXT-07 |
| `UX-CART-ERROR-COPY` | Failed add shows human copy (contains "cart" / "try again"), not raw API error | COMMERCE.md |
| `UX-CART-EMPTY` | Empty cart state has continue-shopping path | |
| `UX-CHECKOUT-PRIMARY` | Single obvious primary action on checkout | |
| `UX-OOS` | Out-of-stock product disables add CTA | |

---

## Accessibility (axe + manual)

| Rule ID | Assertion | Tool |
|---------|-----------|------|
| `A11Y-NO-CRITICAL` | axe-core: zero **critical** violations | `@axe-core/playwright` |
| `A11Y-FOCUS-ORDER` | Tab order reaches cart control before footer | keyboard script |
| `A11Y-IMAGE-ALT` | PLP/PDP product images have non-empty `alt` | axe / DOM |
| `A11Y-FORM-LABELS` | Checkout fields have associated labels | axe |
| `A11Y-REDUCED-MOTION` | With `prefers-reduced-motion: reduce`, no infinite CSS animations | `emulateMedia` |

---

## Forbidden patterns (auto-fail)

| Rule ID | Condition |
|---------|-----------|
| `FORBID-RAW-ERROR` | Visible text matches `/woocommerce_rest_|rest_cookie_invalid|GraphQL error/i` |
| `FORBID-HYDRATION` | Console error containing `Hydration failed` or `Text content does not match` |
| `FORBID-UNSAFE-LINK` | `target="_blank"` without `rel` containing `noopener` |
| `FORBID-ACCENT-MISUSE` | Marketing magenta `#ff5ca8` used on primary checkout/add-to-cart button |
| `FORBID-MISSING-FOCUS` | Interactive control with `outline: none` and no substitute focus style |
| `FORBID-BROKEN-WEAVE` | Full-page white screen when one section invalid (must show section error UI) |

---

## LLM review pass (on failure only)

When a rule fails, attach to the agent report:

- Full-page screenshot path
- axe violation JSON (if applicable)
- 5-line DOM summary (landmarks, h1, primary CTA text)
- Prompt fragment: *"Given Arc Design COMMERCE.md, list up to 3 concrete UI/UX fixes with file hints."*

Do **not** run LLM on every test — only on failure or nightly sample (max 10 cases).
