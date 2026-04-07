---
name: rainmachine-skillpack
description: "RainMachine project skill overlay pack — all 7 domain skills bundled for portability"
version: "1.0.0"
---

# RainMachine Skillpack Plugin

A reusable overlay of all project-specific skills for the RainMachine codebase.

## Included Skills

| Skill | Trigger | Domain |
|-------|---------|--------|
| `frontend-engineer` | `/frontend-engineer` | RSC, JARVIS Dark, components |
| `backend-engineer` | `/backend-engineer` | Server Actions, Supabase, APIs |
| `database-engineer` | `/database-engineer` | Migrations, RLS, pgTAP |
| `prd-implementer` | `/prd-implementer` | PRD → code workflow |
| `ai-agent-engineer` | `/ai-agent-engineer` | Claude API, Retell AI |
| `test-engineer` | `/test-engineer` | Vitest, Playwright, pgTAP |
| `sigma-ralph` | `/sigma-ralph` | Autonomous build orchestration |

## Usage

Skills auto-trigger based on keywords in your prompt. You can also invoke explicitly:

```
/frontend-engineer build the leads table component from F08 PRD
/backend-engineer implement updateLeadStage server action
/database-engineer write migration for campaigns table with RLS
/test-engineer write Playwright tests for F07 BDD scenarios
/prd-implementer start F01 Monorepo Foundation implementation
/sigma-ralph --stream=cycle-1 --dry-run
```

## Context Engine Integration

All skills reference the context rules from Step 12:
- `.claude/rules/` → domain-specific rule files
- `CLAUDE.md` → project context always loaded
- `.cursorrules` → Cursor master router

## Updating This Pack

When a new PRD cycle introduces new patterns, update the relevant skill file.
Skills are version-controlled and changes are tracked in git.
