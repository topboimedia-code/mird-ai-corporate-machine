# USER-JOURNEYS.md
# Make It Rain Digital — Complete User Journey Maps
# Version 1.0 | March 2026

---

## JOURNEY MAP LEGEND

```
STEP        → a discrete action or moment
EMOTION     → how the user feels (1-5 scale: 1=anxious, 3=neutral, 5=confident)
DATA        → what data is flowing in/out of the system at this point
FRICTION    → pain points or risk moments
DELIGHT     → moments of positive surprise or confirmation
SYSTEM      → what the MIRD system is doing in the background
```

---

## JOURNEY 1: New Client Onboarding
**"From Signed Contract to First Appointments on Calendar"**

**User:** Marcus Johnson (Realtor team leader, just signed MIRD contract)
**Duration:** 20-40 minutes active time | 4-7 days total from signature to launch
**Entry point:** Receives "Welcome to RainMachine" email with onboarding portal link

---

### Phase A: Pre-Portal (0-2 minutes)

**STEP 1.1 — Email received**
- Context: Marcus just signed the contract. He's at his desk between showings.
- Emotion: 3.5/5 — excited but skeptical. He's invested money. He wants this to work.
- Data flowing: MIRD sends automated welcome email triggered by contract CRM webhook
- The email subject: "RAINMACHINE INITIALIZING — Complete your setup"
- Email body: MIRD branding, 3 sentences, one CTA button "[BEGIN SETUP]"
- FRICTION: Email lands in promotions tab. Delay between signing and email delivery.
- DELIGHT: Subject line feels different — technical, not "Thank you for signing up!"
- SYSTEM: Onboarding portal token generated and embedded in link. Token logged with client ID.

**STEP 1.2 — Opens onboarding link**
- Context: Clicks link on desktop browser
- Emotion: 3/5 — slightly anxious. "How hard is this going to be?"
- Data flowing: Token validated, client record retrieved, portal personalized with client name
- UI moment: Page loads — dark background, geometric grid appears, MIRD logo pulses, "WELCOME, MARCUS" appears
- FRICTION: If Marcus is on mobile, portal is responsive but optimal on desktop — soft redirect suggestion shown
- DELIGHT: The immediate personalization. "It already knows my name."
- SYSTEM: Onboarding session opened, timestamp logged, progress state initialized at Step 0

---

### Phase B: Active Setup (15-25 minutes)

**STEP 1.3 — Step 1: Contract Confirmation**
- Emotion: 3.5/5 — reading carefully, this is a trust moment
- Data flowing: Contract data pulled from CRM and displayed (client name, package, price, start date)
- UI moment: Contract details pre-filled — Marcus sees his name, his package, his start date. He checks the box. Types his name.
- FRICTION: If contract details are wrong, he has no edit path — needs to contact MIRD. This must be flagged clearly: "Details look wrong? [CONTACT US]"
- DELIGHT: He doesn't have to type much — everything is already filled in. It feels like a handoff, not a form.
- SYSTEM: Checkbox + name logged with timestamp. Stage advanced to Step 1 complete.

**STEP 1.4 — Step 2: Business Information**
- Emotion: 3.5/5 — comfortable, this is familiar territory
- Data flowing: Form data → client profile record
- UI moment: Types in his markets, target audience, average transaction value. This feels like briefing a new employee.
- FRICTION: "Average transaction value" field — some clients don't know if this means list price or commission. Label should clarify: "Average home sale price in your market"
- FRICTION: Free-text fields are risky if clients are too brief ("realtors") — the system needs this data to target well. Validation should gently push for specificity.
- DELIGHT: "MISSION PARAMETERS" framing makes him feel like he's configuring a weapon, not filling out a form.
- SYSTEM: Business data saved to client record, ready to feed into campaign build and AI targeting brief.

