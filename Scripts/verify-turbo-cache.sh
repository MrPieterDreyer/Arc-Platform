#!/usr/bin/env bash
# TOOL-05 contract: second `pnpm build` invocation reports FULL TURBO (all cached)
# Source: .planning/phases/00-tooling-foundations/00-RESEARCH.md (Validation Architecture)
set -euo pipefail

COLD_LOG=$(mktemp)
WARM_LOG=$(mktemp)

cleanup() {
  rm -f "$COLD_LOG" "$WARM_LOG"
}
trap cleanup EXIT

echo "[verify-turbo-cache] Cold build (cache may or may not exist)..."
pnpm build > "$COLD_LOG" 2>&1 || { echo "[verify-turbo-cache] FAIL — cold build failed"; cat "$COLD_LOG"; exit 1; }

echo "[verify-turbo-cache] Warm build (must be fully cached)..."
pnpm build > "$WARM_LOG" 2>&1 || { echo "[verify-turbo-cache] FAIL — warm build failed"; cat "$WARM_LOG"; exit 1; }

# On a full cache hit, turbo prints "FULL TURBO" or per-task ">>> FULL TURBO" or
# a summary line like "4 cached, 4 total". Accept any of these signals.
if grep -qE "(FULL TURBO|[0-9]+ cached, [0-9]+ total)" "$WARM_LOG"; then
  CACHED_LINE=$(grep -E "[0-9]+ cached, [0-9]+ total" "$WARM_LOG" | head -1 || true)
  echo "[verify-turbo-cache] OK — warm build hit cache: ${CACHED_LINE}"
  exit 0
fi

echo "[verify-turbo-cache] FAIL — second build did not report cache hit"
echo "---- warm build log ----"
cat "$WARM_LOG"
echo "------------------------"
exit 1
