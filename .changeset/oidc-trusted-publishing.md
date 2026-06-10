---
"@arc-platform/core": patch
"@arc-platform/next": patch
"@weave-platform/react": patch
"@weave-platform/next": patch
---

Publish via npm OIDC Trusted Publishing (ADR-0012): the release workflow exchanges the GitHub Actions id-token for a short-lived publish token — no stored npm secret — and npm attaches Sigstore provenance attestations automatically. This is the first attested release; 0.1.0–0.1.2 shipped unattested because provenance flag plumbing does not survive the changesets→pnpm publish path. No runtime changes.
