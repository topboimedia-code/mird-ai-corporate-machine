#!/bin/bash
# .sigma/tools/validate-feature.sh
# Full feature validation gate — runs all 5 checks in sequence
# A feature is NOT done until this script exits 0
# Usage: .sigma/tools/validate-feature.sh [--filter=dashboard]

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TOOLS="$ROOT/.sigma/tools"
FILTER="${1}"

TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S)
PASS=0
FAIL=0
ERRORS=()

run_check() {
  local name="$1"
  local cmd="$2"
  echo "  → $name..."
  if eval "$cmd" > /dev/null 2>&1; then
    echo "    ✅ $name passed"
    PASS=$((PASS + 1))
  else
    echo "    ❌ $name FAILED"
    FAIL=$((FAIL + 1))
    ERRORS+=("$name")
  fi
}

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   RainMachine — Feature Validation Gate  ║"
echo "║   $TIMESTAMP         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

run_check "TypeScript"  "bash $TOOLS/typecheck.sh $FILTER"
run_check "Lint"        "bash $TOOLS/lint.sh"
run_check "Unit Tests"  "bash $TOOLS/test.sh $FILTER"
run_check "Build"       "bash $TOOLS/build.sh $FILTER"

echo ""
echo "══════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "  ❌ FAILED checks:"
  for err in "${ERRORS[@]}"; do
    echo "     - $err"
  done
  echo ""
  echo "  Feature is NOT done. Fix failures above."
  echo "══════════════════════════════════════════"
  echo ""
  exit 1
else
  echo ""
  echo "  ✅ ALL CHECKS PASSED"
  echo "  Run E2E tests separately: .sigma/tools/e2e.sh"
  echo "  Then verify OWASP checklist in the PRD."
  echo "══════════════════════════════════════════"
  echo ""
  exit 0
fi
