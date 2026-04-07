# Flow PRD: Onboarding Portal — Wizard Step 2 (Mission Parameters)

**Flow ID:** F-19-OB-WIZARD-STEP2
**App:** Onboarding Portal (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 4 screens | P0: 2 | P1: 2 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | `ob-wizard-step1-main` (BEGIN SETUP) |
| **Exit Points** | `ob-wizard-step3-main` (CONTINUE after save) |
| **Purpose** | Collect business information: target market, service area, goals, key differentiators |
| **Dependencies** | Form data persistence API, client profile record |

---

## 4. Screen Specifications

---

### Screen 1: Step 2 — Mission Parameters

**Screen ID:** `ob-wizard-step2-main`
**Priority:** P0 | **Route:** `/setup/step-2`
**Complexity:** Medium | **Animation:** Simple

**Emotion Target:**
- 0–2s: "This is asking me about my business. The questions are smart, not generic."
- 2–10s: "I'm configuring the AI for my specific market and goals."
- 10s+: "I know exactly what I need to fill in. This will make my system smarter."

**Wireframe:**
```
[Wizard layout — Step 2 active (●①✓─●②─○③─○④─○⑤)]

│  MISSION PARAMETERS                                                     │
│  Orbitron 18px 600 #E8F4F8  mb:4px                                      │
│  STEP 2 OF 5                                                            │
│  STM 11px #7ECFDF  mb:8px                                               │
│  Tell us about your business so your AI system can be calibrated.      │
│  Inter 14px #7ECFDF  mb:24px                                            │
│  border-bottom rgba(0,212,255,0.1)  pb:24px                             │
│                                                                         │
│  BUSINESS NAME *                                                        │
│  [Input field  value: "Marcus Leads Group"  pre-populated if available] │
│                                              mb:20px                    │
│                                                                         │
│  SERVICE AREA *                                                         │
│  [Input field  placeholder: "City, State or Metro Area"]                │
│                                              mb:20px                    │
│                                                                         │
│  TARGET CLIENT TYPE *                                                   │
│  [Input field  placeholder: "e.g. Residential home sellers, 35-65"]    │
│                                              mb:20px                    │
│                                                                         │
│  AVERAGE DEAL VALUE *                                                   │
│  $  [Input field  type=number  placeholder: "350000"]                  │
│                                              mb:20px                    │
│                                                                         │
│  MONTHLY TRANSACTION GOAL *                                             │
│  [Input field  type=number  placeholder: "4"]  closings/month           │
│                                              mb:20px                    │
│                                                                         │
│  KEY DIFFERENTIATORS (OPTIONAL)                                         │
│  [Textarea  h:100px  placeholder: "What sets your team apart? E.g.      │
│   15 years experience, military relocation specialist..."]              │
│                                              mb:32px                    │
│                                                                         │
│  [SAVE & CONTINUE  →]  Primary button  h:52px  w:100%                  │
│  [← BACK]  Ghost button  below  centered                               │
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Step title | Orbitron 18px 600 `#E8F4F8` |
| Step context | Inter 14px `#7ECFDF` |
| Required asterisk | `color: #FF7D52`, `font-size: 11px`, inline after label |
| All inputs | JARVIS input field — `bg: rgba(0,212,255,0.04)`, focus `border: #00D4FF` |
| Currency prefix | Share Tech Mono 15px `#7ECFDF`, absolute left inside input |
| Textarea | Same input field styles, `resize: vertical`, `min-height: 100px` |
| Primary CTA | "SAVE & CONTINUE", `height: 52px`, `width: 100%` |
| Back link | Ghost button, routes to `/setup/step-1` |

**Animation Spec:**
- `panel-enter`: Standard wizard panel enter.
- `input-focus`: Border + shadow transition 200ms.
- `label-float`: Optional — labels can float above input on focus (Orbitron stays uppercase).

**Interactive States:**
- **Default:** Fields empty or pre-populated from CRM.
- **Filling:** Focus state on each field.
- **Submit:** Transitions to `ob-wizard-step2-saving`.
- **Validation error:** Transitions to `ob-wizard-step2-validation-error`.

**Data:**
- 6 fields: business_name, service_area, target_client_type, avg_deal_value, monthly_goal, differentiators

---

### Screen 2: Step 2 — Form Validation Errors

**Screen ID:** `ob-wizard-step2-validation-error`
**Priority:** P0 | **Route:** `/setup/step-2` (error state)

**Wireframe:**
```
[Same as step2-main, with validation errors shown:]

│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  REQUIRED FIELDS MISSING  alert item style                       │  │
│  │  border-left: 3px solid #FF6B35  bg: rgba(255,107,53,0.04)       │  │
│  │  padding: 10px 14px  mb:20px                                     │  │
│  │  3 required fields need to be completed before continuing.       │  │
│  │  Inter 13px #FF7D52                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  SERVICE AREA *                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  [empty]                                          [!]            │  │
│  │  border: rgba(255,107,53,0.6)  shadow: rgba(255,107,53,0.1)      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  SERVICE AREA IS REQUIRED                                               │
│  Orbitron 10px #FF7D52  mt:4px  mb:16px                                │
```

**Component Specs:**
- Alert banner: alert item style at top of form
- Error input: `border-color: rgba(255,107,53,0.6)`, `box-shadow: 0 0 0 3px rgba(255,107,53,0.1)`
- Error label: Orbitron 10px `#FF7D52` uppercase below field
- Error icon: Lucide `AlertCircle` 14px `#FF7D52` absolute right inside input

---

### Screen 3: Step 2 — Saving Progress

**Screen ID:** `ob-wizard-step2-saving`
**Priority:** P1 | **Route:** `/setup/step-2` (transition state)

**Wireframe:**
```
[Overlay on wizard panel — full panel bg dims]

┌────────────────────────────────────────────────────────────────────────┐
│  PANEL  opacity: 0.5 behind overlay                                    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  SAVE STATE OVERLAY  centered in panel                           │ │
│  │  bg: rgba(10,22,40,0.9)  full panel overlay  z-index: 10         │ │
│  │                                                                  │ │
│  │  SAVING MISSION PARAMETERS...                                    │ │
│  │  Orbitron 13px #7ECFDF  centered                                 │ │
│  │                                                                  │ │
│  │  ────────────────────────────────                                │ │
│  │  scan-line sweeps vertically  1.5s  plays once                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

**Notes:** Panel dims to 0.5 opacity, scan-line sweeps once, then resolves to step 3 or error.

---

### Screen 4: Step 2 — Save Failed

**Screen ID:** `ob-wizard-step2-save-error`
**Priority:** P1 | **Route:** `/setup/step-2` (error state)

**Wireframe:**
```
[Below form, instead of CTA:]

┌──────────────────────────────────────────────────────────────────────┐
│  SAVE FAILED  alert item  mb:16px                                    │
│  border-left: 3px solid #FF6B35                                      │
│  bg: rgba(255,107,53,0.04)  padding: 10px 14px                       │
│                                                                      │
│  Unable to save your information. Please try again.                  │
│  Inter 13px #FF7D52                                                  │
└──────────────────────────────────────────────────────────────────────┘
│                                                                      │
│  [TRY AGAIN  →]  Primary button  w:100%                              │
│  [SAVE FOR LATER]  Ghost btn — saves partial progress and exits      │
```

---

## 5. Stack Integration

**Form schema (Zod):**
```typescript
const step2Schema = z.object({
  businessName:     z.string().min(2, 'Required'),
  serviceArea:      z.string().min(2, 'Required'),
  targetClientType: z.string().min(5, 'Required'),
  avgDealValue:     z.number().positive('Enter a valid amount'),
  monthlyGoal:      z.number().int().positive('Enter a valid goal'),
  differentiators:  z.string().optional(),
})
```

**React Hook Form + Zod:**
```typescript
const form = useForm<z.infer<typeof step2Schema>>({
  resolver: zodResolver(step2Schema),
  defaultValues: { businessName: clientData?.businessName ?? '' }
})
```

**Progress persistence:**
```typescript
// Auto-save draft every 30 seconds
// Full save on SAVE & CONTINUE
// Partial save on SAVE FOR LATER
const saveDraft = useMutation({ mutationFn: saveDraftStep2 })
```
