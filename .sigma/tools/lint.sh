#!/bin/bash
# .sigma/tools/lint.sh
# ESLint + Prettier verification — must pass before marking any feature done
# Usage: .sigma/tools/lint.sh [--fix]

set -e

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

FIX_FLAG=""
if [[ "$1" == "--fix" ]]; then
  FIX_FLAG="--fix"
  echo "  Mode: auto-fix enabled"
fi

TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S)

echo ""
echo "══════════════════════════════════════════"
echo "  RainMachine — Lint Check"
echo "  $TIMESTAMP"
echo "══════════════════════════════════════════"
echo ""

echo "  → Running ESLint..."
pnpm lint $FIX_FLAG

echo ""
echo "  → Running Prettier check..."
if [[ "$FIX_FLAG" == "--fix" ]]; then
  pnpm prettier --write "**/*.{ts,tsx,js,json,md}" --ignore-path .gitignore
else
  pnpm prettier --check "**/*.{ts,tsx,js,json,md}" --ignore-path .gitignore
fi

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ Lint — PASSED"
echo "══════════════════════════════════════════"
echo ""
