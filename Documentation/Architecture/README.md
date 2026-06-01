# Architecture Decision Records

Each ADR captures one architectural decision with its context and consequences.

| ID | Status | Title |
|----|--------|-------|
| [ADR-0001](./ADR-0001-versioning-policy.md) | Accepted | Versioning policy — `0.x.y` until Customer Zero validation |
| [ADR-0002](./ADR-0002-nextjs-16-and-gutenberg-independence.md) | Accepted | Next.js 16 baseline + Weave editor independent of Gutenberg |
| [ADR-0003](./ADR-0003-permitted-runtime-licenses.md) | Accepted | Permitted runtime dependency licenses |
| [ADR-0004](./ADR-0004-cache-tag-taxonomy.md) | Accepted | Cache tag taxonomy |
| [ADR-0005](./ADR-0005-page-config-json-shape.md) | Accepted | Page-config JSON shape + schema versioning |
| [ADR-0006](./ADR-0006-cart-token-cookie.md) | Accepted | Cart-Token cookie name + scope |
| [ADR-0007](./ADR-0007-webhook-auth-mechanism.md) | Accepted | WP → Next revalidation webhook auth |
| [ADR-0008](./ADR-0008-npm-scope-decision.md) | Accepted | npm scope availability + final decision |
| [ADR-0009](./ADR-0009.md) | Open | Customer authentication strategy (spike before Phase 2) |

## Authoring a new ADR

1. Copy `ADR-template.md` → `ADR-NNNN-short-title.md` (next sequential number, kebab-case title).
2. Fill every section. Status = `Proposed` until merged.
3. Open PR; on merge, change Status to `Accepted` and update this index.
4. To supersede: new ADR with `Supersedes ADR-NNNN`; old ADR Status → `Superseded by ADR-MMMM`.