**STEP 1.5 — Step 3: Meta Ads Connection**
- Emotion: 2/5 — this is where clients get nervous. "I have to give them access to my ad account?"
- Data flowing: Token input → Meta API verification call → status response
- UI moment: Guided walkthrough with numbered sub-steps. "Open Meta Business Manager" opens in a new tab so he doesn't lose his place.
- FRICTION: Meta Business Manager is complex. He may not know what a System User is. He may not have the right permissions. He may need to call his office manager.
- FRICTION MITIGATION: "Having trouble?" help section. Video walkthrough link. "Save and come back later" option — his progress is preserved.
- FRICTION: Token copy-paste often fails on mobile if Meta is on phone and portal is on desktop. Cross-device flow needs to be documented.
- DELIGHT: When he pastes the token and clicks VERIFY — the scanning animation plays, and then "META ADS CONNECTED — SYSTEM USER ACTIVE" appears in green. First major win.
- SYSTEM: Token validated via Meta API. System User permissions confirmed. Client record updated: meta_connected = true.

**STEP 1.6 — Step 4: Google Ads + GMB**
- Emotion: 2.5/5 — slightly more confident after Meta success, but Google is another hurdle
- Data flowing: Google Ads Customer ID → manager account invitation sent by MIRD, client clicks accept
- UI moment: He pastes his Customer ID. MIRD instructions tell him to accept the manager invite in Google Ads. He switches tabs, accepts, switches back, clicks "CHECK STATUS."
- FRICTION: Google invitation acceptance is async — he may need to wait 5-10 minutes for the system to detect it. The UI should say "STATUS: INVITATION SENT — CHECK AGAIN IN A FEW MINUTES" not keep a spinner running.
- DELIGHT: Google My Business search autocomplete finds his business listing. He clicks it. It's his real business with his real reviews. The system recognizes him.
- SYSTEM: Google Ads link request sent via API. GMB business ID stored. Polling job started to detect invitation acceptance.

**STEP 1.7 — Step 5: Creative Assets + Launch Preferences**
- Emotion: 4/5 — on the home stretch, feels accomplished
- Data flowing: Files uploaded → storage bucket, launch date → campaign build queue
- UI moment: Drags his logo and property photos into the upload zones. Selects launch date. Types his cell number.
- FRICTION: File size limits may frustrate him if he has large property videos (>500MB). Clear limit messaging upfront.
- DELIGHT: Uploaded files appear with thumbnail previews. The portal looks like it's ingesting intelligence. It feels alive.
- SYSTEM: Files stored to CDN bucket, file metadata saved to client record. Launch date set in campaign build queue. SMS number stored for notifications.

---

### Phase C: Completion + Handoff (1-2 minutes active, 4-7 days system)

**STEP 1.8 — Completion Screen**
- Emotion: 4.5/5 — strong positive moment. He's done it.
- UI moment: Progress bar fills to 100%. Logo glows. "RAINMACHINE INITIALIZING." Timeline shows what happens next with real dates.
- DELIGHT: "Add Launch Date to Google Calendar" — one click. Concrete. Real. He's not waiting for an email — he has it in his calendar.
- SYSTEM: Onboarding completed webhook fires → Notion task created for MIRD team → Slack notification to Shomari → Client status updated to "ONBOARDING COMPLETE — BUILD IN PROGRESS"

**STEP 1.9 — Campaign Build Period (background, 2-4 days)**
- Marcus: No required action. May receive proactive SMS updates from MIRD team.
- SYSTEM: MIRD team builds campaign structure. Ad creatives designed from assets uploaded. Audiences configured.

**STEP 1.10 — Campaigns Go Live**
- Marcus receives SMS: "Your RainMachine campaigns are live. Log in to see your first data at dashboard.makeitrain.digital"
- Emotion: 5/5 — excitement, anticipation
- SYSTEM: Campaign launch logged. Dashboard data begins populating. First data sync within 24 hours.

**STEP 1.11 — First Lead Appears on Dashboard**
- Marcus logs in for the first time
- Dashboard shows: LEADS THIS WEEK: [1], first lead card visible
- DELIGHT: The machine he just set up is working. He can see it.
- SUCCESS STATE: Marcus has transitioned from new client to active operator.

---

