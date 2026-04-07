# Flow PRD: CEO Dashboard — Global Error States

**Flow ID:** F-16-CEO-GLOBAL
**App:** CEO Dashboard (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 1 screen | P0: 0 | P1: 1 | P2: 0

---

## 4. Screen Specifications

---

### Screen 1: CEO — Page Not Found

**Screen ID:** `ceo-global-404`
**Priority:** P1 | **Route:** `/*` (CEO subdomain catch-all)

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  #050D1A  full viewport  grid pattern bg                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PANEL CARD  max-width: 480px  centered  padding: 48px             │ │
│  │                                                                    │ │
│  │  [Lucide Crosshair — 48px  #2A4A5A]  centered  mb:20px             │ │
│  │                                                                    │ │
│  │  404                                                               │ │
│  │  STM 64px #7ECFDF opacity:0.4  centered  mb:4px                   │ │
│  │                                                                    │ │
│  │  SECTOR NOT FOUND                                                  │ │
│  │  Orbitron 18px 600 #E8F4F8  centered  mb:8px                      │ │
│  │  (Different copy from RainMachine — "SECTOR" not "SIGNAL")         │ │
│  │                                                                    │ │
│  │  This command path does not exist.                                 │ │
│  │  Inter 14px #7ECFDF  centered  mb:32px                             │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │       RETURN TO COMMAND CENTER  →                          │   │ │
│  │  │  Primary button — routes to /command-center                │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:** Identical to `rm-global-404` except:
- Heading: "SECTOR NOT FOUND" (CEO-specific terminology)
- CTA: "RETURN TO COMMAND CENTER" routes to `/command-center`
- Status bar: "MIRD COMMAND CENTER — ONLINE"
