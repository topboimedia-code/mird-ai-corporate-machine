# Flow PRD: Onboarding Portal — Wizard Step 5 (Launch Configuration)

**Flow ID:** F-22-OB-WIZARD-STEP5
**App:** Onboarding Portal (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 4 screens | P0: 2 | P1: 2 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | `ob-wizard-step4-main` (after Google connected or skipped) |
| **Exit Points** | `ob-completion-initializing` (LAUNCH RAINMACHINE) |
| **Purpose** | Final configuration: upload brand assets, set launch date, confirm notification preferences |
| **Dependencies** | File storage API (logo/photos upload), date validation, notification settings API |

---

## 1A. UI Profile Note

Step 5 is the last wizard step before the dramatic completion sequence. The "LAUNCH RAINMACHINE" CTA is the most consequential button in the entire onboarding flow — it should feel final and weighty. The uploading state uses per-file progress bars (not a single bar) to give granular feedback. This step includes the only file upload interaction in the onboarding flow.

---

## 4. Screen Specifications

---

### Screen 1: Step 5 — Launch Configuration (Main)

**Screen ID:** `ob-wizard-step5-main`
**Priority:** P0 | **Route:** `/setup/step-5`
**Complexity:** Medium | **Animation:** Simple

**Emotion Target:**
- 0–2s: "Final step. I can see the end. Three things to do."
- 2–10s: "Upload my logo, pick my launch date, confirm my preferences. This is going to launch."
- 10s+: "I'm pressing the button. This is real."

**Wireframe:**
```
[Wizard layout — Step 5 active]

│  LAUNCH CONFIGURATION                                                   │
│  Orbitron 18px 600 #E8F4F8  mb:4px                                      │
│  STEP 5 OF 5                                                            │
│  STM 11px #7ECFDF  mb:8px                                               │
│  Final step. Upload your brand assets and set your launch preferences. │
│  Inter 14px #7ECFDF  mb:24px                                            │
│  border-bottom rgba(0,212,255,0.1)  pb:24px                             │
│                                                                         │
│  ── BRAND ASSETS ───────────────────────────────────────────────────── │
│  Orbitron 11px #7ECFDF  mb:16px                                         │
│                                                                         │
│  BUSINESS LOGO                                                          │
│  Orb 11px #7ECFDF  mb:8px                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  UPLOAD ZONE  h:100px  dashed border                             │  │
│  │  border: 2px dashed rgba(0,212,255,0.2)  r:4px                   │  │
│  │  bg: rgba(0,212,255,0.02)                                        │  │
│  │  hover: bg rgba(0,212,255,0.06)  border rgba(0,212,255,0.4)      │  │
│  │                                                                  │  │
│  │  [Lucide Upload 20px  #2A4A5A]  centered  mb:8px                 │  │
│  │  DRAG & DROP or CLICK TO UPLOAD                                  │  │
│  │  Orbitron 11px #7ECFDF  centered  mb:4px                         │  │
│  │  PNG, JPG, SVG  ·  max 5MB                                       │  │
│  │  Inter 11px #2A4A5A  centered                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:16px                    │
│                                                                         │
│  BUSINESS PHOTOS (OPTIONAL)                                             │
│  Orb 11px #7ECFDF  mb:8px                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  UPLOAD ZONE  h:80px  same styles  (smaller — optional)          │  │
│  │  [Lucide Images 20px  #2A4A5A]  centered  mb:4px                 │  │
│  │  Up to 5 photos  ·  JPG, PNG  ·  max 5MB each                   │  │
│  │  Inter 11px #2A4A5A  centered                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:32px                    │
│                                                                         │
│  ── LAUNCH PREFERENCES ─────────────────────────────────────────────── │
│  Orbitron 11px #7ECFDF  mb:16px                                         │
│                                                                         │
│  TARGET LAUNCH DATE *                                                   │
│  Orb 11px #7ECFDF  mb:8px                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MM / DD / YYYY                                                  │  │
│  │  JARVIS input  font: STM 13px  h:48px  (date input)              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  System will be live by this date. Minimum 3 business days from today. │
│  Inter 12px #2A4A5A  mt:6px  mb:20px                                   │
│                                                                         │
│  CAMPAIGN NOTIFICATIONS                                                 │
│  Orb 11px #7ECFDF  mb:12px                                             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  TOGGLE ROW  h:48px  border-bottom rgba(0,212,255,0.08)          │  │
│  │  Weekly Performance Reports                                      │  │
│  │  Inter 14px #E8F4F8                                              │  │
│  │  Sent every Monday morning                                       │  │
│  │  Inter 12px #7ECFDF                                              │  │
│  │                              [TOGGLE  ON  ●──]  #00D4FF  right   │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  Lead Alerts (real-time)                                         │  │
│  │  Notify when new leads come in                                   │  │
│  │                              [TOGGLE  ON  ●──]  #00D4FF  right   │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  Monthly Budget Reports                                          │  │
│  │  Ad spend summary                                                │  │
│  │                              [TOGGLE  ON  ●──]  #00D4FF  right   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:32px                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  LAUNCH RAINMACHINE  →                                           │  │
│  │  Primary button  h:56px  w:100%  Orbitron 600 14px               │  │
│  │  (taller than previous CTAs — final, consequential action)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  [← BACK]  Ghost btn  centered  mt:12px                                │
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Section dividers | Orbitron 11px `#7ECFDF`, `border-top: 1px solid rgba(0,212,255,0.1)`, `padding-top: 20px` |
| Upload zone (idle) | `border: 2px dashed rgba(0,212,255,0.2)`, `bg: rgba(0,212,255,0.02)`, `border-radius: 4px` |
| Upload zone (hover) | `border-color: rgba(0,212,255,0.4)`, `bg: rgba(0,212,255,0.06)` |
| Upload zone (drag-over) | `border-color: #00D4FF`, `bg: rgba(0,212,255,0.1)` |
| Upload icon | Lucide `Upload` 20px `#2A4A5A` |
| Photos icon | Lucide `Images` 20px `#2A4A5A` |
| Upload label | Orbitron 11px `#7ECFDF` |
| Upload hint | Inter 11px `#2A4A5A` — file type + size |
| Date input | JARVIS input, Share Tech Mono 13px |
| Date helper | Inter 12px `#2A4A5A` — minimum days warning |
| Toggle row | `height: 48px`, `padding: 0 16px`, JARVIS toggle component |
| Toggle ON state | `background: #00D4FF`, `border-radius: 12px` |
| Toggle OFF state | `background: rgba(0,212,255,0.2)` |
| Launch CTA | "LAUNCH RAINMACHINE", Primary, `height: 56px` (extra tall for weight), `font-size: 14px` |

**Interactive States:**
- **Logo uploaded:** Upload zone replaced by thumbnail preview + filename + remove (×) button
- **Photos uploaded:** Thumbnail grid replaces upload zone (max 5 thumbnails)
- **Date validation:** Error state if date < 3 business days out

---

### Screen 2: Step 5 — Uploading Assets

**Screen ID:** `ob-wizard-step5-uploading`
**Priority:** P1 | **Route:** `/setup/step-5` (upload in progress)
**Complexity:** Medium | **Animation:** Medium

**Wireframe:**
```
│  ── BRAND ASSETS ───────────────────────────────────────────────────── │
│                                                                         │
│  BUSINESS LOGO                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  FILE PROGRESS ROW  padding: 12px 16px                           │  │
│  │  bg: rgba(0,212,255,0.04)  border rgba(0,212,255,0.2)  r:4px     │  │
│  │                                                                  │  │
│  │  [Lucide FileImage 16px  #7ECFDF]  mr:10px                       │  │
│  │  marcus-leads-logo.png                                           │  │
│  │  Orbitron 11px #E8F4F8  mb:6px                                   │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐    │  │
│  │  │  PROGRESS BAR  h:2px  bg rgba(0,212,255,0.1)             │    │  │
│  │  │  fill: #00D4FF  animated  w: 67%  (deterministic fill)   │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  │  67%  STM 10px #2A4A5A  mt:4px  right-aligned                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              mb:8px                     │
│  BUSINESS PHOTOS                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  FILE PROGRESS ROW  (photo-1.jpg — 100% ✓ complete)              │  │
│  │  [✓] photo-1.jpg  Orb 11px #00FF88  (completed state)           │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  FILE PROGRESS ROW  (photo-2.jpg — uploading 23%)                │  │
│  │  [⠿] photo-2.jpg  progress bar 23%                               │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  FILE PROGRESS ROW  (photo-3.jpg — queued)                       │  │
│  │  [○] photo-3.jpg  STM 10px #2A4A5A  QUEUED                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Uploading 4 files...  STM 11px #7ECFDF                                │
```

**Component Specs:**
- Per-file progress: deterministic fill (we know upload size)
- Completed file: row transitions to green text + checkmark icon
- Queued file: muted appearance `#2A4A5A`
- Uploading file: active cyan progress bar
- FileImage icon: Lucide 16px `#7ECFDF`

**Animation:**
- `progress-fill`: Width transition ease-in-out, updates every 200ms with real progress data
- `file-complete`: Row background flashes `rgba(0,255,136,0.06)` on completion 400ms, then fades

---

### Screen 3: Step 5 — Upload Error

**Screen ID:** `ob-wizard-step5-upload-error`
**Priority:** P1 | **Route:** `/setup/step-5` (upload failed state)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
│  BUSINESS LOGO                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  FILE ERROR ROW  padding: 12px 16px                              │  │
│  │  border: 1px solid rgba(255,107,53,0.4)                          │  │
│  │  bg: rgba(255,107,53,0.04)  r:4px                                │  │
│  │                                                                  │  │
│  │  [Lucide AlertCircle 16px  #FF7D52]  mr:10px                     │  │
│  │  marcus-leads-logo.png  — UPLOAD FAILED                          │  │
│  │  Orbitron 11px #FF7D52  mb:4px                                   │  │
│  │  File exceeds 5MB limit. Please upload a smaller version.        │  │
│  │  Inter 12px #FF7D52  mb:8px                                      │  │
│  │  [TRY AGAIN  ↺]  Ghost btn  Orb 11px  inline                    │  │
│  │  [REMOVE  ×]  Ghost btn  Orb 11px  inline  ml:12px               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
```

**Component Specs:**
- Error row: orange palette — `rgba(255,107,53,0.4)` border, `rgba(255,107,53,0.04)` bg
- AlertCircle icon: 16px `#FF7D52`
- Error message: specific (file too large / wrong type / network error)
- TRY AGAIN: re-triggers upload for that file
- REMOVE: clears the file, returns to upload zone for that slot

---

### Screen 4: Step 5 — Validation Error

**Screen ID:** `ob-wizard-step5-validation-error`
**Priority:** P0 | **Route:** `/setup/step-5` (validation error state)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
[LAUNCH RAINMACHINE clicked with missing required fields]

│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  REQUIRED FIELDS MISSING  alert item  mb:20px                    │  │
│  │  border-left: 3px solid #FF6B35                                  │  │
│  │  bg: rgba(255,107,53,0.04)  padding: 10px 14px                   │  │
│  │  Complete the following before launching:                        │  │
│  │  Inter 13px #FF7D52                                              │  │
│  │  • Business logo (required)                                      │  │
│  │  • Target launch date (required)                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  TARGET LAUNCH DATE *                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  [empty]                                             [!]         │  │
│  │  border: rgba(255,107,53,0.6)  shadow rgba(255,107,53,0.1)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  TARGET LAUNCH DATE IS REQUIRED                                         │
│  Orbitron 10px #FF7D52  mt:4px                                          │
│                                                                         │
│  [LAUNCH RAINMACHINE  →]  Primary btn  (remains visible — not disabled)│
```

**Component Specs:**
- Same alert + error field pattern as Step 2 validation error
- Alert banner lists specific missing items as bullets
- Logo upload zone: orange dashed border on error
- Date input: orange border + error label
- Launch button remains enabled — re-clicking after fixing will proceed

---

## 5. Stack Integration

**File upload handler:**
```typescript
const uploadAsset = async (file: File, type: 'logo' | 'photo') => {
  // POST /api/onboarding/assets/upload (multipart)
  // Returns: { url: string, key: string }
  // XHR with onprogress for per-file percentage
}

// Track upload progress per file
const [uploadProgress, setUploadProgress] = useState<
  Record<string, { progress: number; status: 'queued' | 'uploading' | 'done' | 'error'; error?: string }>
>({})
```

**Form schema (Zod):**
```typescript
const step5Schema = z.object({
  logoUrl:       z.string().url('Logo is required'),
  photoUrls:     z.array(z.string().url()).max(5).optional(),
  launchDate:    z.coerce.date().refine(
    date => {
      const minDate = addBusinessDays(new Date(), 3)
      return date >= minDate
    },
    { message: 'Launch date must be at least 3 business days from today' }
  ),
  notifications: z.object({
    weeklyReports:    z.boolean().default(true),
    leadAlerts:       z.boolean().default(true),
    monthlyBudget:    z.boolean().default(true),
  }),
})
```

**Launch submission:**
```typescript
const launchRainMachine = useMutation({
  mutationFn: async (data: z.infer<typeof step5Schema>) => {
    // POST /api/onboarding/launch
    // Marks setup complete, triggers provisioning
    // Returns: { jobId: string } — for completion polling
  },
  onSuccess: ({ jobId }) => {
    router.push(`/setup/complete?job=${jobId}`)
  },
})
```
