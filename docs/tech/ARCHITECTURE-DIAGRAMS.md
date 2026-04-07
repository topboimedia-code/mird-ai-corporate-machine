# MIRD AI Corporate Machine — Architecture Diagrams
## Step 8 | Date: 2026-03-31

All diagrams are in Mermaid format. Render in any Mermaid-compatible viewer (GitHub, Notion, VS Code extension).

---

## Diagram Index

| # | Diagram | Type | Section |
|---|---------|------|---------|
| 1 | System Context | C4 Context | Phase A |
| 2 | Container Architecture | C4 Container | Phase B |
| 3 | Monorepo Package Graph | Dependency graph | Phase B |
| 4 | Auth Flow — RainMachine | Sequence | Phase B |
| 5 | Auth Flow — CEO Dashboard (2FA) | Sequence | Phase B |
| 6 | Lead Ingestion Flow | Sequence | Phase B |
| 7 | Claude Agent Cron Flow | Sequence | Phase B |
| 8 | Onboarding Provisioning Flow | Sequence | Phase B |
| 9 | Supabase Realtime Update Flow | Sequence | Phase B |
| 10 | ERD — All Entities | Entity-Relationship | Phase D |

---

## Diagram 1 — System Context (C4 Level 1)

See `/docs/tech/TECHNICAL-SPEC.md` Section 1.5.

---

## Diagram 2 — Container Architecture (C4 Level 2)

```mermaid
C4Container
    title MIRD AI Corporate Machine — Container Architecture

    Person(shomari, "Shomari", "MIRD founder/CEO")
    Person(client, "Client + Agents", "RainMachine users")
    Person(newClient, "New Client", "Onboarding token holder")

    Container_Boundary(monorepo, "Turborepo Monorepo (mird-ai-corporate-machine)") {
        Container(dashboard, "RainMachine Dashboard", "Next.js 15, App Router", "Client CRM — leads, campaigns, agents, reports, settings")
        Container(ceo, "CEO Dashboard", "Next.js 15, App Router", "Internal ops — KPIs, Claude outputs, client health, P&L")
        Container(ob, "Onboarding Portal", "Next.js 15, App Router", "5-step new-client wizard — token auth, ad account connections")
        Container(pkgUI, "packages/ui", "React + Tailwind v4", "Shared JARVIS Dark component library — 13 components")
        Container(pkgTypes, "packages/types", "TypeScript", "Shared domain types, Zod schemas, Result<T,E> pattern")
        Container(pkgAPIClient, "packages/api-client", "TypeScript", "Typed wrappers for Supabase queries and Edge Function calls")
        Container(pkgTokens, "packages/design-tokens", "CSS + TS", "JARVIS Dark v1.0 design tokens as Tailwind config + CSS vars")
    }

    Container_Boundary(supabaseCloud, "Supabase Cloud") {
        ContainerDb(db, "PostgreSQL 16", "Supabase", "Multi-tenant database — all MIRD application data with RLS")
        Container(auth, "Supabase Auth", "Supabase", "JWT-based auth — email/password, magic link, session management")
        Container(realtime, "Supabase Realtime", "Supabase", "Live metric updates pushed to dashboard clients")
        Container(storage, "Supabase Storage", "Supabase", "File uploads — onboarding assets, report exports, creative files")
        Container(edgeFn, "Edge Functions", "Deno", "Webhook receivers (GHL, Meta, Google), server-side secrets, heavy crypto")
    }

    Container_Ext(ghl, "GoHighLevel", "SaaS CRM", "Contact/pipeline SoT — sub-accounts per client, automations, native voice agent")
    Container_Ext(n8n, "n8n", "Automation", "Cross-system orchestration: GHL → Retell → Supabase → Slack")
    Container_Ext(retell, "Retell AI", "Voice AI SaaS", "Automated voice calls — new leads and cold outbound")
    Container_Ext(claudeAPI, "Anthropic Claude API", "AI SaaS", "claude-sonnet-4-6 — powers all 4 internal department agents")
    Container_Ext(metaAPI, "Meta Marketing API", "Ad Platform API", "Campaign spend, CPL, creative performance insights")
    Container_Ext(googleAPI, "Google Ads API + GMB", "Ad Platform API", "Google campaign data, Customer Match, Business Profile")
    Container_Ext(slack, "Slack", "Messaging", "CEO notifications — #mird-alerts, #ceo-loop channels")
    Container_Ext(apollo, "Apollo.io", "Sales Intel SaaS", "Prospect database for outbound sequences")
    Container_Ext(vercel, "Vercel", "Hosting", "3 separate Next.js projects — custom domain per app, preview branches")
    Container_Ext(redis, "Upstash Redis", "Cache/Rate Limit", "Rate limiting for API routes and onboarding token validation")

    Rel(client, dashboard, "HTTPS", "browser")
    Rel(shomari, ceo, "HTTPS", "browser")
    Rel(newClient, ob, "HTTPS", "browser + token URL")

    Rel(dashboard, auth, "Auth session", "JWT")
    Rel(ceo, auth, "Auth session + 2FA", "JWT")
    Rel(ob, auth, "Token validation", "custom token")

    Rel(dashboard, db, "Server actions + queries", "Supabase client")
    Rel(ceo, db, "Server actions + queries", "Supabase client")
    Rel(ob, db, "Server actions + writes", "Supabase client")

    Rel(dashboard, realtime, "Subscribe to org channel", "WebSocket")
    Rel(ceo, realtime, "Subscribe to all-org channel", "WebSocket")

    Rel(dashboard, storage, "Upload/download files", "Supabase Storage API")
    Rel(ob, storage, "Upload onboarding assets", "Supabase Storage API")

    Rel(edgeFn, db, "Webhook data writes", "Supabase admin client")
    Rel(ghl, edgeFn, "Contact/pipeline webhooks", "HTTPS POST")
    Rel(metaAPI, edgeFn, "Ad performance webhook", "HTTPS POST")

    Rel(n8n, edgeFn, "Trigger provisioning", "HTTPS POST")
    Rel(n8n, retell, "Trigger voice call", "HTTPS POST")
    Rel(n8n, slack, "Send alerts", "Slack API")
    Rel(n8n, db, "Write synced data", "Supabase REST API")
    Rel(ghl, n8n, "GHL webhook", "HTTPS POST")

    Rel(claudeAPI, db, "Read aggregated data, write reports", "Supabase REST API (server)")
    Rel(claudeAPI, apollo, "Search prospects", "Apollo API")
    Rel(claudeAPI, slack, "Post agent outputs", "Slack API")

    Rel(dashboard, vercel, "Deployed on", "")
    Rel(ceo, vercel, "Deployed on", "")
    Rel(ob, vercel, "Deployed on", "")
```

