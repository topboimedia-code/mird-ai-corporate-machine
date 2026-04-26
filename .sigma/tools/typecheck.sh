#!/bin/bash
# .sigma/tools/typecheck.sh
# TypeScript verification — must pass with 0 errors before marking any feature done
# Usage: .sigma/tools/typecheck.sh [--filter=dashboard]

set -e

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

FILTER="${1}"
TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S)

echo ""
echo "══════════════════════════════════════════"
echo "  RainMachine — TypeScript Check"
echo "  $TIMESTAMP"
echo "══════════════════════════════════════════"

if [ -n "$FILTER" ]; then
  echo "  Scope: $FILTER"
  echo ""
  pnpm typecheck "$FILTER"
else
  echo "  Scope: all packages"
  echo ""
  pnpm typecheck
fi

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ TypeScript — PASSED"
echo "══════════════════════════════════════════"
echo ""
