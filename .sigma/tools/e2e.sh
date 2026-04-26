#!/bin/bash
# .sigma/tools/e2e.sh
# Playwright E2E tests — run after dev server is up
# Usage: .sigma/tools/e2e.sh [--app=dashboard|ceo|onboarding] [--headed]

set -e

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

APP="dashboard"
HEADED=""

for arg in "$@"; do
  case $arg in
    --app=*)   APP="${arg#*=}" ;;
    --headed)  HEADED="--headed" ;;
  esac
done

TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S)

echo ""
echo "══════════════════════════════════════════"
echo "  RainMachine — Playwright E2E Tests"
echo "  App: $APP"
echo "  $TIMESTAMP"
echo "══════════════════════════════════════════"
echo ""
echo "  ⚠️  Ensure dev server is running:"
echo "     pnpm dev --filter=$APP"
echo ""

cd "apps/$APP"
pnpm exec playwright test $HEADED

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ E2E — PASSED"
echo "══════════════════════════════════════════"
echo ""
