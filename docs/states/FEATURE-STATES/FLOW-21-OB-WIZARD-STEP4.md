# FLOW-21-OB-WIZARD-STEP4.md
# Onboarding Portal — Wizard Step 4: Google Ads Connection
# 7 screens | Step 7 Output | 2026-03-31

---

## Screen 21.1 — ob-wizard-step4-main (Customer ID + GMB Search)

**Step indicator:** Step 4 of 5 active

### ACTIVE
- **Visual:** Two sections: (A) Google Ads Customer ID input; (B) GMB search input · skip-GMB option available
- **Heading:** `GOOGLE ADS CONNECTION` (Orbitron, `heading-1`)
- **Section A:** `CUSTOMER ID` label · 10-digit input
- **Section B:** `GOOGLE MY BUSINESS` label · search input
- **CTA:** `CONTINUE` primary
- **ARIA:** Sections `aria-labelledby` · inputs `aria-label`

### SYSTEM ALERT (validation)
- **Copy:** `Customer ID is required.` / `Customer ID must be a 10-digit number.`
- **ARIA:** `aria-describedby` · `aria-invalid="true"`

---

## Screen 21.2 — ob-wizard-step4-checking-invite

**Trigger:** CONTINUE click with Customer ID entered

### PROCESSING (only state)
- **Visual:** Indeterminate shimmer bar · sequential label stagger (600ms apart):
  1. `CONNECTING TO GOOGLE ADS`
  2. `CHECKING ACCOUNT ACCESS`
  3. `SENDING INVITE`
- **Interaction:** `CANCEL` available
- **ARIA:** `aria-live="polite"` per label · `role="progressbar"` (indeterminate)

---

## Screen 21.3 — ob-wizard-step4-connected

**Trigger:** Invite sent / access confirmed

### CONFIRMED (only state)
- **Visual:** Compact success panel · `CheckCircle2` spring bounce · green border
- **Headline:** `GOOGLE ADS CONNECTED` (Orbitron, `#00FF88`)
- **Body:** `Account linked. Ready to sync.` (Inter)
- **CTA:** `CONTINUE` primary → step 5
- **ARIA:** `aria-live="polite"` → `"Google Ads connected."` · focus on CONTINUE

---

## Screen 21.4 — ob-wizard-step4-error

**Trigger:** Connection failure

### SYSTEM ALERT (only state)
- **Headline:** `GOOGLE ADS CONNECTION FAILED` (Orbitron, `#FF6B35`)
- **Body:** `Could not access this Google Ads account. Confirm the Customer ID is correct.` (Inter)
- **CTAs:** `TRY AGAIN` primary · `GET HELP` ghost
- **ARIA:** `aria-live="assertive"` · focus → banner

---

## Screen 21.5 — ob-wizard-step4-gmb-searching

**Trigger:** User enters search term in GMB search input

### PROCESSING (only state)
- **Visual:** Results area → skeleton shimmer rows
- **Copy:** `SEARCHING BUSINESS LISTINGS` (Orbitron, `#7ECFDF`)
- **Interaction:** Cancel / clear search available
- **ARIA:** `aria-live="polite"` → `"Searching business listings."`

---

## Screen 21.6 — ob-wizard-step4-gmb-results

**Trigger:** GMB search returns results

### ACTIVE
- **Visual:** List of matching GMB entries: business name · address · category · radio select
- **Copy:** `SELECT YOUR BUSINESS` (Orbitron, muted, above list)
- **CTA:** `CONFIRM SELECTION` primary (enabled after selection)
- **ARIA:** `role="radiogroup"` · each entry `role="radio"` with `aria-label`

### STANDBY (no results)
- **Visual:** Empty list · `Search` icon static
- **Headline:** `NO MATCHING BUSINESSES FOUND` (Orbitron, `#7ECFDF`)
- **Body:** `Try a different search term or skip this step.` (Inter)
- **CTA:** `SKIP GMB` ghost
- **ARIA:** `aria-label` on empty results area

---

## Screen 21.7 — ob-wizard-step4-gmb-selected

**Trigger:** User selects a business from results

### CONFIRMED → ACTIVE (selection confirmed, editable)
- **Visual:** Selection card: business name · address · `#00FF88` check badge
- **Headline:** `BUSINESS SELECTED` (Orbitron, `#00FF88`)
- **Body:** `[Business Name]` (Inter, prominent)
- **CTA:** `CHANGE SELECTION` ghost (reopens search)
- **ARIA:** `aria-live="polite"` → `"[Business Name] selected."` · selection card `aria-label`
