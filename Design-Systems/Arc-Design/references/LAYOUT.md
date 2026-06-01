# Layout

---

## Container

```css
.container {
  width: 100%;
  max-width: var(--container-max); /* 72rem */
  margin-inline: auto;
  padding-inline: var(--space-4);
}
@media (min-width: 768px) {
  .container { padding-inline: var(--space-8); }
}
```

---

## Breakpoints

| Name | Min width | Typical use |
|------|-----------|-------------|
| sm | 640px | 2-column product grid |
| md | 768px | Nav expand, side-by-side PDP |
| lg | 1024px | 3–4 column PLP, cart drawer width |
| xl | 1280px | Max content width within container |
| 2xl | 1536px | Rare; marketing hero only |

Use CSS `@media (min-width: …)` matching tokens if defined in `arc-tokens.css`, or standard Tailwind breakpoints when using Tailwind in Pilot.

---

## Product grid

| Breakpoint | Columns |
|------------|---------|
| default | 2 |
| sm | 2 |
| md | 3 |
| lg | 4 |

`gap: var(--space-4)`.

---

## PDP layout

| Breakpoint | Layout |
|------------|--------|
| &lt; md | Stack: gallery → info → description |
| md+ | Two columns: gallery ~55%, buy box ~45% |

---

## Cart drawer

| Property | Value |
|----------|-------|
| Width | `min(100vw, 420px)` |
| Position | fixed right, full height |
| z-index | above nav, below modals if stacked |

---

## Header

- Logo left; nav center or left; cart/account right
- Sticky optional; use `background` + subtle `border-bottom` on scroll
- Mobile: hamburger → full-height sheet or dropdown

---

## Footer

- Surface background optional
- Link columns on `md+`; stack on mobile
- `--space-12` padding top/bottom
