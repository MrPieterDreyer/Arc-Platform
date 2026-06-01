# Weave section contracts

Weave renders **sections** from JSON page config stored in WordPress. Each section maps to a React component in `@weave/react` / `@weave/next`. Visual rules inherit Arc tokens; spacing uses the 4px grid.

---

## Section anatomy

```
┌─────────────────────────────────────────┐
│  Section wrapper (optional bg surface)   │
│  ┌───────────────────────────────────┐  │
│  │  Container (--container-max)       │  │
│  │  [heading] [subheading]            │  │
│  │  [content: grid | stack | media]   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

| Part | Token usage |
|------|-------------|
| Section padding | `--space-8` vertical minimum; `--space-12` between major sections |
| Heading | `--font-display`, heading size |
| Subheading | `--color-text-muted`, body size |
| Background variants | `default` (transparent), `surface` (`--color-surface`), `inset` (border top/bottom) |

---

## v0.1 section types (WP Admin sidebar)

| Section | Purpose | Layout notes |
|---------|---------|--------------|
| Hero | Above-the-fold message + CTA | Full-bleed image optional; CTA uses primary button |
| Featured products | Product grid from selection | Reuse COMMERCE product card |
| Rich text | Marketing copy | Prose width ~65ch |
| Image + text | Split 50/50 on `md+` | Stack on mobile |
| CTA banner | Single message + button | Surface background, centered |

**v0.1 excludes:** drag-and-drop layout editor, arbitrary HTML blocks, video backgrounds.

---

## Schema → UI mapping

- **Props** come from `WeaveComponentSchema` (Zod) — editors expose only schema fields
- **Defaults** must render sensibly with empty optional fields (no broken layouts)
- **Images** use `next/image` or documented aspect-ratio wrappers

---

## Editor vs storefront

| Context | Rules |
|---------|-------|
| WP Admin preview | Match storefront tokens; may use `@wordpress/components` chrome outside canvas |
| Next.js storefront | Import `arc-tokens.css`; no WP admin styles leaking in |

---

## Section spacing rhythm

| Between | Gap |
|---------|-----|
| Heading → content | `--space-4` |
| Items in grid | `--space-4` |
| Sections on page | `--space-12` |

---

## Do's and don'ts

**Do:** Keep one primary CTA per hero/CTA section. Reuse product card component for product sections.

**Don't:** Embed checkout in a section. Don't use brand magenta for section CTAs unless explicitly marketing-only (not shop path).
