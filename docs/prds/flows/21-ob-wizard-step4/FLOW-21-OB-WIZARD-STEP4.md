# Flow PRD: Onboarding Portal — Wizard Step 4 (Google Integration)

**Flow ID:** F-21-OB-WIZARD-STEP4
**App:** Onboarding Portal (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 7 screens | P0: 2 | P1: 5 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | `ob-wizard-step3-main` (after Meta connected or skipped) |
| **Exit Points** | `ob-wizard-step5-main` (after Google connected or skipped) |
| **Purpose** | Connect Google Ads account (via Customer ID + admin invite) and link Google My Business profile |
| **Dependencies** | Google Ads API invite verification, Google My Business Places API |

---

## 1A. UI Profile Note

Step 4 has two parallel sub-flows: Google Ads (Customer ID + invite) and Google My Business (business search). The GMB search introduces a query/results pattern not seen in earlier steps. Both sub-flows share the sub-step indicator pattern established in Step 3, but with different icon language (Google brand colors are NOT used — all UI stays on JARVIS palette).

---

## 4. Screen Specifications

---

### Screen 1: Step 4 — Google Integration (Main)

**Screen ID:** `ob-wizard-step4-main`
**Priority:** P0 | **Route:** `/setup/step-4`
**Complexity:** Complex | **Animation:** Medium

**Emotion Target:**
- 0–2s: "Two things to connect. I can see both at once — this is organized."
- 2–10s: "The Google Ads part just needs my Customer ID. I know where to find that."
- 10s+: "The GMB part searches for me — I don't have to copy anything."

**Wireframe:**
```
[Wizard layout — Step 4 active]

│  GOOGLE INTEGRATION                                                     │
│  Orbitron 18px 600 #E8F4F8  mb:4px                                      │
│  STEP 4 OF 5                                                            │
│  STM 11px #7ECFDF  mb:8px                                               │
│  Connect your Google Ads account and Google My Business profile.        │
│  Inter 14px #7ECFDF  mb:24px                                            │
│  border-bottom rgba(0,212,255,0.1)  pb:24px                             │
│                                                                         │
│  ── SECTION 1: GOOGLE ADS ─────────────────────────────────────────── │
│  Orbitron 11px #7ECFDF  mb:12px  (section divider)                      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  INSTRUCTION PANEL  bg: rgba(0,212,255,0.04)                     │  │
│  │  border: 1px solid rgba(0,212,255,0.2)  r:4px  padding: 20px     │  │
│  │                                                                  │  │
│  │  STEP 1: FIND YOUR GOOGLE ADS CUSTOMER ID                        │  │
│  │  Orbitron 13px 600 #00D4FF  mb:8px                               │  │
│  │                                                                  │  │
│  │  1. Sign in to Google Ads (ads.google.com)                       │  │
│  │  2. Your Customer ID is in the top-right corner (###-###-####)   │  │
│  │  3. Enter it below — we'll send you an admin invite              │  │
│  │  Inter 14px #E8F4F8  line-height 1.7  mb:12px                   │  │
│  │                                                                  │  │
│  │  [OPEN GOOGLE ADS  ↗]  Secondary button  w:100%                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:16px                    │
│                                                                         │
│  GOOGLE ADS CUSTOMER ID *                                               │
│  Orb 11px #7ECFDF  mb:8px                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  123-456-7890                                                    │  │
│  │  JARVIS input  font: STM 13px  h:48px  placeholder format shown  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  We'll send a Google Ads manager invite to this account.               │
│  Inter 12px #2A4A5A  mt:6px  mb:20px                                   │
│                                                                         │
│  [SEND INVITE & VERIFY  →]  Primary btn  h:52px  w:100%                │
│  disabled until Customer ID input has value                             │
│                                              mb:32px                    │
│                                                                         │
│  ── SECTION 2: GOOGLE MY BUSINESS ─────────────────────────────────── │
│  Orbitron 11px #7ECFDF  mb:12px  (section divider)                     │
│                                                                         │
│  YOUR BUSINESS NAME *                                                   │
│  Orb 11px #7ECFDF  mb:8px                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Search for your Google My Business listing...                   │  │
│  │  JARVIS input  h:48px  Inter 14px  (search input)                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  [SEARCH BUSINESSES  →]  Secondary btn  mt:8px  w:100%                 │
│                                              mb:24px                    │
│                                                                         │
│  SAVE AND RETURN LATER  →  Ghost btn  centered                         │
│  SKIP THIS STEP  →  Ghost btn  centered  mt:8px  Orb 11px #2A4A5A      │
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Section dividers | Orbitron 11px `#7ECFDF` uppercase, `border-top: 1px solid rgba(0,212,255,0.1)`, `padding-top: 20px` |
| Instruction panel | `bg: rgba(0,212,255,0.04)`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `padding: 20px` |
| Customer ID input | JARVIS input, Share Tech Mono 13px (matches ID format) |
| Customer ID helper | Inter 12px `#2A4A5A` below field — sets expectation for invite |
| Send Invite CTA | "SEND INVITE & VERIFY", Primary, `height: 52px`, disabled until value |
| GMB search input | JARVIS input, Inter 14px, placeholder text |
| Search button | Secondary button |
| Skip link | Ghost button, Orbitron 11px `#2A4A5A` — de-emphasized; skipping is allowed |

---

### Screen 2: Step 4 — Checking Google Invite

**Screen ID:** `ob-wizard-step4-google-ads-checking`
**Priority:** P1 | **Route:** `/setup/step-4` (verification state)
**Complexity:** Simple | **Animation:** Complex

**Wireframe:**
```
[Google Ads section replaced by verification panel]

│  GOOGLE INTEGRATION  /  STEP 4 OF 5                                    │
│                                                                         │
│  ── SECTION 1: GOOGLE ADS ─────────────────────────────────────────── │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  VERIFICATION PANEL  bg panel card  padding: 40px  centered      │  │
│  │                                                                  │  │
│  │  [Lucide Mail 36px  #00D4FF]  centered  mb:16px                  │  │
│  │                                                                  │  │
│  │  INVITE SENT — CHECKING ACCEPTANCE                               │  │
│  │  Orbitron 13px #7ECFDF  centered  mb:12px                        │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  PROGRESS BAR  indeterminate shimmer  h:2px                │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                              mb:16px            │  │
│  │                                                                  │  │
│  │  Customer ID: 123-456-7890                                       │  │
│  │  STM 11px #2A4A5A  centered  mb:8px                             │  │
│  │                                                                  │  │
│  │  ● Locating Google Ads account                                   │  │
│  │  ● Sending manager invite                                        │  │
│  │  ● Waiting for acceptance...                                     │  │
│  │  STM 11px #2A4A5A  appear sequentially  0ms / 800ms / 1600ms    │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  This may take a moment. You can continue setup below while we check.  │
│  Inter 12px #2A4A5A  centered  mt:12px                                 │
│                                                                         │
│  ── SECTION 2: GOOGLE MY BUSINESS ─────────────────────────────────── │
│  [GMB section remains interactive during Google Ads check]              │
```

**Component Specs:**
- Mail icon: 36px `#00D4FF` — invite metaphor
- Progress bar: indeterminate shimmer (same CSS as Step 3 verify)
- Customer ID echo: confirms which account was used
- "Continue setup below" note: allows GMB section to be used during wait — reduces perceived wait time

**Animation:**
- Same `indeterminate-bar` and `step-labels` patterns as ob-wizard-step3-verifying

---

### Screen 3: Step 4 — Google Ads Connected

**Screen ID:** `ob-wizard-step4-google-ads-connected`
**Priority:** P0 | **Route:** `/setup/step-4` (Google Ads success state)
**Complexity:** Simple | **Animation:** Medium

**Wireframe:**
```
│  GOOGLE INTEGRATION  /  STEP 4 OF 5                                    │
│                                                                         │
│  ── SECTION 1: GOOGLE ADS ─────────────────────────────────────────── │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  SUCCESS PANEL  padding: 24px                                    │  │
│  │  border: 1px solid rgba(0,255,136,0.3)                           │  │
│  │  bg: rgba(0,255,136,0.04)  r:4px                                 │  │
│  │                                                                  │  │
│  │  [Lucide CheckCircle2 24px  #00FF88]  inline  mr:8px             │  │
│  │  GOOGLE ADS CONNECTED                                            │  │
│  │  Orbitron 13px 600 #00FF88  inline  mb:8px                       │  │
│  │                                                                  │  │
│  │  Customer ID 123-456-7890 is now linked.                         │  │
│  │  Campaign data will sync within 24 hours.                        │  │
│  │  Inter 13px #7ECFDF                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:24px                    │
│                                                                         │
│  ── SECTION 2: GOOGLE MY BUSINESS ─────────────────────────────────── │
│  [GMB section continues below — not yet complete]                       │
```

**Component Specs:**
- Compact success state (not full-panel takeover — GMB still needs to be done)
- Green palette: `rgba(0,255,136,0.3)` border, `rgba(0,255,136,0.04)` bg
- Inline CheckCircle2 + heading (horizontal layout for compactness)

**Animation:**
- `success-compact-enter`: Panel fades in + border transitions to green 300ms

---

### Screen 4: Step 4 — GMB Business Search Active

**Screen ID:** `ob-wizard-step4-gmb-searching`
**Priority:** P1 | **Route:** `/setup/step-4` (GMB searching state)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
│  ── SECTION 2: GOOGLE MY BUSINESS ─────────────────────────────────── │
│                                                                         │
│  YOUR BUSINESS NAME *                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Marcus Leads Group                          [×]                 │  │
│  │  JARVIS input  value entered  h:48px                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  SEARCHING PANEL  bg panel card  padding: 20px  centered         │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  PROGRESS BAR  indeterminate shimmer  h:2px  w:100%        │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                              mb:8px             │  │
│  │  SEARCHING GOOGLE MY BUSINESS...                                 │  │
│  │  STM 11px #7ECFDF  centered                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
```

**Component Specs:**
- Clear button (×) in input: allows query edit mid-search
- Compact searching panel: less prominent than Google Ads verify (different stakes)
- Same indeterminate shimmer bar pattern

---

### Screen 5: Step 4 — GMB Results List

**Screen ID:** `ob-wizard-step4-gmb-results`
**Priority:** P1 | **Route:** `/setup/step-4` (GMB results state)
**Complexity:** Medium | **Animation:** Simple

**Wireframe:**
```
│  ── SECTION 2: GOOGLE MY BUSINESS ─────────────────────────────────── │
│                                                                         │
│  YOUR BUSINESS NAME *                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Marcus Leads Group                          [×]                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  3 results found  STM 11px #2A4A5A  mt:8px  mb:12px                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  RESULT ROW  h:64px  hover: bg rgba(0,212,255,0.04)              │  │
│  │  border-bottom: 1px solid rgba(0,212,255,0.08)                   │  │
│  │                                                                  │  │
│  │  [Lucide MapPin 16px #7ECFDF]  mr:12px                          │  │
│  │  Marcus Leads Group                                              │  │
│  │  Orbitron 13px #E8F4F8                                           │  │
│  │  123 Main St, Atlanta, GA 30301                                  │  │
│  │  Inter 12px #7ECFDF                                              │  │
│  │                                  [SELECT →]  Ghost btn  Orb 11px │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  Marcus Leads Group — Buckhead                                   │  │
│  │  456 Peachtree Rd, Atlanta, GA 30326                             │  │
│  │                                  [SELECT →]  Ghost btn            │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  Marcus Leads Group LLC                                          │  │
│  │  789 Roswell Rd, Marietta, GA 30062                              │  │
│  │                                  [SELECT →]  Ghost btn            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:12px                    │
│  Not seeing your business?  SEARCH AGAIN  →  Ghost btn                 │
│  Orb 11px #7ECFDF  centered                                            │
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Results count | Share Tech Mono 11px `#2A4A5A` |
| Result row | `height: 64px`, `padding: 0 16px`, hover `bg: rgba(0,212,255,0.04)` |
| Row separator | `border-bottom: 1px solid rgba(0,212,255,0.08)` |
| MapPin icon | Lucide 16px `#7ECFDF` |
| Business name | Orbitron 13px `#E8F4F8` |
| Address | Inter 12px `#7ECFDF` |
| Select button | Ghost button, Orbitron 11px, right-aligned |
| Search again | Ghost button below results, allows re-query |

**Animation:**
- Results list fades in 200ms after search completes
- Rows stagger in 50ms apart (subtle entrance)

---

### Screen 6: Step 4 — GMB Not Found

**Screen ID:** `ob-wizard-step4-gmb-no-results`
**Priority:** P1 | **Route:** `/setup/step-4` (no GMB results state)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
│  ── SECTION 2: GOOGLE MY BUSINESS ─────────────────────────────────── │
│                                                                         │
│  YOUR BUSINESS NAME *                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  XYZ Business Corp                           [×]                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  NO RESULTS PANEL  padding: 24px  centered                       │  │
│  │  bg: rgba(0,212,255,0.02)                                        │  │
│  │  border: 1px solid rgba(0,212,255,0.1)  r:4px                    │  │
│  │                                                                  │  │
│  │  [Lucide SearchX 32px  #2A4A5A]  centered  mb:12px               │  │
│  │                                                                  │  │
│  │  NO MATCHING BUSINESSES FOUND                                    │  │
│  │  Orbitron 13px #7ECFDF  centered  mb:8px                         │  │
│  │                                                                  │  │
│  │  Try a shorter name or a different variation.                    │  │
│  │  Your GMB listing may be under a different name.                 │  │
│  │  Inter 13px #7ECFDF  centered  mb:16px                           │  │
│  │                                                                  │  │
│  │  [TRY DIFFERENT SEARCH  →]  Secondary btn  w:100%                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Don't have a GMB listing? You can                                      │
│  SKIP THIS STEP  →  Ghost btn  (proceeds without GMB)                  │
│  Inter 13px #7ECFDF + Ghost btn  inline  centered                      │
```

**Component Specs:**
- SearchX icon: 32px `#2A4A5A` — muted, not alarming
- "Try different search" replaces input value focus (clears and re-focuses input)
- Skip option surfaced here: if business truly isn't on GMB, proceeding is valid

---

### Screen 7: Step 4 — GMB Business Selected (Both Connected)

**Screen ID:** `ob-wizard-step4-gmb-selected`
**Priority:** P1 | **Route:** `/setup/step-4` (both connected state)
**Complexity:** Simple | **Animation:** Medium

**Wireframe:**
```
│  GOOGLE INTEGRATION  /  STEP 4 OF 5                                    │
│                                                                         │
│  ── SECTION 1: GOOGLE ADS ─────────────────────────────────────────── │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  [✓] GOOGLE ADS CONNECTED  (compact success — green)             │  │
│  │  Customer ID 123-456-7890 is now linked.                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:16px                    │
│                                                                         │
│  ── SECTION 2: GOOGLE MY BUSINESS ─────────────────────────────────── │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  SUCCESS PANEL  padding: 24px                                    │  │
│  │  border: 1px solid rgba(0,255,136,0.3)                           │  │
│  │  bg: rgba(0,255,136,0.04)  r:4px                                 │  │
│  │                                                                  │  │
│  │  [Lucide CheckCircle2 24px  #00FF88]  inline  mr:8px             │  │
│  │  GMB PROFILE LINKED                                              │  │
│  │  Orbitron 13px 600 #00FF88  inline  mb:8px                       │  │
│  │                                                                  │  │
│  │  Marcus Leads Group                                              │  │
│  │  Orbitron 13px #E8F4F8  mb:2px                                   │  │
│  │  123 Main St, Atlanta, GA 30301                                  │  │
│  │  Inter 12px #7ECFDF                                              │  │
│  │                                                                  │  │
│  │  [CHANGE SELECTION]  Ghost btn  Orb 11px  right-aligned          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:32px                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  CONTINUE TO STEP 5  →  Primary btn  h:52px  w:100%             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Main step indicator: Step 4 now shows ✓ (green)                       │
```

**Component Specs:**
- Both sections show compact success states
- Selected business name + address echoed back (confirms correct selection)
- "CHANGE SELECTION" ghost button: lets user re-pick GMB without losing Google Ads state
- CONTINUE TO STEP 5 only appears when at least one Google connection is made (Google Ads OR GMB)

**Animation:**
- `gmb-success-enter`: Panel border transitions to green 300ms, CheckCircle2 scales in
- `step-indicator-complete`: Step 4 circle animates to green with checkmark

---

## 5. Stack Integration

**Google Ads Customer ID validation:**
```typescript
const verifyGoogleAdsCustomerId = async (customerId: string) => {
  // POST to /api/onboarding/google-ads/invite
  // Strips formatting (###-###-####  →  ##########)
  // Sends manager invite via Google Ads API
  // Returns: { invited: boolean, customerId: string, error?: string }
}

// Polling for invite acceptance
const pollInviteAcceptance = async (customerId: string) => {
  // GET /api/onboarding/google-ads/status?customerId=xxx
  // Poll every 5s for up to 60s
  // Returns: { accepted: boolean }
}
```

**GMB business search:**
```typescript
const searchGMBBusinesses = async (query: string) => {
  // POST to /api/onboarding/gmb/search
  // Calls Google Places API with query + location bias
  // Returns: { results: Array<{ placeId: string, name: string, address: string }> }
}

const selectGMBBusiness = async (placeId: string) => {
  // POST to /api/onboarding/gmb/select
  // Stores placeId on client profile
  // Returns: { success: boolean }
}
```

**Customer ID input formatting:**
```typescript
// Auto-format as user types: 1234567890 → 123-456-7890
const formatCustomerId = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}
```
