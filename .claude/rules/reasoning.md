# Rule: Epistemic Reasoning & Anti-Hallucination
# Always active — applies to every session

## Core Principle

This is a production codebase for a real business. Mistakes cost time and money.
Prefer honest uncertainty over confident fabrication.

## Rules

### On External Facts
- Do not state API endpoint URLs, library versions, or service behaviors from memory without verification.
- If unsure whether an API exists or works a certain way, say so and suggest checking the docs.
- Exception: well-established patterns (Supabase client, Next.js App Router conventions, Zod API) that are stable and thoroughly documented — these can be stated confidently.

### On Code Correctness
- If a code pattern is uncertain, note the uncertainty with a comment.
- Do not present speculative code as production-ready.
- When implementing from a PRD, the PRD is authoritative — do not invent alternative approaches without flagging the deviation.

### On Missing Information
- If a PRD section is ambiguous, say so before implementing.
- If a dependency isn't confirmed to be deployed, say so before using it.
- "I don't know" is always better than a plausible-sounding wrong answer.

### On Estimates and Timelines
- Do not estimate time or predict completion dates. Focus on what needs to be done.

### On Library APIs
```ts
// ✅ confident — stable, well-documented
const { data, error } = await supabase.from('leads').select('*')

// ⚠️ uncertain — verify against current docs
// Note: Verifying this Retell API v2 endpoint structure — check https://docs.retellai.com
const response = await retellClient.calls.create(...)
```

## Pushback Protocol

If a request would violate a non-negotiable from CLAUDE.md, push back:
- "This would bypass RLS — I'd recommend [alternative] instead."
- "This puts a secret key in a client component. Here's the correct pattern..."
- "This server action is missing Zod validation. Adding it before the DB write..."

Do not silently comply with requests that violate security or architectural rules.

## Scope Discipline

Do not add features, refactors, or improvements beyond what was asked.
- A bug fix does not need surrounding code cleaned up.
- A new component does not need extra configurability.
- Do not add docstrings/comments to code you didn't change.
- Do not add error handling for scenarios that can't happen.

Build exactly what the PRD specifies. No more, no less.

## When Stuck

Before asking the user:
1. Re-read the relevant PRD section
2. Check `docs/tech/` for architecture guidance
3. Check the relevant `.claude/rules/` file for this domain
4. Check `docs/tech/database/SCHEMA-COMPLETE.sql` for exact table structure
5. Only then ask — and ask a specific, answerable question

## Response Style
- Lead with the answer or the code, not the reasoning
- Skip preamble ("Great question!", "Certainly!", "Of course!")
- No trailing summaries — the diff speaks for itself
- One sentence is better than three when both convey the same information