**Journey 1 Success Metrics:**
- Completion rate: target >85% of clients complete all 5 steps within 48 hours
- Friction point: Step 3 (Meta) has highest abandonment risk — monitor and optimize
- Time-to-complete target: <25 minutes active time
- Days-to-first-lead target: <10 days from contract signature

---

## JOURNEY 2: Marcus's Weekly Dashboard Check
**"Login → Review → Claude AI Question → Action"**

**User:** Marcus Johnson
**Frequency:** 2-3x per week, typically Monday morning and Thursday evening
**Duration:** 8-15 minutes
**Device:** Desktop (Monday AM at office), mobile (Thursday PM between showings)

---

### Phase A: Login + System Orientation (1-2 minutes)

**STEP 2.1 — Opens dashboard URL (or taps app shortcut)**
- Context: Monday morning, 8:45 AM. Coffee in hand. Before first showing.
- Emotion: 3.5/5 — routine, but carries a low-grade "is the machine working?" anxiety
- Data flowing: Auth session validated, fresh data synced from Meta and Google APIs
- UI moment: Login loads. Page boots — grid appears, logo pulses, panels enter with 80ms stagger, numbers count up.
- DELIGHT: The boot-up sequence. Every time he opens it, it feels like the system is coming online for him. Not just loading — initializing.
- SYSTEM: Session authenticated, 15-minute API sync triggered, Claude weekly report checked for freshness.

**STEP 2.2 — System Status Header registered**
- Emotion: 4/5 — if he sees "● RAINMACHINE SYSTEM — ONLINE" in green, immediate relief. The machine is running.
- If he sees an alert indicator in the header: "⚠ 1 ITEM REQUIRES ATTENTION" — emotion drops to 2.5/5
- Data: Live system status from last 15-minute health check
- FRICTION: If the status shows degraded (yellow) for unclear reasons, he feels anxious with no way to understand why
- DELIGHT: Green online status is a silent affirmation — he doesn't have to do anything. The machine is working.

---

### Phase B: Dashboard Scan (3-5 minutes)

**STEP 2.3 — Panel 1: Lead Acquisition scan**
- Emotion: 4/5 (if metrics are up) or 2/5 (if CPL spiked or leads dropped)
- Reads: LEADS THIS WEEK, CPL, AI CALL SUCCESS RATE
- Decision: If CPL is up significantly → mental note to investigate further
- Data: Meta + Google API sync, call data from AI calling system
- UI moment: Numbers have already counted up by the time he reaches this panel. He reads them like a military briefing.

**STEP 2.4 — Panel 2: Pipeline scan**
- Emotion: 4/5 standard, 5/5 if appointments booked is high
- Focus on: APPOINTMENTS BOOKED, SHOW RATE
- This panel gives him the answer to "is the machine turning leads into appointments?"
- DELIGHT: Seeing APPOINTMENTS BOOKED: [8] this week with a progress ring at 73% show rate. He's running a professional operation.

**STEP 2.5 — Panel 3: Agent Performance scan**
- Emotion: 3.5/5 — more managerial than personal
- Focus: Are all agents active? Is anyone underperforming?
- He might mentally note to check in with an underperforming agent
- FRICTION: If an agent has 0 conversions, he doesn't know if that's normal (new agent) or a problem (ignoring leads) without more context

**STEP 2.6 — Panel 4: Campaign Intelligence scan**
- Emotion: 3.5/5 — least intuitive panel for a non-technical user
- Focus: Are the numbers going in the right direction? ROAS > 2x is good. CPL under $30 is good.
- He doesn't dig into creative performance here — that's for the detailed view
- FRICTION: ROAS number means different things on Meta vs Google. A single combined number may be misleading.

---

### Phase C: Claude AI Interaction (3-5 minutes)

**STEP 2.7 — Notices Claude AI Intelligence Panel**
- After the 4 panels, he sees the weekly brief at the bottom
- Emotion: 4/5 — curious, this is the "summary" he actually reads
- Data flowing: Claude-generated narrative loaded from weekly report run
- UI moment: He reads the first 3 sentences. The writing is clear, direct, like an analyst briefing.