---

## Diagram 3 — Monorepo Package Dependency Graph

```mermaid
graph TD
    subgraph apps["apps/"]
        RM[dashboard<br/>RainMachine]
        CEO[ceo-dashboard<br/>CEO Dashboard]
        OB[onboarding<br/>Onboarding Portal]
    end

    subgraph packages["packages/"]
        UI[ui<br/>JARVIS Dark Components]
        TYPES[types<br/>Domain Types + Zod Schemas]
        API[api-client<br/>Supabase Query Wrappers]
        TOKENS[design-tokens<br/>Tailwind Config + CSS Vars]
        AI[ai-agents<br/>Claude Dept Agent Runners]
    end

    RM --> UI
    RM --> TYPES
    RM --> API
    RM --> TOKENS

    CEO --> UI
    CEO --> TYPES
    CEO --> API
    CEO --> TOKENS

    OB --> UI
    OB --> TYPES
    OB --> API
    OB --> TOKENS

    UI --> TOKENS
    API --> TYPES
    AI --> TYPES

    style apps fill:#0A1628,stroke:#00D4FF,color:#E8F4F8
    style packages fill:#0D1E35,stroke:#00D4FF,color:#E8F4F8
```

---

## Diagram 4 — Auth Flow: RainMachine (Email/Password)

```mermaid
sequenceDiagram
    actor User as Client / Agent
    participant App as RainMachine (Next.js)
    participant SA as Server Action
    participant SupAuth as Supabase Auth
    participant DB as Supabase DB (RLS)

    User->>App: POST /login (email, password)
    App->>SA: loginAction(email, password)
    SA->>SA: Zod validate inputs
    SA->>SupAuth: signInWithPassword({ email, password })
    alt Credentials valid
        SupAuth-->>SA: { session, user }
        SA->>DB: SELECT organization_id FROM users WHERE id = user.id
        DB-->>SA: { organization_id, role }
        SA-->>App: Result.ok({ session, organizationId, role })
        App->>App: Set session cookie (HttpOnly, Secure)
        App-->>User: Redirect to /dashboard
    else Invalid credentials
        SupAuth-->>SA: AuthError
        SA-->>App: Result.err({ code: "INVALID_CREDENTIALS" })
        App-->>User: Render SYSTEM ALERT state — "Authentication failed"
    end

    Note over App,DB: All subsequent requests include session cookie.<br/>Supabase RLS enforces organization_id scoping on every query.
```

