# Arc Design System

Canonical visual foundation for the Arc + Weave headless WooCommerce platform.

## Quick start

```css
@import "../../Design-Systems/Arc-Design/tokens/arc-tokens.css";
```

In Next.js App Router, import in `app/globals.css` or root layout.

## Documentation

| Path | Purpose |
|------|---------|
| `SKILL.md` | Agent entry point — read first |
| `DESIGN.md` | Design token reference |
| `tokens/arc-tokens.css` | Single source of truth for CSS variables |
| `references/` | Commerce, components, Weave sections, layout, motion |
| `screenshots/` | Visual reference (marketing baseline) |
| `fonts/` | Bundled Aeonik webfonts (no external CDN) |

## Consumers

- `Arc/Pilot` — Phase 5 canonical starter
- `Templates/Arc-Commerce`, `Templates/Arc-Golf`
- `@weave/react` section components
- LOFT Pro Shop (private repo) via same tokens