**STEP 2.8 — Reads key finding**
- Report: "This week your cost per lead improved 12% to $21.40. Appointment show rate was 71%, above the 65% industry benchmark. Your top performer this week was Sarah Chen with 8 conversions."
- Emotion: 4.5/5 — he gets his week's performance in 30 seconds. He's a CEO, not a data analyst.
- DELIGHT: He didn't have to pull reports. He didn't have to do math. An AI analyst told him.

**STEP 2.9 — Types a follow-up question**
- Trigger: Something in the report makes him curious. CPL is good, but he notices Meta spend went up.
- He types: "Why did my Meta spend increase this week but leads stayed flat?"
- Emotion: 3.5/5 — curious, testing the system
- Data flowing: Query sent to Claude with context: this week's campaign data, last week's data, creative performance data
- UI moment: "PROCESSING QUERY..." with pulsing dots (1.5s)

**STEP 2.10 — Reads AI response**
- Response: "Meta added your campaign to a learning phase after we updated your audience targeting on Tuesday. During learning phases, CPM tends to rise 20-30% while the algorithm finds optimal users. This is expected and typically resolves within 3-5 days. No action needed."
- Emotion: 5/5 — relief + confidence. He understood the situation. He doesn't need to call anyone.
- DELIGHT: The answer is specific, uses his real data, and tells him what to do (nothing). He feels informed.

---

### Phase D: Action (1-2 minutes)

**STEP 2.11 — Takes one action (optional)**
- Based on the dashboard review, he might:
  a) Do nothing — machine is running (most common outcome, and that's success)
  b) Navigate to Leads view to follow up on a specific lead
  c) Navigate to Agents view to check in on an underperformer
  d) Ask another Claude question
- Emotion: 4/5 — he's in control
- SYSTEM: No actions required from Marcus for the machine to keep running

**STEP 2.12 — Closes dashboard**
- Emotion: 4.5/5 — satisfied. He knows his business status without spending an hour reviewing spreadsheets.
- SUCCESS STATE: Marcus spent 12 minutes, reviewed his full operation, got a specific answer to a specific question, and has confidence the machine is working.

---

**Journey 2 Success Metrics:**
- Dashboard session length: target 8-15 minutes (not less — that means he's not engaging; not more — that means the UI is confusing)
- Claude AI query rate: target >60% of sessions include at least one AI question
- Action rate after Claude response: target <30% of sessions require any action (success = no action needed)

---

## JOURNEY 3: Shomari's 30-Minute CEO Loop
**"Morning → Midday → Evening"**

**User:** Shomari (MIRD CEO and sole operator)
**Frequency:** Daily
**Total active time:** 30 minutes spread across the day
**Device:** Desktop only

---

### Morning Loop (10 minutes, 7:00-7:30 AM)

**STEP 3.1 — Opens CEO Dashboard**
- Context: First working task of the day. Coffee made, no meetings for 45 minutes.
- Emotion: 3.5/5 — focused, scanning for anomalies. "Did anything break overnight?"
- Data flowing: Overnight agent runs completed. New alerts generated if thresholds breached.
- UI moment: Command Center loads. Timestamp shows current time. North Star bar shows MRR, growth, client count, churn.
- FIRST SCAN: North Star bar. If all 4 metrics are green → immediate relief. If any are amber/red → priority investigation.

**STEP 3.2 — Alert Tray review**
- Emotion: depends on alerts. 0 alerts = 5/5 confidence. 2+ alerts = 2.5/5 concern.
- Data: Agent-generated escalations from overnight runs
- TYPICAL MORNING: 0-1 alerts (most weeks). Occasional CPL spike or client connection issue.
- If alert: clicks INVESTIGATE → opens client detail page → reviews metrics → either:
  a) Confirms it's a false alarm → dismisses alert
  b) Flags it for human follow-up → creates note or Slack message to himself
- Time budget for alert: 3-5 minutes each. If more than 2 alerts, this becomes the full session.
- FRICTION: If every week has 3+ alerts, Shomari loses confidence in the alert system. Thresholds must be calibrated correctly to avoid alert fatigue.