---

## Diagram 5 — Auth Flow: CEO Dashboard (Email + 2FA TOTP)

```mermaid
sequenceDiagram
    actor Shomari
    participant App as CEO Dashboard (Next.js)
    participant SA as Server Action
    participant SupAuth as Supabase Auth
    participant TOTP as TOTP Validator (server-side)
    participant DB as Supabase DB

    Shomari->>App: POST /login (email, password)
    App->>SA: ceoLoginAction(email, password)
    SA->>SupAuth: signInWithPassword({ email, password })
    SupAuth-->>SA: { session (partial — MFA pending), user }
    SA-->>App: Result.ok({ requiresMFA: true })
    App-->>Shomari: Render 2FA OTP input screen

    Shomari->>App: POST /login/verify (otp: "123456")
    App->>SA: ceoVerifyMFAAction(otp, sessionToken)
    SA->>TOTP: verifyTOTP(otp, secret)
    alt OTP valid
        TOTP-->>SA: valid
        SA->>SupAuth: mfa.challengeAndVerify({ factorId, code })
        SupAuth-->>SA: { session (full) }
        SA-->>App: Result.ok({ session })
        App->>App: Set full session cookie
        App-->>Shomari: Redirect to /command-center
    else OTP invalid / expired
        TOTP-->>SA: invalid
        SA-->>App: Result.err({ code: "INVALID_OTP", attemptsRemaining: 2 })
        App-->>Shomari: Render error state — "VERIFICATION FAILED"
    end
```

---

## Diagram 6 — Lead Ingestion Flow (Meta/Google Ad → RainMachine)

```mermaid
sequenceDiagram
    participant Prospect
    participant MetaAd as Meta/Google Ad
    participant GHL as GoHighLevel
    participant GHLWebhook as GHL Webhook
    participant n8n as n8n Automation
    participant Retell as Retell AI
    participant SupEdge as Supabase Edge Function
    participant DB as Supabase DB
    participant RM as RainMachine Realtime

    Prospect->>MetaAd: Submits lead form
    MetaAd->>GHL: Lead created in GHL sub-account (via Meta native integration)
    GHL->>GHLWebhook: contact.created event
    GHLWebhook->>n8n: POST /webhook/ghl-contact-created

    par Lead Router Workflow
        n8n->>DB: Upsert lead record (leads table)
        n8n->>DB: Set initial pipeline stage = "NEW"
    and Retell AI Trigger Workflow
        n8n->>Retell: POST /v2/create-phone-call { to: prospect.phone, agent_id, metadata }
        Retell-->>n8n: { call_id }
        n8n->>DB: INSERT ai_calls record (status: "INITIATED")
    end

    Retell->>Prospect: AI voice call (within 60 seconds of form submission)

    Note over Retell,DB: Call completes — disposition determined
    Retell->>SupEdge: POST /functions/retell-webhook (call_ended payload)
    SupEdge->>DB: UPDATE ai_calls SET status, disposition, transcript, duration
    SupEdge->>DB: UPDATE leads SET stage = disposition_to_stage(disposition)
    SupEdge->>DB: Notify realtime channel

    DB->>RM: Realtime push → leads table change
    RM-->>Client: Live lead list updates without page refresh
```

---

## Diagram 7 — Claude AI Department Agent Cron Flow

```mermaid
sequenceDiagram
    participant Cron as Vercel Cron / GitHub Actions
    participant Runner as Agent Runner (packages/ai-agents)
    participant DB as Supabase DB
    participant Claude as Anthropic Claude API
    participant Ext as External APIs (Apollo/Meta/Google)
    participant Slack as Slack

    Cron->>Runner: Trigger dept agent (e.g., DEPT-2 Ad Ops — daily 7AM)
    Runner->>DB: Fetch aggregated data (last 24h campaigns, CPL, spend)
    DB-->>Runner: { campaigns[], metrics[], alerts[] }

    opt External data needed
        Runner->>Ext: Fetch fresh Meta/Google data
        Ext-->>Runner: { impressions, clicks, spend, conversions }
    end

    Runner->>Runner: Build structured prompt with data context
    Runner->>Claude: POST /v1/messages (model: claude-sonnet-4-6, structured prompt)
    Claude-->>Runner: { analysis, recommendations, alerts[], action_items[] }

    Runner->>Runner: Validate response structure (Zod schema)

    alt Valid structured output
        Runner->>DB: INSERT INTO reports (org_id: MIRD, dept, content, generated_at)
        Runner->>DB: INSERT INTO agent_performance (agent, run_at, status: "SUCCESS", tokens_used)
        Runner->>Slack: POST #ceo-loop { dept_summary, top_alert, action_items }
    else Malformed output / API error
        Runner->>DB: INSERT INTO agent_performance (status: "FAILED", error)
        Runner->>Slack: POST #mird-alerts { alert: "DEPT-2 agent run failed", error }
    end

    Note over Runner,Slack: CEO Dashboard polls reports table.<br/>New report triggers Realtime push to CEO dashboard.
```

