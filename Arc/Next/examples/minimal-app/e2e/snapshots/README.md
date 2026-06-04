# Visual regression baselines (Wave 9)

Platform-specific PNGs live here (`win32/` on Windows, `linux/` in GitHub Actions). Generated via:

```bash
pnpm wp:setup
pnpm --filter @arc/next-example build
pnpm test:e2e:update-snapshots
```

Commit updated snapshots only with intentional design changes. CI job `e2e-visual` compares against these files on PRs that touch `Design-Systems/**` or `**/e2e/**`.

**Linux baselines for CI:** run [`.github/workflows/e2e-update-linux-snapshots.yml`](../../../../../../.github/workflows/e2e-update-linux-snapshots.yml) (`workflow_dispatch`), download the artifact, and commit PNGs under `linux/`.

Multi-browser baselines (Firefox/WebKit) are deferred — Chromium only for v0.1.
