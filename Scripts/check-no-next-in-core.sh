#!/usr/bin/env bash
# TOOL-08: fail if @arc-platform/core or @weave-platform/react import from next/*
# Source: ripgrep recommended for cross-platform; fall back to grep on POSIX
set -euo pipefail

PATTERN="from ['\"]next(/|['\"])"
TARGETS=(Arc/Core/src Weave/React/src)

found=0
for dir in "${TARGETS[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo "[no-next-in-core] skip missing dir $dir"
    continue
  fi
  # -E extended regex; --include limits to TS/TSX; exclude test fixtures intentionally
  if grep -REn --include='*.ts' --include='*.tsx' \
       --exclude-dir='__fixtures__' \
       "$PATTERN" "$dir"; then
    echo "::error::[no-next-in-core] FORBIDDEN next/* import in $dir (see above)"
    found=1
  fi
done

# Also catch bare-specifier imports without 'from' (rare, but possible: `import "next/foo"`)
for dir in "${TARGETS[@]}"; do
  if [[ ! -d "$dir" ]]; then continue; fi
  if grep -REn --include='*.ts' --include='*.tsx' \
       --exclude-dir='__fixtures__' \
       "import ['\"]next(/|['\"])" "$dir"; then
    echo "::error::[no-next-in-core] FORBIDDEN bare next/* import in $dir"
    found=1
  fi
done

exit "$found"