**STEP 3.3 — 4 Department Panel scan**
- Target: 2 minutes total across all 4 panels (30 seconds each)
- Scans for: any metric in red or amber. If everything is green, moves on.
- Dept 1 (Growth): "Calls booked this week: 8. On track." Mental note if below 5.
- Dept 2 (Ad Ops): "Active campaigns: 47. CPL health: 82%. 2 clients at risk." → will check in midday loop.
- Dept 3 (Product): "Onboarding queue: 3. n8n uptime: 99.7%. Good."
- Dept 4 (Finance): "MRR: $47,200. Growth: +8.4%. No churn." → week is on track.
- DELIGHT: Seeing all 4 departments in the green feels like looking at a healthy trading desk. Everything is running. He can focus on growth, not operations.

**STEP 3.4 — Client Health Grid scan**
- Scans for any clients showing amber or red health scores
- If any AT RISK: clicks that client card → opens client detail → 2 minutes reviewing what's wrong
- This morning: 2 clients in amber. Both flagged by Ad Ops agent already (matches Step 3.2).
- Decides one requires action (CPL spike is real), one is a false alarm (new campaign learning phase).
- Emotion: 4/5 — he caught the real issue early in the day.

**STEP 3.5 — Morning loop complete**
- Time elapsed: 8-12 minutes
- Emotion: 4/5
- Action taken: 1 note to follow up on Johnson Realty CPL spike in midday loop
- SUCCESS STATE: Shomari has a full picture of MIRD's operational status in under 12 minutes.

---

### Midday Loop (10 minutes, 12:30-1:00 PM)

**STEP 3.6 — Returns to CEO Dashboard**
- Context: Post-lunch check. Following up on morning flag.
- Emotion: 3.5/5 — focused, purposeful
- Opens: Johnson Realty client detail page directly (bookmarked or via recent clients)

**STEP 3.7 — Client Deep Dive: Johnson Realty**
- Reviews: CPL trend chart (30-day), recent campaign changes, agent activity log
- Data: Campaign data synced from Meta API + Ad Ops agent's analysis notes
- Finds: Campaign audience targeting was changed by the Ad Ops agent on Tuesday → learning phase → CPL spike
- Emotion: 4/5 — he understands the situation. Not a real problem.
- Decision: No action needed. Clears the alert.
- SYSTEM: Alert dismissed, dismissal logged with timestamp and note.

**STEP 3.8 — Financial Intelligence check (2 minutes)**
- Quick check on MRR trend chart
- Reviews any new invoices or payment confirmations
- Emotion: 4.5/5 if MRR trend is up-and-right
- DELIGHT: The 90-day forecast showing $51,400 is a motivating number. He can see where the business is going.

**STEP 3.9 — Midday loop complete**
- Time elapsed: 8-10 minutes
- Actions taken: 1 alert dismissed with note
- SYSTEM: Agent Activity Log updated with Shomari's action

---

### Evening Loop (10 minutes, 5:30-6:00 PM)

**STEP 3.10 — Agent Activity Log review**
- Context: End of operational day. Full review of what the autonomous agents did today.
- Emotion: 3.5/5 — curious, reviewing the team's work
- Data: All 4 agent logs from today's runs
- UI moment: Each department's log is expandable. He scans for anomalies in the action lists.
- Checks: Did all agents run on schedule? Any errors? Any unexpected actions?
- Typical: "48 actions completed, 1 alert raised (already dismissed), all agents ran on schedule."
- DELIGHT: Seeing 48 automated actions that he didn't have to take is the power of the system made visible.

