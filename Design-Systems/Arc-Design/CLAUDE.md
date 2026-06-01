# Arc Design System

All Arc Platform UI — Pilot, Templates, Weave sections, and reference examples — uses this design system.

## How to use

1. Read `SKILL.md` before writing any CSS or JSX.
2. Import tokens: `Design-Systems/Arc-Design/tokens/arc-tokens.css`
3. Use reference docs for specific surfaces:

| File | Use for |
|------|---------|
| `DESIGN.md` | Token summary and philosophy |
| `references/COMPONENTS.md` | Card, button, input, nav, badge |
| `references/COMMERCE.md` | PDP, cart, checkout, PLP, pricing |
| `references/WEAVE-SECTIONS.md` | Weave section visual contracts |
| `references/ANIMATIONS.md` | Motion tokens |
| `references/LAYOUT.md` | Grid, container, breakpoints |

## Rules

- **Primary commerce accent:** `#0369a1` — CTAs, cart badge, focus rings, text links only.
- **Brand secondary:** `#ff5ca8`, `#38bdf8` — marketing emphasis and charts, not primary shop CTAs.
- **v0.1:** Light theme only. Do not invent colors outside `arc-tokens.css`.