---

## Diagram 8 — Onboarding Provisioning Flow

```mermaid
sequenceDiagram
    actor NewClient as New Client
    participant OB as Onboarding Portal
    participant SA as Server Actions
    participant DB as Supabase DB
    participant SupEdge as Supabase Edge Function
    participant GHL as GoHighLevel
    participant n8n as n8n Provisioner Workflow
    participant MetaAPI as Meta Ads API
    participant GoogleAPI as Google Ads API

    Note over NewClient,OB: Client receives token URL: setup.makeitrain.digital/?token=uuid

    NewClient->>OB: Load /?token=uuid
    OB->>SA: validateTokenAction(token)
    SA->>DB: SELECT * FROM onboarding_sessions WHERE token = ? AND expires_at > NOW()
    DB-->>SA: session record
    SA-->>OB: Result.ok({ session, clientName, step: resumeStep })
    OB-->>NewClient: Render wizard at correct step (resume support)

    NewClient->>OB: Complete Step 2 (mission parameters)
    OB->>SA: saveStep2Action(formData)
    SA->>SA: Zod validate all fields
    SA->>DB: UPDATE onboarding_sessions SET step2_data, current_step = 3
    SA-->>OB: Result.ok()

    NewClient->>OB: Complete Step 3 (Meta Ads token)
    OB->>SA: verifyMetaTokenAction(token)
    SA->>MetaAPI: GET /me?access_token=token (verify System User)
    MetaAPI-->>SA: { id, name, ad_accounts[] }
    SA->>DB: UPDATE onboarding_sessions SET meta_token (encrypted), meta_verified = true
    SA-->>OB: Result.ok({ adAccounts })

    NewClient->>OB: Complete Step 4 (Google Ads)
    OB->>SA: initiateGoogleOAuthAction()
    SA-->>OB: Google OAuth URL
    NewClient->>GoogleAPI: OAuth consent
    GoogleAPI->>SupEdge: POST /functions/google-oauth-callback (code)
    SupEdge->>GoogleAPI: Exchange code for tokens
    SupEdge->>DB: Store encrypted refresh_token, customer_id

    NewClient->>OB: Complete Step 5 + Submit
    OB->>SA: submitOnboardingAction(sessionId)
    SA->>DB: UPDATE onboarding_sessions SET completed_at, status = "COMPLETE"
    SA->>n8n: POST /webhook/onboarding-complete { session_id }

    par GHL Provisioning
        n8n->>GHL: Create sub-account for client
        GHL-->>n8n: { sub_account_id }
        n8n->>DB: UPDATE organizations SET ghl_sub_account_id
    and Supabase Org Setup
        n8n->>SupEdge: POST /functions/provision-org { session_id }
        SupEdge->>DB: INSERT organizations, INSERT ghl_accounts, INSERT ad_accounts
        SupEdge->>DB: Seed initial agents from step2_data
    end

    OB-->>NewClient: Render completion screen — "RAINMACHINE INITIALIZING"
    Note over NewClient: Redirect to app.makeitrain.digital/dashboard after 5s
```

---

## Diagram 9 — Supabase Realtime Dashboard Update Flow

```mermaid
sequenceDiagram
    participant Agent as Sales Agent (in GHL)
    participant GHL
    participant n8n
    participant DB as Supabase DB
    participant Realtime as Supabase Realtime
    participant RM as RainMachine Client (browser)

    Note over RM,Realtime: On dashboard mount — subscribe to org channel
    RM->>Realtime: SUBSCRIBE to channel "org:{organization_id}:leads"

    Agent->>GHL: Moves lead to "Appointment Set" stage
    GHL->>n8n: pipeline_stage_updated webhook
    n8n->>DB: UPDATE leads SET stage = "APPOINTMENT_SET", updated_at = NOW()
    DB->>Realtime: Row change detected on leads table
    Realtime->>RM: Push { event: "UPDATE", table: "leads", new: { stage, id } }
    RM->>RM: TanStack Query invalidate(["leads", orgId])
    RM-->>Client: Lead card stage badge updates live — no page refresh
```

---

*All diagrams current as of Step 8 | 2026-03-31*
