# CTA Variants — RainMachine
## Make It Rain Digital | makeitraindigital.com
## Date: 2026-03-31

---

## CTA STRATEGY

**Conversion goal:** Strategy call booking (consultative, high-ticket sale)
**Secondary goal:** DBR inquiry ($1,500 entry offer, lower friction)
**CTA funnel:** Primary CTA (claim market / book call) → Secondary CTA (start with DBR) → Tertiary (watch demo)

**Rule:** One primary CTA per section. Never two competing CTAs at the same scroll depth.

---

## PRIMARY CTA VARIANTS

### Variant A — Market Urgency (Recommended for hero + final CTA)
```
CLAIM YOUR MARKET →
```
**Sub-copy:** "One team per market. Strategy call, no obligation."
**Psychology:** Scarcity + Unity (your market, not ours)
**Best placement:** Hero, market exclusivity section, final CTA

---

### Variant B — Outcome-Based
```
BOOK A STRATEGY CALL →
```
**Sub-copy:** "Free, 30 minutes. We'll map out your market and show you exactly what RainMachine does."
**Psychology:** Low friction, clear next step
**Best placement:** Above pricing, FAQ section bottom

---

### Variant C — Demo / Low Commitment
```
SEE HOW IT WORKS →
```
**Sub-copy:** "3-minute product walkthrough. No signup required."
**Psychology:** Commitment & Consistency (small yes first)
**Best placement:** After hero (secondary CTA), mid-page

---

### Variant D — Pain-Led
```
STOP ROUTING LEADS MANUALLY →
```
**Sub-copy:** "Book a 30-min strategy call — we'll show you what your market looks like inside RainMachine."
**Psychology:** Problem agitation to action
**Best placement:** Bottom of problem section

---

### Variant E — DBR Entry (Lower friction, trust-building)
```
WAKE UP YOUR DEAD LEADS — $1,500 →
```
**Sub-copy:** "14-day Database Revival. AI reactivates your existing leads. See results before you commit to anything."
**Psychology:** Reciprocity + low risk entry
**Best placement:** Pricing section secondary CTA, mid-page sidebar CTA

---

### Variant F — First-Person (A/B test candidate)
```
I WANT A FULL PIPELINE →
```
**Sub-copy:** "Book a strategy call — see what RainMachine builds for your team."
**Psychology:** Commitment & Consistency — "yes ladder" language
**Best placement:** A/B test vs. Variant A in hero

---

## SECONDARY / SUPPORTING CTA COPY

### Navigation CTA (sticky header)
```
CLAIM YOUR MARKET
```
Style: Small Orbitron button, #00D4FF background, #050D1A text, 11px

---

### Social Proof Section CTA
```
JOIN THEM — BOOK A STRATEGY CALL →
```
Sub-copy: "See what RainMachine does for teams in your market."

---

### Pricing Section — Growth Plan CTA (Primary)
```
CLAIM GROWTH — $4,997/MO →
```
Sub-copy: "Market exclusivity included. One team per market."

---

### Pricing Section — DBR CTA (Secondary)
```
START WITH DATABASE REVIVAL — $1,500 →
```
Sub-copy: "Not ready to commit? See ROI first. 14 days, one-time payment."

---

### Pricing Section — Starter CTA
```
START WITH STARTER — $997/MO →
```
Sub-copy: "Up to 5 agents. Add Rainmaker Leads when ready."

---

### Guarantee Section CTA
```
BOOK WITH CONFIDENCE →
```
Sub-copy: "No appointments in 14 days? Your next month is on us."

---

### Final CTA Section (Full-width, end of page)

**Headline (Orbitron, large):**
```
YOUR MARKET IS EITHER LOCKED OR OPEN.
FIND OUT NOW.
```

**Body (Inter):**
```
One team per market gets access to Rainmaker Leads. Book a strategy call and we'll
check your market availability live — no forms, no waiting, no pressure.
```

**Primary button:**
```
CLAIM YOUR MARKET →
```

**Secondary link:**
```
Or start with a $1,500 Database Revival — see results in 14 days →
```

---

## CTA BUTTON DESIGN SPECS (JARVIS Dark)

### Primary CTA Button
```css
background: #00D4FF
color: #050D1A
font-family: 'Orbitron', sans-serif
font-size: 13px
font-weight: 700
letter-spacing: 0.12em
text-transform: uppercase
padding: 16px 32px
border-radius: 4px
border: none
box-shadow: 0 0 20px rgba(0, 212, 255, 0.30)
transition: all 200ms ease

/* Hover */
background: #1ADCFF
box-shadow: 0 0 32px rgba(0, 212, 255, 0.50)
transform: translateY(-1px)
```

### Secondary / Ghost CTA Button
```css
background: transparent
color: #00D4FF
border: 1px solid rgba(0, 212, 255, 0.40)
font-family: 'Orbitron', sans-serif
font-size: 13px
font-weight: 600
letter-spacing: 0.10em
text-transform: uppercase
padding: 14px 28px
border-radius: 4px

/* Hover */
border-color: rgba(0, 212, 255, 0.80)
background: rgba(0, 212, 255, 0.06)
box-shadow: 0 0 16px rgba(0, 212, 255, 0.15)
```

### Inline Text CTA / Link
```css
color: #00D4FF
font-family: 'Inter', sans-serif
font-size: 14px
text-decoration: underline
text-underline-offset: 3px

/* Hover */
color: #1ADCFF
```

---

## CTA PLACEMENT MAP

| Page Section | Primary CTA | Secondary CTA |
|---|---|---|
| Sticky nav | Claim Your Market | — |
| Hero (above fold) | Claim Your Market → | See How It Works (ghost) |
| Post-hero stats | — | — |
| Problem section bottom | Stop Routing Leads Manually → | — |
| Solution / features | Book a Strategy Call → | — |
| Social proof (mid-page) | Join Them — Book a Call → | — |
| Gate mechanic section | Claim Your Market → | — |
| How it works | Book a Strategy Call → | — |
| Pricing — Growth (hero tier) | Claim Growth — $4,997/mo → | Start with DBR — $1,500 → |
| Market exclusivity map | Check Your Market Availability → | — |
| FAQ bottom | Book a Strategy Call → | — |
| Guarantee section | Book With Confidence → | — |
| Final CTA (full-width) | Claim Your Market → | Or start with DBR → (link) |
| Footer | Book a Strategy Call | — |

---

## A/B TEST PRIORITY ORDER

| Test | Variant A | Variant B | Hypothesis |
|---|---|---|---|
| Hero primary CTA | "CLAIM YOUR MARKET" | "BOOK A STRATEGY CALL" | Scarcity vs. clarity — which converts higher from cold traffic |
| Hero secondary CTA | "SEE HOW IT WORKS" | "START WITH $1,500 DBR" | Demo-first vs. offer-first for low-commitment entry |
| CTA voice | "CLAIM YOUR MARKET" | "I WANT A FULL PIPELINE" | Second person vs. first person |
| Pricing primary | "CLAIM GROWTH" | "GET STARTED — GROWTH PLAN" | Branded action vs. generic action |

---

*CTA variants complete: 2026-03-31 | 6 primary variants + full placement map + design specs*
