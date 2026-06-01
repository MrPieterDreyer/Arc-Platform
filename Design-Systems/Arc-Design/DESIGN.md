# Arc Design System

> Canonical tokens for Arc Platform storefronts, Pilot, Templates, and Weave.
> **Import:** `tokens/arc-tokens.css` — do not duplicate hex values in app code.

![Arc marketing reference](screenshots/homepage.png)

---

## 1. Visual theme

Light-themed, cool, commerce-focused interface. Typography pairs **Arc Aeonik Fono** (display) with **Arc Aeonik** (body). Spacing follows a **4px grid**. Primary interactive accent is **`#0369a1`** — reserved for shop CTAs, cart badge, focus rings, and links. Motion is subtle (150–300ms, `prefers-reduced-motion` respected).

---

## 2. Color roles

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Background | `--color-background` | `#ffffff` | Page canvas |
| Surface | `--color-surface` | `#f0f6fc` | Cards, panels |
| Text primary | `--color-text-primary` | `#1a2332` | Headings, body |
| Text muted | `--color-text-muted` | `#5a6b82` | Captions, placeholders |
| Accent (commerce) | `--color-accent` | `#0369a1` | Add to cart, cart badge, focus, links |
| Accent hover | `--color-accent-hover` | `#0284c4` | Button hover |
| Brand magenta | `--color-brand-magenta` | `#ff5ca8` | Marketing emphasis only |
| Brand sky | `--color-brand-sky` | `#38bdf8` | Charts, secondary UI |
| Border | `--color-border` | `#d8e3ef` | Dividers, inputs |
| Success | `--color-success` | `#1f9d57` | In stock, confirmations |
| Warning | `--color-warning` | `#b8860b` | Low stock, pending |
| Danger | `--color-danger` | `#c61e6c` | Errors, remove actions |

**Accent reserved for:** primary CTA buttons, cart count badge (when count > 0), focus rings, inline text links.

**Not accent:** product titles, prices, nav labels, borders, sale badges (use danger/warning as appropriate).

---

## 3. Typography

| Role | Size | Weight | Line height | Font |
|------|------|--------|-------------|------|
| Display | 28px (`--text-display-size`) | 600–700 | 1.2 | `--font-display` |
| Heading | 20px | 600 | 1.2 | `--font-display` |
| Body | 16px | 400 | 1.5 | `--font-sans` |
| Label | 14px | 600 | 1.4 | `--font-sans` |
| Price | 20px | 600 | 1.2 | `--font-sans` |

Max **4 sizes** and **2 weights** (400, 600) per screen for UI chrome. Product marketing pages may use larger display type.

---

## 4. Spacing

Multiples of **4px** only: 4, 8, 12, 16, 20, 24, 32, 48, 64.

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px | Icon gaps |
| `--space-2` | 8px | Compact inline |
| `--space-4` | 16px | Default gap |
| `--space-6` | 24px | Section padding |
| `--space-8` | 32px | Page gutter |
| `--space-12` | 48px | Section breaks |

**Exception:** Primary CTA min-height **44px** for touch targets.

---

## 5. Components

See `references/COMPONENTS.md` for CSS/HTML patterns.

See `references/COMMERCE.md` for product card, PDP, cart, checkout, PLP.

See `references/WEAVE-SECTIONS.md` for section-level contracts.

---

## 6. Layout & motion

- **Container:** `--container-max` (72rem), centered
- **Breakpoints:** 640 / 768 / 1024 / 1280 / 1536px — see `references/LAYOUT.md`
- **Motion:** `--duration-fast` 150ms, `--duration-normal` 300ms — see `references/ANIMATIONS.md`
- **Elevation:** `--shadow-card` for cards and modals

---

## 7. Do's and don'ts

### Do

- Import `arc-tokens.css` once at app root
- Use semantic tokens (`var(--color-accent)`), not raw hex in components
- Match commerce copy from `references/COMMERCE.md`
- Read `SKILL.md` before any UI work

### Don't

- Use `#38bdf8` or `#ff5ca8` for primary shop CTAs
- Add colors outside the token file without updating this doc
- Use arbitrary spacing (e.g. 10px, 15px)
- Bundle external font URLs — use `fonts/` in this package

---

*Arc Design System v0.1 — light theme*
