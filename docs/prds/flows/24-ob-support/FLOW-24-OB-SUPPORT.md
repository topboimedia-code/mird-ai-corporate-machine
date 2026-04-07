# Flow PRD: Onboarding Portal — Support

**Flow ID:** F-24-OB-SUPPORT
**App:** Onboarding Portal (MIRD AI Corporate Machine)
**Platform:** Web — desktop-first
**Date:** 2026-03-30
**Status:** Ready for Implementation
**Screens:** 2 screens | P0: 0 | P1: 2 | P2: 0

---

## 1. Flow Metadata

| Field | Value |
|-------|-------|
| **Entry Points** | "STILL STUCK?" (ob-wizard-step3-help), "CONTACT SUPPORT" (ob-access-token-invalid), "CONTACT YOUR ACCOUNT MANAGER" (ob-completion-next-steps), "DETAILS INCORRECT?" (ob-wizard-step1-main) |
| **Exit Points** | Modal dismissed / message sent → returns to triggering screen |
| **Purpose** | In-flow support contact without leaving the onboarding wizard |
| **Dependencies** | Support ticket submission API, video hosting (CDN or embed) |

---

## 1A. UI Profile Note

Both support screens are overlaid experiences — they do not navigate away from the wizard. The contact modal is a centered overlay; the video walkthrough expands inline within the help section (Screen 5 of Step 3). Neither screen should feel like leaving the flow.

---

## 4. Screen Specifications

---

### Screen 1: Contact Support Modal

**Screen ID:** `ob-support-contact`
**Priority:** P1 | **Route:** `/setup/*` (modal overlay — no route change)
**Complexity:** Simple | **Animation:** Simple

**Emotion Target:**
- 0–2s: "I can get help without leaving. This is quick."
- 2s+: "I've sent it. Someone will follow up."

**Wireframe:**
```
[Full-screen overlay — wizard panel dimmed behind]

┌──────────────────────────────────────────────────────────────────────────┐
│  OVERLAY  bg: rgba(5,13,26,0.85)  backdrop-blur: 4px  z-index: 50       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  MODAL CARD  max-width: 480px  centered  padding: 40px             │ │
│  │  Panel card styles  border: 1px solid rgba(0,212,255,0.2)          │ │
│  │                                                                    │ │
│  │  [×]  Close button  absolute top-right  16px  #7ECFDF              │ │
│  │  hover: #E8F4F8                                                    │ │
│  │                                                                    │ │
│  │  [Lucide Headphones — 36px  #00D4FF]  centered  mb:16px            │ │
│  │                                                                    │ │
│  │  CONTACT SUPPORT                                                   │ │
│  │  Orbitron 16px 600 #E8F4F8  centered  mb:8px                      │ │
│  │                                                                    │ │
│  │  Your account manager will respond within 2 business hours.       │ │
│  │  Inter 14px #7ECFDF  centered  mb:24px                             │ │
│  │                                                                    │ │
│  │  YOUR NAME                                                         │ │
│  │  Orb 11px #7ECFDF  mb:8px                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  Marcus Johnson  (pre-populated from client profile)          │ │ │
│  │  │  JARVIS input  h:44px  Inter 14px                             │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                                              mb:16px              │ │
│  │                                                                    │ │
│  │  WHAT DO YOU NEED HELP WITH?                                       │ │
│  │  Orb 11px #7ECFDF  mb:8px                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  Describe the issue or question...                           │ │ │
│  │  │  JARVIS textarea  h:100px  Inter 14px  resize:vertical       │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                                              mb:20px              │ │
│  │                                                                    │ │
│  │  [SEND MESSAGE  →]  Primary btn  h:48px  w:100%                   │ │
│  │  disabled until textarea has value                                │ │
│  │                                              mb:12px              │ │
│  │                                                                    │ │
│  │  Or email directly: support@makeitrain.digital                    │ │
│  │  STM 12px #7ECFDF  centered  (mailto link)                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Overlay | `background: rgba(5,13,26,0.85)`, `backdrop-filter: blur(4px)` |
| Modal card | Panel card, `max-width: 480px`, `padding: 40px` |
| Close button | `×` or Lucide `X` 16px `#7ECFDF`, `position: absolute`, `top: 16px`, `right: 16px` |
| Headphones icon | Lucide 36px `#00D4FF` |
| Name input | JARVIS input, pre-populated from client profile |
| Message textarea | JARVIS textarea, `height: 100px`, `resize: vertical` |
| Send CTA | "SEND MESSAGE", Primary, `height: 48px`, disabled until message has value |
| Email fallback | Share Tech Mono 12px `#7ECFDF`, `href="mailto:support@makeitrain.digital"` |

**Interactive States:**
- **Idle:** Pre-populated name, empty textarea, Send disabled
- **Typing:** Send button activates
- **Sending:** Button shows loading state (spinner replaces arrow)
- **Sent:** Modal transitions to confirmation state

**Confirmation state (inline, replaces form):**
```
│  [Lucide CheckCircle2 36px  #00FF88]  centered  mb:12px                  │
│                                                                           │
│  MESSAGE SENT                                                             │
│  Orbitron 13px 600 #00FF88  centered  mb:8px                             │
│                                                                           │
│  Your account manager will follow up at your registered email.           │
│  Inter 13px #7ECFDF  centered  mb:20px                                   │
│                                                                           │
│  [CLOSE]  Ghost btn  Orb 11px  centered                                  │
```

