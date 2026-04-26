#!/bin/bash
# .sigma/tools/test.sh
# Vitest unit + integration tests — must pass before marking any feature done
# Usage: .sigma/tools/test.sh [--coverage] [--filter=dashboard]

set -e

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COVERAGE=""
FILTER=""

for arg in "$@"; do
  case $arg in
    --coverage) COVERAGE="--coverage" ;;
    --filter=*) FILTER="${arg#*=}" ;;
  esac
done

TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S)

echo ""
echo "══════════════════════════════════════════"
echo "  RainMachine — Unit + Integration Tests"
echo "  $TIMESTAMP"
echo "══════════════════════════════════════════"

if [ -n "$FILTER" ]; then
  echo "  Scope: $FILTER"
  echo ""
  pnpm test --filter="$FILTER" $COVERAGE
else
  echo "  Scope: all packages"
  echo ""
  pnpm test $COVERAGE
fi

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ Tests — PASSED"
echo "══════════════════════════════════════════"
echo ""