**STEP 3.11 — Growth pipeline review (if it's Monday)**
- Weekly: Checks Dept 1 panel for calls booked this week vs. target
- Reviews DBR pipeline — any prospects close to converting?
- Decides whether outbound volume needs adjustment
- Time: 5 minutes on Mondays

**STEP 3.12 — Daily loop complete**
- Total time: ~30 minutes spread across 3 check-ins
- Emotion: 4.5/5 — satisfied, in control, confident
- SUCCESS STATE: Shomari ran a complete CEO review in 30 minutes. The autonomous departments have done their work. He's identified and resolved 1 real issue. The machine is running.

---

## JOURNEY 4: Lead Enters System → AI Called → Appointment Booked
**System Journey — No Human Operator Required**

**Actors:** Lead (external), MIRD AI Calling System, RainMachine Dashboard, Marcus (passive observer)
**Duration:** 0-5 minutes (most of the journey is automated and sequential)

---

**STEP 4.1 — Lead submits form (Meta or Google)**
- Time: T+0:00
- Actor: Lead (John Martinez, buyer lead from Metro Phoenix Meta campaign)
- Data created: Name, phone, email, form answers, source, campaign ID, ad ID, timestamp
- SYSTEM: Meta webhook fires → n8n receives payload → lead created in MIRD CRM → lead assigned to next agent in round-robin (Sarah Chen)

**STEP 4.2 — AI Call Initiated (within 60 seconds)**
- Time: T+0:45 (avg)
- Actor: MIRD AI Calling System
- Data flowing: Lead phone number, script parameters (buyer intent, Phoenix market, Sarah Chen's intro)
- Call outcome tree:
  - CONNECTED → proceed to STEP 4.3
  - NO ANSWER → schedule retry (30 min, 2hr, next day)
  - VOICEMAIL → leave pre-recorded message → schedule retry
  - BAD NUMBER → flag lead for manual review
- SYSTEM: Call initiated, status updated to CALLING

**STEP 4.3 — AI Conversation (connected)**
- Time: T+1:45 (avg call start)
- Duration: 3-7 minutes
- AI qualification questions:
  - "Are you still looking for a home in the Phoenix area?"
  - "What's your timeline — are you looking to buy in the next 30-90 days?"
  - "Have you been pre-approved for a mortgage yet?"
- Data created: Qualification status, timeline, pre-approval status, call recording, call transcript
- SYSTEM: Real-time transcript generated, intent signals scored

**STEP 4.4 — Appointment Booking**
- Time: T+6:00 (avg)
- If lead qualifies (timeline <90 days, interested): AI offers appointment with Sarah Chen
- "Sarah has availability Thursday at 10 AM or Friday at 2 PM — which works for you?"
- Lead: "Thursday at 10 works."
- SYSTEM: Appointment created in calendar integration → confirmation SMS sent to lead → Marcus's dashboard updated → Sarah Chen notified via SMS

**STEP 4.5 — Dashboard Update (live)**
- Time: T+6:30 (within 30 seconds of booking)
- Marcus (if dashboard is open): APPOINTMENTS BOOKED metric ticks up by 1
- New lead card appears in Leads view with status "APPOINTMENT SET"
- Call summary generated by Claude: 2-3 sentences summarizing the call and qualification
- SYSTEM: Lead record fully updated, call data stored, Sarah's performance metrics updated

**STEP 4.6 — Appointment Reminder Sequence**
- T+24hr: SMS reminder to lead
- T+2hr before: SMS reminder to lead + notification to Sarah
- SYSTEM: Automated, no human action required

**STEP 4.7 — Appointment occurs**
- If shows: Sarah marks as SHOWED in CRM
- If no-shows: Lead marked NO SHOW, re-engagement sequence triggered

**Journey 4 Success Metrics:**
- Lead-to-call time: target <90 seconds
- AI connection rate: target >60% of leads connected on first attempt
- AI qualification rate: target >40% of connected leads qualify
- AI-to-appointment rate: target >25% of connected leads book appointment

---

## JOURNEY 5: At-Risk Client Flagged → Shomari Notified → Action Taken
**Internal Escalation Journey**

**Trigger:** Johnson Realty's CPL spikes 47% week-over-week
**Actors:** MIRD Ad Operations Agent, CEO Dashboard, Shomari, Marcus (client)
**Duration:** Detection to resolution: 24-72 hours

---

**STEP 5.1 — Agent Detection**
- Time: Tuesday 7:15 AM (scheduled agent run)
- SYSTEM: Ad Operations Agent runs routine campaign health check
- Comparison: This week CPL = $36.20 vs. last week CPL = $24.50 (threshold: >20% increase)
- Decision: Threshold breached → escalation triggered
- Data created: Escalation record with: client ID, metric, current value, comparison value, % change, timestamp, agent ID

**STEP 5.2 — Alert Created in CEO Dashboard**
- Time: T+0:30 (seconds after detection)
- Shomari opens CEO Dashboard at 7:30 AM and sees in Alert Tray:
  "[!] CLIENT AT RISK — Johnson Realty — CPL +47% WoW — Flagged by Ad Operations Agent 07:15 UTC"
- Emotion: 2.5/5 — concern. This is a real client paying $2,200/month.
- Client Health Grid: Johnson Realty card has shifted from GREEN to AMBER
- DELIGHT: The agent caught it before Shomari or Marcus noticed. Early detection is the value.

**STEP 5.3 — Shomari Investigates (CEO Dashboard)**
- Time: T+15 minutes (Shomari's morning loop)
- Clicks [INVESTIGATE →] on alert → opens Johnson Realty client detail
- Reviews: CPL 30-day trend chart (clear spike visible from Tuesday), campaign-level breakdown
- Finds: Campaign targeting update made by Ad Ops agent on Monday → learning phase → CPM increase
- Decision tree:
  - If learning phase: expected behavior, alert is informational, dismiss + note
  - If audience exhaustion: escalate to immediate campaign fix
  - If budget issue: review spend settings
  - If creative fatigue: escalate to creative refresh
- In this case: Learning phase identified. Expected to resolve in 3-5 days.
- Time spent: 4 minutes

**STEP 5.4 — Decision: No Immediate Client Communication Needed**
- Shomari dismisses alert with note: "Learning phase — created by targeting update Monday. Monitoring. Resolve by Friday."
- SYSTEM: Alert status → DISMISSED_MONITORING. Scheduled follow-up check created for Friday's agent run.
- Marcus's dashboard: Johnson Realty CPL shows spike but no alarm state on client-facing dashboard (client-facing thresholds are softer, or spike is noted as "LEARNING PHASE" rather than "AT RISK")

**STEP 5.5A — Resolution Path: Self-Resolving**
- Friday agent run: CPL has returned to $23.80 (below pre-spike baseline)
- SYSTEM: Monitoring flag cleared, alert fully closed, Johnson Realty health score returns to GREEN
- Shomari: Sees green health status Friday morning. No action needed.
- SUCCESS STATE: Agent caught issue, Shomari understood it in <5 minutes, no unnecessary client communication, issue self-resolved.

**STEP 5.5B — Escalation Path: Real Problem**
- If CPL remains elevated Friday: Ad Ops agent re-flags with "MONITORING ESCALATION"
- Shomari reviews again: Learning phase should have resolved. Something else is wrong.
- Digs deeper: Audience size analysis, creative performance breakdown
- Finds: Target audience too narrow in Phoenix after iOS 17 tracking changes
- Takes action: Updates campaign brief, coordinates with Meta campaign team
- Client communication: Shomari (or automated MIRD report) gives Marcus proactive update: "We identified a targeting refinement needed and have implemented a fix. CPL expected to normalize in 7 days."
- Marcus receives this via weekly report or direct MIRD communication
- DELIGHT for Marcus: He was told proactively. He didn't have to ask. The system found the problem before he noticed.

**STEP 5.6 — Post-Resolution Review**
- After resolution: Ad Ops agent documents fix in client record (Timeline tab in Client Detail)
- Financial: No MRR impact if issue resolved within standard SLA
- Learning: Threshold calibration — should 47% spike trigger an alert, or should it be 30%? Data from this incident feeds back into threshold tuning.

**Journey 5 Success Metrics:**
- Detection-to-alert time: target <1 hour
- Shomari review time: target <5 minutes to understand and decide
- False positive rate: target <20% of alerts require no action
- Client-notified-before-they-noticed rate: target 100% of real issues caught proactively

---
