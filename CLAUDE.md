# Arc Platform — Claude Code Context

## Project at a glance

Arc is an open-source headless WooCommerce framework (like Shopify Hydrogen, but for WooCommerce).
Weave is a visual sections editor SDK that runs on top of Arc (like Weaverse, but for WooCommerce).

- **Arc** (`@arc/core`, `@arc/next`) — open source, MIT
- **Weave** (`@weave/react`, `@weave/next`, WP plugin) — Phase 1 free, Phase 2 SaaS
- **First client site:** LOFT Pro Shop — private repo at `D:\09. LOFT Pro Shop\loft-pro-shop\`

## Folder structure

```
D:\00. Arc Platform\
├── Arc/                  Framework packages (@arc/core, @arc/next, Pilot starter)
├── Weave/                Editor packages (@weave/react, @weave/next, WP plugin, Studio)
├── Templates/            Community starter themes (Arc-Commerce, Arc-Golf)
├── Design-Systems/       Arc design tokens + component reference
├── Documentation/        PUBLIC: ADRs, architecture decisions, contributor guides
├── Scripts/              Monorepo tooling
├── Artifacts/            Generated outputs — gitignored
└── .documentation/       GITIGNORED: GSD planning, design docs, brainstorming
    ├── .planning/        GSD state (STATE.md, ROADMAP.md, phases/)
    ├── Brainstorming/    Design sessions
    └── Design-Docs/      Approved architecture specs
```

## Technology stack

- **Language:** TypeScript strict throughout
- **Package manager:** pnpm workspaces
- **Build:** tsup per package
- **Linting:** Biome
- **Testing:** Vitest
- **Framework:** Next.js 15 App Router
- **WooCommerce API:** WC Store API v1 (cart + checkout) + WPGraphQL (catalog)
- **PHP plugin:** Weave/WordPress — page config storage + REST API

## GSD workflow

- GSD state lives in `.documentation/.planning/` (gitignored — not shipped to GitHub)
- Design docs live in `.documentation/Design-Docs/`
- Public ADRs live in `Documentation/Architecture/`

Use `/gsd:new-project` to initialize `.documentation/.planning/` before first phase.

## Conventions

- **Files under 500 lines.** Split before crossing.
- **No secrets in repo.** `.env.example` only.
- **ADRs for architectural choices.** `Documentation/Architecture/ADR-*.md`
- **Read before edit.**
- **One commit, one concern.**
- **HTML for informational docs** (reports, summaries, design docs) — use `html-docs` skill.
- **Markdown for structural docs** (README, ADRs, CLAUDE.md, anything under `.documentation/.planning/`).

## Client site — LOFT Pro Shop

Private repo: `D:\09. LOFT Pro Shop\loft-pro-shop\`
Consumes Arc + Weave packages via `file:` references during development.
Switches to real npm references after Arc v0.1 is published.
