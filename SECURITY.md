# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `0.x` (current) | Yes |
| Pre-release / snapshot | No |

Arc Platform is in active `0.x` development per [ADR-0001](./Documentation/Architecture/ADR-0001-versioning-policy.md). Security fixes are applied to the latest release on the `master` branch.

## Reporting a vulnerability

**Private repository (current):** Use [GitHub private vulnerability reporting](https://github.com/MrPieterDreyer/arc-platform/security/advisories/new) if enabled, or contact the maintainer directly via GitHub.

**When the repository is public:** Prefer GitHub Security Advisories so we can coordinate disclosure and credit.

Please include:

- Description of the vulnerability and impact
- Steps to reproduce
- Affected packages or paths (`@arc/core`, `@arc/next`, `@weave/react`, `@weave/next`, WP plugin, etc.)
- Suggested fix if you have one

Do **not** open a public issue for undisclosed security vulnerabilities.

## Response expectations

- Acknowledgment within **5 business days**
- Status update within **14 business days**
- Fix timeline depends on severity; critical issues in published npm packages are prioritized

## npm packages

Published packages use the `@arc/*` and `@weave/*` scopes per [ADR-0008](./Documentation/Architecture/ADR-0008-npm-scope-decision.md). Verify package provenance on npm before installing in production.

## Secrets in the repository

This project never commits secrets. Only `.env.example` belongs in git. If you find credentials in history or current files, report immediately — do not exploit.