**Animation:**
- `modal-enter`: Scale 0.95→1 + fade 200ms ease-out
- `modal-exit`: Scale 1→0.95 + fade 150ms ease-in
- `confirmation-enter`: Form fades out 150ms, confirmation fades in 200ms

---

### Screen 2: Video Walkthrough

**Screen ID:** `ob-support-video`
**Priority:** P1 | **Route:** `/setup/step-3` (inline within help section)
**Complexity:** Simple | **Animation:** Simple

**Wireframe:**
```
[Inline within ob-wizard-step3-help, replacing video placeholder:]

┌──────────────────────────────────────────────────────────────────────────┐
│  HELP SECTION  (expanded inline)                                         │
│  bg: rgba(0,212,255,0.02)  border: 1px solid rgba(0,212,255,0.1)         │
│  padding: 20px  r: 4px                                                   │
│                                                                          │
│  VIDEO WALKTHROUGH  Orb 11px #7ECFDF  mb:8px                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  VIDEO CONTAINER  aspect-ratio: 16/9                               │ │
│  │  border: 1px solid rgba(0,212,255,0.2)  r:4px                     │ │
│  │  bg: #050D1A  (video loads here — Loom/Vimeo/YouTube embed)       │ │
│  │                                                                    │ │
│  │  [Native video controls — browser default or custom overlay]       │ │
│  │  Title: "How to generate your Meta access token"                  │ │
│  │  Duration: 3:42                                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                              mb:16px                    │
│                                                                          │
│  FREQUENTLY ASKED                                                        │
│  Orb 11px #7ECFDF  mb:12px                                               │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  FAQ ITEM  border-bottom: 1px solid rgba(0,212,255,0.08)           │ │
│  │  padding: 12px 0                                                   │ │
│  │                                                                    │ │
│  │  Q: Which permissions does the token need?                         │ │
│  │  Orbitron 11px #E8F4F8  mb:6px                                    │ │
│  │                                                                    │ │
│  │  A: Your token needs:                                              │ │
│  │  ads_read  ·  ads_management  ·  business_management              │ │
│  │  Inter 13px #7ECFDF  (permission names in STM 11px #00D4FF)       │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  Q: My token keeps expiring.                                       │ │
│  │  Orbitron 11px #E8F4F8  mb:6px                                    │ │
│  │                                                                    │ │
│  │  A: User tokens expire every 60 days. Use a System User token —   │ │
│  │  it doesn't expire and is recommended for ad integrations.        │ │
│  │  Inter 13px #7ECFDF                                               │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  Q: I don't see "System Users" in my Meta Business Suite.          │ │
│  │  Orbitron 11px #E8F4F8  mb:6px                                    │ │
│  │                                                                    │ │
│  │  A: You need Admin access to your Business Manager account.        │ │
│  │  Ask your account owner to grant you admin permissions first.     │ │
│  │  Inter 13px #7ECFDF                                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                              mb:16px                    │
│                                                                          │
│  [STILL STUCK? GET HELP →]  Ghost btn  Orb 11px  (opens support modal)  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

| Component | Token / Value |
|-----------|---------------|
| Help section container | `bg: rgba(0,212,255,0.02)`, `border: 1px solid rgba(0,212,255,0.1)`, `border-radius: 4px`, `padding: 20px` |
| Video container | `aspect-ratio: 16/9`, `border: 1px solid rgba(0,212,255,0.2)`, `border-radius: 4px`, `overflow: hidden` |
| Video embed | Loom/Vimeo/YouTube iframe — `width: 100%`, `height: 100%` |
| FAQ question | Orbitron 11px `#E8F4F8` |
| FAQ answer | Inter 13px `#7ECFDF` |
| Permission names | Share Tech Mono 11px `#00D4FF` inline in answer text |
| FAQ separator | `border-bottom: 1px solid rgba(0,212,255,0.08)`, `padding: 12px 0` |
| "STILL STUCK?" CTA | Ghost button, Orbitron 11px — triggers `ob-support-contact` modal |

**Notes:**
- Video is not autoplay — user must click play
- Help section is collapsible (toggle state managed in parent step 3 component)
- "STILL STUCK?" button is the handoff to human support

---

## 5. Stack Integration

**Support ticket submission:**
```typescript
const submitSupportTicket = async (data: {
  name: string
  message: string
  context: string // current step/screen
  clientId: string
}) => {
  // POST /api/support/ticket
  // Creates ticket in support system + sends email to account manager
  // Returns: { ticketId: string }
}
```

**Contact support modal state:**
```typescript
type ModalState = 'idle' | 'typing' | 'sending' | 'sent'

const ContactSupportModal = ({ isOpen, onClose, currentStep }: Props) => {
  const [state, setState] = useState<ModalState>('idle')
  const { clientProfile } = useOnboardingContext()

  // Pre-populate name from client profile
  // Include currentStep in ticket context automatically
}
```

**Video embed configuration:**
```typescript
// Video source configured in environment or CMS
const VIDEO_CONFIG = {
  metaTokenWalkthrough: {
    src: process.env.NEXT_PUBLIC_VIDEO_META_TOKEN_URL,
    title: 'How to generate your Meta access token',
    duration: '3:42',
  },
}
```
