# Template Mapping — RainMachine Landing Page
## Make It Rain Digital | makeitraindigital.com
## Date: 2026-03-31

---

## TEMPLATE DECISION

**Selected approach:** Custom standalone HTML scaffold (no external template)

**Rationale:**
- No Magic UI templates are installed locally — monorepo (Next.js) has not been scaffolded yet
- A standalone HTML file with JARVIS Dark CSS tokens is the most immediately useful deliverable:
  - Opens in browser instantly, zero build step
  - All tokens, typography, and component patterns are established for direct Next.js port
  - Serves as the living design reference for all future component work
  - Avoids any template-to-design-system mismatch (JARVIS Dark is highly specific)

**When monorepo is scaffolded (Step 10+):**
- The HTML scaffold maps 1:1 to Next.js component structure
- JARVIS Dark CSS variables → Tailwind config (TOKENS.md is the source)
- Each section becomes a `/apps/marketing/src/components/sections/` file
- Magic UI `agent-template` bento grid patterns can be adopted at that stage

---

## SECTION → COMPONENT MAPPING (For Future Next.js Port)

| Section | HTML ID | Future Next.js Component | Magic UI Analog |
|---|---|---|---|
| Nav / Sticky Header | `#nav` | `components/nav/SiteNav.tsx` | `sections/header.tsx` |
| Hero | `#hero` | `components/sections/HeroSection.tsx` | `sections/hero.tsx` |
| Trust Signal Row | `#trust` | `components/sections/TrustBar.tsx` | Custom |
| Problem Agitation | `#problem` | `components/sections/ProblemSection.tsx` | Custom |
| Solution Intro | `#solution` | `components/sections/SolutionIntro.tsx` | `sections/feature-highlight.tsx` |
| Feature Bento | `#features` | `components/sections/FeatureBento.tsx` | `sections/bento.tsx` ⭐ |
| How It Works | `#how` | `components/sections/HowItWorks.tsx` | `sections/benefits.tsx` |
| Gate Mechanic | `#gate` | `components/sections/GateMechanic.tsx` | Custom |
| Social Proof | `#proof` | `components/sections/SocialProof.tsx` | `sections/testimonials.tsx` |
| Market Exclusivity | `#markets` | `components/sections/MarketMap.tsx` | Custom |
| Pricing | `#pricing` | `components/sections/PricingSection.tsx` | `sections/pricing.tsx` |
| Guarantee | `#guarantee` | `components/sections/Guarantee.tsx` | Custom |
| FAQ | `#faq` | `components/sections/FAQ.tsx` | `sections/faq.tsx` |
| Founder / Authority | `#founder` | `components/sections/FounderSection.tsx` | Custom |
| Final CTA | `#cta` | `components/sections/FinalCTA.tsx` | `sections/cta.tsx` |
| Footer | `#footer` | `components/nav/SiteFooter.tsx` | `sections/footer.tsx` |

---

## DESIGN TOKEN INJECTION PLAN

All JARVIS Dark tokens from `docs/design/TOKENS.md` are injected as CSS custom properties in the scaffold `<style>` block. When porting to Next.js:

1. Copy CSS variables → `tailwind.config.ts` `extend.colors` and `extend.fontFamily`
2. Google Fonts import → `apps/marketing/src/app/layout.tsx`
3. Lucide React icons → `npm i lucide-react` (already specified in DESIGN-SYSTEM.md)
4. Animation keyframes → `tailwind.config.ts` `extend.keyframes`

---

## SCAFFOLD DELIVERABLE

**File:** `docs/landing-page/index.html`
**Type:** Complete standalone HTML — browser-ready, no build step
**Contents:** All 15 sections + full JARVIS Dark CSS + Google Fonts + Lucide icons (CDN) + all Phase D copy

---

*Template mapping complete: 2026-03-31*
