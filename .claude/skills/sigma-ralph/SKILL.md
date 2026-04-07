---
name: sigma-ralph
description: "Orchestrate Ralph Loop autonomous implementation for RainMachine — read backlog, spawn sessions, execute cycle by cycle"
version: "1.0.0"
triggers:
  - /sigma-ralph
  - ralph loop
  - run ralph
  - start ralph
  - execute cycle
  - autonomous build
  - spawn workers
  - ralph orchestrate
---

# Sigma-Ralph — RainMachine Project Overlay

## What Ralph Does

Ralph reads a prioritized JSON backlog (`docs/ralph/cycle-N/prd.json`), spawns AI sessions per story, and executes implementation autonomously with self-correction loops.

## Project Anchors
- `docs/ralph/cycle-1/prd.json` → Cycle 1 backlog (F01 + F02 + F03)
- `docs/implementation/BETTING-TABLE.md` → cycle order and exit gates
- `.sigma/tools/validate-feature.sh` → the gate after every story

## Skill Delegation Matrix

When Ralph executes a story, it delegates to the appropriate skill:

| Story type | Skill to invoke |
|------------|----------------|
| DB migration + RLS | `/database-engineer` |
| Server actions + API routes | `/backend-engineer` |
| UI page + components | `/frontend-engineer` |
| Tests from BDD scenarios | `/test-engineer` |
| Claude API agent | `/ai-agent-engineer` |
| Full feature from PRD | `/prd-implementer` |
| Security audit | `.claude/rules/10-security.md` |

**Ralph never implements directly without invoking the appropriate skill first.**

## Execution Pattern

```bash
# Standard cycle execution
/sigma-ralph --stream=cycle-1

# Dry run (see stories without executing)
/sigma-ralph --dry-run

# Single story
/sigma-ralph --stream=cycle-1 --story=f01-monorepo-init
```

## Story Completion Criteria

A story is `passes: true` only when `.sigma/tools/validate-feature.sh` exits 0.
No exceptions. The feature gate runs after every story.

## Backlog Location
```
docs/ralph/
├── cycle-1/prd.json    ← F01, F02, F03 stories
├── cycle-2/prd.json    ← F04, F05 stories (generated before cycle begins)
└── ...
```

## Current Active Backlog
`docs/ralph/cycle-1/prd.json`

Cycle 1 stories in priority order:
1. F01: Initialize Turborepo + pnpm monorepo
2. F01: Create 3 Next.js 15 apps (dashboard, ceo, onboarding)
3. F01: Create shared packages (ui, db, config)
4. F01: Configure turbo.json pipeline
5. F01: Setup GitHub Actions CI
6. F01: Env validation + dashboard placeholder
7. F02: JARVIS Dark Tailwind preset (tokens)
8. F02: Build all 16 UI components
9. F02: UI demo page + snapshot tests
10. F03: DB migration (12 tables + RLS + pgTAP)
11. F03: Supabase Auth + CEO 2FA
12. F03: packages/db (client factory + generated types)
13. F03: Login pages + session expiry modal
14. F03: create-tenant Edge Function
