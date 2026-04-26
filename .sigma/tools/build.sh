#!/bin/bash
# .sigma/tools/build.sh
# Turborepo production build — must succeed before marking any feature done
# Usage: .sigma/tools/build.sh [--filter=dashboard]

set -e

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

FILTER="${1}"
TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S)

echo ""
echo "══════════════════════════════════════════"
echo "  RainMachine — Production Build"
echo "  $TIMESTAMP"
echo "══════════════════════════════════════════"

if [ -n "$FILTER" ]; then
  echo "  Scope: $FILTER"
  echo ""
  pnpm build --filter="$FILTER"
else
  echo "  Scope: all apps"
  echo ""
  pnpm build
fi

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ Build — PASSED"
echo "══════════════════════════════════════════"
echo ""
