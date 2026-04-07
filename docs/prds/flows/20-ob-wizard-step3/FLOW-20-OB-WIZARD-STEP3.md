# Flow PRD: Onboarding Portal — Wizard Step 3 (Meta Ads Integration)

**Flow ID:** F-20-OB-WIZARD-STEP3
**App:** Onboarding Portal (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 6 screens | P0: 4 | P1: 2 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | `ob-wizard-step2-main` (SAVE & CONTINUE) |
| **Exit Points** | `ob-wizard-step4-main` (after Meta connected or skipped) |
| **Purpose** | Guide client through Meta Ads API token submission — 3 sub-steps |
| **Dependencies** | Meta Ads API token validation endpoint, token storage |

---

## 1A. UI Profile Note

This is the most complex onboarding step. The 3-sub-step Meta setup uses a secondary progress indicator within the step panel (not the main 5-step indicator). The verification animation is the highest-stakes moment in the entire onboarding flow.

---

## 4. Screen Specifications

---

### Screen 1: Step 3 — Meta Ads Integration (Main)

**Screen ID:** `ob-wizard-step3-main`
**Priority:** P0 | **Route:** `/setup/step-3`
**Complexity:** Complex | **Animation:** Complex

**Emotion Target:**
- 0–2s: "This is guiding me through Meta Ads connection. The steps are clear."
- 2–10s: "I know exactly which screen to open in Meta, what to copy, where to paste."
- 10s+: "I feel confident doing this. If I get stuck, help is one click away."

**Wireframe:**
```
[Wizard layout — Step 3 active]

│  META ADS INTEGRATION                                                   │
│  Orbitron 18px 600 #E8F4F8  mb:4px                                      │
│  STEP 3 OF 5                                                            │
│  STM 11px #7ECFDF  mb:24px                                              │
│  border-bottom rgba(0,212,255,0.1)  pb:24px                             │
│                                                                         │
│  SUB-STEP PROGRESS:  ①────②────③                                       │
│  active / upcoming / upcoming                                           │
│  24px circles  STM 10px labels below each: GET TOKEN / PASTE / VERIFY  │
│                                              mb:24px                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  SUB-STEP 1 PANEL  bg: rgba(0,212,255,0.04)  border rgba cyan    │  │
│  │  border: 1px solid rgba(0,212,255,0.2)  r:4px  padding: 20px     │  │
│  │                                                                  │  │
│  │  STEP 1: GENERATE YOUR META ACCESS TOKEN                        │  │
│  │  Orbitron 13px 600 #00D4FF  mb:8px                               │  │
│  │                                                                  │  │
│  │  1. Open Meta Business Suite → Settings → System Users           │  │
│  │  2. Create a System User or select existing                      │  │
│  │  3. Click "Generate Token" → select your Ad Account              │  │
│  │  4. Copy the generated token                                     │  │
│  │  Inter 14px #E8F4F8  line-height 1.7  mb:16px                   │  │
│  │                                                                  │  │
│  │  [OPEN META BUSINESS SUITE  ↗]  Secondary button  w:100%         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:16px                    │
│                                                                         │
│  META ACCESS TOKEN *                                                    │
│  Orb 11px #7ECFDF  mb:8px                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Paste your Meta access token here                               │  │
│  │  JARVIS input field  font: Share Tech Mono 13px  h:48px          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:8px                     │
│  [?] WHERE DO I FIND THIS?  →  Ghost btn  (expands help section)       │
│                                              mb:24px                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  VERIFY TOKEN  →  Primary btn  h:52px  w:100%  disabled if empty │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  SAVE AND RETURN LATER  →  Ghost btn  centered  mt:12px                │
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Sub-step indicator | 24px circles, same token logic as main step indicator but smaller |
| Sub-step labels | Share Tech Mono 10px `#7ECFDF` below each circle |
| Instruction panel | `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `padding: 20px` |
| Instruction heading | Orbitron 13px 600 `#00D4FF` |
| Instruction list | Inter 14px `#E8F4F8` line-height 1.7 |
| External link button | Secondary button with Lucide `ExternalLink` 14px icon right |
| Token input | JARVIS input, Share Tech Mono 13px (monospace looks right for a token) |
| Help ghost button | Orbitron 11px `#00D4FF`, expands help section inline |
| Verify CTA | "VERIFY TOKEN", Primary, `height: 52px`, disabled until input has value |
| Save later | Ghost button, Orbitron 11px, saves current state and sends resume link |

---

### Screen 2: Step 3 — Verifying Meta Token

**Screen ID:** `ob-wizard-step3-verifying`
**Priority:** P0 | **Route:** `/setup/step-3` (verification state)
**Complexity:** Simple | **Animation:** Complex

**Wireframe:**
```
[Token input panel replaced by verification state]

│  META ADS INTEGRATION                                                   │
│  STEP 3 OF 5  /  SUB-STEP ①────②────③  (on step 3)                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  VERIFICATION PANEL  bg panel card                               │  │
│  │  centered  padding: 48px                                         │  │
│  │                                                                  │  │
│  │  [Lucide Shield 40px  #00D4FF]  centered  mb:16px                │  │
│  │                                                                  │  │
│  │  VERIFYING META TOKEN...                                         │  │
│  │  Orbitron 13px #7ECFDF  centered                                │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  PROGRESS BAR  w:100%  h:2px                               │  │  │
│  │  │  indeterminate shimmer animation (not fill — unknown time)  │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                          mb:16px                                │  │
│  │  ● Connecting to Meta API                                        │  │
│  │  ● Validating token permissions                                  │  │
│  │  ● Checking Ad Account access                                   │  │
│  │  STM 11px #2A4A5A  appear sequentially                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
```

**Component Specs:**
- Shield icon: 40px `#00D4FF` — security signal
- Progress bar: indeterminate shimmer (not fill) — we don't know the API response time
- Step labels: appear at 0ms, 800ms, 1600ms — sequential appearance

**Animation:**
- `indeterminate-bar`: Background-position animates 200% left to right, 1.5s infinite linear
- `step-labels`: Sequential appearance with fade-in 200ms each

---

### Screen 3: Step 3 — Meta Ads Connected

**Screen ID:** `ob-wizard-step3-connected`
**Priority:** P0 | **Route:** `/setup/step-3` (success state)
**Complexity:** Simple | **Animation:** Complex

**Wireframe:**
```
│  META ADS INTEGRATION  /  All 3 sub-steps complete (✓✓✓)               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  SUCCESS PANEL  centered  padding: 48px                          │  │
│  │  border: 1px solid rgba(0,255,136,0.4)                           │  │
│  │  shadow: 0 0 20px rgba(0,255,136,0.12)                           │  │
│  │                                                                  │  │
│  │  [Lucide CheckCircle2 — 48px  #00FF88]  centered  mb:16px        │  │
│  │                                                                  │  │
│  │  META ADS CONNECTED                                              │  │
│  │  Orbitron 18px 600 #E8F4F8  centered  mb:8px                    │  │
│  │                                                                  │  │
│  │  Your Meta Ads account is now linked to RainMachine.             │  │
│  │  Campaign data will sync within 15 minutes.                     │  │
│  │  Inter 14px #7ECFDF  centered  mb:32px                          │  │
│  │                                                                  │  │
│  │  [CONTINUE TO STEP 4  →]  Primary btn  h:52px  w:100%           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Main step indicator: Step 3 now shows ✓ (green)                       │
```

**Component Specs:**
- Panel border/shadow: success green palette
- CheckCircle2 icon: 48px `#00FF88`, `box-shadow: 0 0 20px rgba(0,255,136,0.2)` (glowing success)
- Main step indicator step 3 transitions to completed (green circle)

**Animation:**
- `success-enter`: Panel border transitions from cyan to green 400ms. CheckCircle scales in 0.5→1 with spring ease.
- `step-indicator-complete`: Step 3 circle animates to green with checkmark morph effect (or simple bg change).
- `progress-bar-complete`: Main 5-step progress connector between step 3 and 4 activates.

---

### Screen 4: Step 3 — Meta Token Not Recognized

**Screen ID:** `ob-wizard-step3-error`
**Priority:** P0 | **Route:** `/setup/step-3` (error state)
**Complexity:** Medium | **Animation:** Simple

**Wireframe:**
```
│  META ADS INTEGRATION                                                   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ERROR PANEL  panel card                                         │  │
│  │  border: 1px solid rgba(255,107,53,0.4)                          │  │
│  │                                                                  │  │
│  │  [!] TOKEN NOT RECOGNIZED  Orb 11px #FF7D52  mb:12px            │  │
│  │                                                                  │  │
│  │  META ADS TOKEN INVALID                                          │  │
│  │  Orbitron 16px 600 #E8F4F8  mb:8px                              │  │
│  │                                                                  │  │
│  │  The token you provided could not be verified. Common causes:   │  │
│  │  Inter 14px #7ECFDF  mb:12px                                    │  │
│  │                                                                  │  │
│  │  • Token was copied incompletely                                 │  │
│  │  • Token has expired or been revoked                             │  │
│  │  • Ad Account does not have the required permissions             │  │
│  │  Inter 14px #7ECFDF  list  mb:16px                              │  │
│  │                                                                  │  │
│  │  ERROR CODE: META_TOKEN_INVALID_OR_EXPIRED                       │  │
│  │  STM 11px #2A4A5A  mb:24px                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  META ACCESS TOKEN *                                                    │
│  [Token input — cleared, error state, ready for re-entry]              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  HAVING TROUBLE? GET HELP  ▼  (auto-expanded on error)          │  │
│  │  [Expanded help section — same as Screen 5]                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [TRY AGAIN  →]  Primary btn                                           │
│  [SAVE AND RETURN LATER]  Ghost btn                                    │
```

---

### Screen 5: Step 3 — Meta Setup Help

**Screen ID:** `ob-wizard-step3-help`
**Priority:** P1 | **Route:** `/setup/step-3` (help expanded)

**Wireframe:**
```
[Below token input, help section expanded inline:]

┌──────────────────────────────────────────────────────────────────────┐
│  HAVING TROUBLE? GET HELP  ▲  (collapse toggle)                      │
│  bg: rgba(0,212,255,0.02)  border: 1px solid rgba(0,212,255,0.1)     │
│  padding: 20px  r: 4px                                               │
│                                                                      │
│  VIDEO WALKTHROUGH  Orb 11px #7ECFDF  mb:8px                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  [Video embed or placeholder  16:9  border rgba cyan 0.2]   │    │
│  │  "How to generate your Meta access token"  3:42             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                              mb:16px                 │
│                                                                      │
│  FREQUENTLY ASKED                                                    │
│  Q: Which permissions does the token need?                           │
│  A: ads_read, ads_management, business_management                    │
│  STM 11px for perm names                                             │
│                                                                      │
│  Q: My token keeps expiring.                                         │
│  A: Use a System User token — it doesn't expire like user tokens.   │
│                                                                      │
│  STILL STUCK?  →  Ghost btn  (opens contact support modal)          │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Screen 6: Step 3 — Progress Saved (Save & Return Later)

**Screen ID:** `ob-wizard-step3-save-later`
**Priority:** P1 | **Route:** `/setup/step-3` (save confirmation)

**Wireframe:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  PANEL  max-width: 480px  centered  padding: 48px                    │
│                                                                      │
│  [Lucide Bookmark — 40px  #00D4FF]  centered  mb:16px                │
│                                                                      │
│  PROGRESS SAVED                                                      │
│  Orbitron 16px 600 #E8F4F8  centered  mb:8px                        │
│                                                                      │
│  We've saved your progress. Use the link in your welcome email to   │
│  return and complete setup when ready.                               │
│  Inter 14px #7ECFDF  centered  mb:32px                               │
│                                                                      │
│  RESUME LINK SENT TO                                                 │
│  Orb 11px #7ECFDF  mb:4px                                           │
│  marcus@leadgroup.com                                                │
│  STM 13px #00D4FF  centered                                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Stack Integration

**Token validation:**
```typescript
const verifyMetaToken = async (token: string) => {
  // POST to /api/onboarding/meta/verify
  // Calls Meta Graph API: GET /me?access_token={token}&fields=id,name
  // Returns: { valid: boolean, adAccountId: string, error?: string }
}
```

**Indeterminate progress bar (CSS):**
```css
@keyframes indeterminate {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
.progress-indeterminate {
  background: linear-gradient(90deg,
    rgba(0,212,255,0.04) 25%,
    #00D4FF 50%,
    rgba(0,212,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: indeterminate 1.5s linear infinite;
}
```
