# Mobility 60 — program backend specification v0.1

**Status: research prototype, NOT clinically validated, NOT ready to prescribe, deploy publicly or claim to treat pain.**

## 1. User and transformation
Audience hypothesis: independently mobile US adults 50–70 who want to regain everyday functional confidence. The product is not intended for recently injured users, post-operative rehab, recurrent fallers without assessment, neurological symptoms, or people requiring individual medical treatment.

Core user outcomes: walking and endurance, rising from chairs, bending/lifting, everyday work capacity, confidence in movement, optional morning-stiffness self-report. Progress is individualized and never guaranteed within 60 days.

Primary entry avatars from earlier Hike footwear voice-of-customer research: **Deb (56)**, on her feet all day and wants to finish work comfortably; **Carol (68)**, wants walking confidence and independence. Important caveat: Carol's fall history triggers the clinical-review gate and excludes her from unsupervised automatic balance exercise recommendations. Foot deformity and surgery recovery are not treated by this prototype.

## 2. Evidence foundations versus video claims
- CDC older-adult activity guidance: aerobic, muscle-strengthening and balance activities. 150 minutes moderate aerobic activity weekly is a population-level target, not an automatic requirement for every beginner.
- NICE NG226: tailored local strengthening, aerobic conditioning, education, and consistency are recommended for osteoarthritis. This does not certify any specific video routine.
- WHO 2023 chronic primary lower-back-pain guidance: exercise and education *may* be offered as components of person-centered care; it does not establish one best approach for everyone.
- CDC STEADI: provides clinical assessment methods for falls. Its tests are not to be turned into unsafe unsupervised app challenges; brief screening never rules out all fall risks.

Reference URLs: https://www.cdc.gov/physical-activity-basics/adding-older-adults/index.html ; https://www.nice.org.uk/guidance/ng226/chapter/recommendations ; https://www.who.int/publications-detail-redirect/9789240081789 ; https://www.cdc.gov/steadi/hcp/clinical-resources/

## 3. Source inventory
`data/sources.json` indexes **15 transcripts (T01–T15)** including videos pasted in the conversation and uploaded transcript files. `data/exercises.json` stores **61 exercises / movement candidates**, primary functional aim, difficulty tier, equipment, source IDs, and approval state. Transcript-derived exercises and instruction descriptions are a *candidate library*; metadata such as tier and functional labels are editorial mappings, not verified clinical dosage or a validated exercise taxonomy.

Transcripts with problematic claims:
- T01: common shoulder pain does not necessarily have one rotator-cuff imbalance cause; do not promise 'fix for good', immediate relief or mechanical shoulder 'decompression'.
- T03/T07: CRAWLS floor recovery is not guaranteed or safe for every older adult; a recent fall requires injury assessment before movement. No autonomous floor-transfer practice in v0.1.
- T08: McKenzie directional preference requires appropriate assessment; do not assign flexion or extension from a self-check or prompt hourly repeated bends.
- T11: **exclude eyes-closed balance/turns**, backward walking and unsupported challenged balance from self-directed MVP. Do not classify fall risk from one single-leg duration alone.
- T13: eccentric strengthening can be useful but is not categorically 'better than stretching' for every goal; overloaded calf lowering and shoulder eccentric weights require review.
- T15: kneeling after knee replacement or other surgery is not automatically appropriate; require clinician clearance.
- T02/T05: no promised pain-free outcomes, reversal of all age-related changes, universal 6,000-step targets, or mandatory 10–20% weekly increases.
- T09/T10: posture is not a universal cause of pain; no rigid 'perfect posture' prescriptions.

## 4. Onboarding data contract
The `/v1/intake` schema records: age, primary functional goal, self-reported goal difficulty, movement confidence, independent walking, recent fall/near fall, new weakness, saddle numbness, new bowel/bladder problems, unexplained serious symptoms, chest pain/breathlessness, acute injury/surgery, clinician-imposed limitations, persistent/worsening symptoms, and other concerns.

Before any consumer launch add: consent; plain-language limits and privacy notices; symptom onset/duration; impact on life; preferences/accessibility; relevant diagnoses and medications; use of supports or assistive devices; exercise environment; hearing/vision constraints; time availability; prior advice/clearance; baseline functioning; account security. These are missing in prototype, not assumed negative.

## 5. Safety routing (required)
1. **Urgent referral flag**: new bladder/bowel dysfunction, saddle numbness, new/worsening neurological weakness, chest pain/unexplained breathlessness, other serious unexplained signs. Communicate appropriate urgent/emergency medical care; never assign movement.
2. **Clinical review flag**: recent falls/near-falls, inability to walk independently, new injury/recent operation, clinician restrictions, worsening pain requiring assessment, or selected specialist pathway. No automated sessions.
3. **Out of scope**: outside 50–70 target age. No automated sessions.
4. **Research preview**: low-risk self-reported users 50–70 choosing walking/chair-rise/workday/morning-stiffness can preview program structure, but no doses are authorized or assigned.

The backend intentionally has **no clinical treatment authorization switch**. Clinical validation and a formal decision on regulated-software status are separate launch gates.

## 6. The five program phases

| Days | Phase | Experience | Data collection | Progression |
|---|---|---|---|---|
| 1–3 | Baseline | Consent/screen, goals, safe baseline reflection, explanation of program | Target activity difficulty (0–10), confidence (0–10), optional reported walk minutes | No automatic escalation |
| 4–14 | Foundation | Short movement education, strength/mobility candidate previews, routine building | Session difficulty, adverse responses, confidence | Clinician-reviewed criteria required |
| 15–30 | Strength | Repeated strength-design sessions, walking/activity design, planned recovery | Consistency and functional recheck on day 14/30 | Review repeated tolerance before considering harder variants |
| 31–45 | Capacity | Greater role of goal-specific physical capacity | Walking tolerance, goal difficulty, confidence, adverse events | No fixed percent weekly increase |
| 46–60 | Application | Focus on activities that motivated enrollment; maintenance planning | Endline goal and confidence review, dropout reasons, adverse events | Maintenance plan after review |

A 60-day **journey is not 60 workouts**. Prototype calendar pattern has two strength-design days, two activity-design days, education, recovery, and review every seven days. This is a product architecture; precise dosage and contents must be clinically finalized.

## 7. Pathway mapping
**Walking:** initial candidate exercises: assisted sit-to-stand, seated knee extension, supported hip extension, seated march, seated heel/toe raises, comfortable walking.
**Chair rise:** same basic strength candidates with priority on functional chair-rise ability.
**Workday:** assisted sit-to-stand, supported hip hinge, wall push-up, seated march, gentle seated side bend, comfortable walking.
**Morning stiffness:** gentle seated march, supine knee rolls, seated side bend, wall push-up, supported hip extension, assisted chair rise, comfortable walking. Morning stiffness with severe or inflammatory features requires clinical assessment.
**Balance / stairs / shoulder / back / kneeling / floor transfer:** *research backlog only; clinician review required*. They are not offered as automated pathways in this prototype.

## 8. Session assembly requirements for the validated future engine
1. Determine clearance and primary goal.
2. Retrieve approved (not merely candidate) movements matching prerequisites and equipment.
3. Balance stimulus across mobility, strength, aerobic activity, and—where assessed—balance.
4. Cap session volume using clinician-approved tables dependent on initial level, tolerance, and weekly recovery schedule.
5. Apply per-exercise contraindications; select assisted/alternative variants.
6. Require motion demonstration media with approved cues, what-not-to-do, and stop conditions.
7. Prompt short symptom/exertion check-in. Never interpret improvement as cured injury.
8. Pause on red flags, reconsider on symptom worsening, maintain or reduce difficulty pending defined rules.
9. Only progress when prior session response, relevant goal function, and clinician-approved thresholds allow.
10. Record algorithm version, content version, assessment response, and reason for each decision.

## 9. Check-in state machine, implemented
- Emergency/urgent flag: `pause_and_seek_assessment`
- Recent fall/near fall: `pause_and_seek_assessment`
- Symptoms worsen: `hold_no_progression_review_symptoms`
- Session very difficult / low confidence: `consider_easier_candidate_after_review`
- Easy / high confidence: `eligible_for_review_of_next_level_not_auto_progress`
- Otherwise: `hold_level_and_monitor`

**No automatic level progression is implemented**, by design. Exercise progression cannot be safely inferred from two yes/no checkboxes alone.

## 10. Progress and outcome architecture
Baseline and repeats (e.g., days 1, 14, 30, 45, 60):
- Primary: user-selected everyday activity difficulty (0–10), independently self-rated.
- Secondary: confidence (0–10), reported comfortable walking minutes where relevant, program adherence, exercise tolerance, goal attainment, reported adverse events.
- Later, if clinically approved: standardized physical performance measures such as 30-second chair stand, which require adequate instructions and safety conditions. No automated interpretation using age-specific clinical norms until properly sourced and verified.
- Never promise a 60-day cure; comparisons are within-person observations, not proof of causality.

## 11. Content and application data model
- `users`: raw research intake JSON, triage status, goal, created timestamp.
- `assessments`: goals, difficulty ratings, optional walking tolerance, confidence and qualitative notes.
- `checkins`: session responses and caution flags, with review recommendations.
- `exercises.json`: candidate exercise metadata and T01–T15 provenance.
- `sources.json`: source titles and original locations.

For production: auth, access control, data minimization, encryption in transit/at rest, audit trails, breach response, consent management, retention/deletion, clinician roles, versioned clinical content, adverse event escalation, observability and independent validation. SQLite demo is local and unauthenticated: **do not expose it to the internet** or store real health histories in it.

## 12. Non-negotiable acceptance tests before release
- A medically concerning answer yields zero exercise assignments.
- Recent fall and post-surgery cases cannot bypass clearance.
- All medications/diagnoses ambiguities have an escalation policy.
- No `clinical_only` or `review_required` exercise appears as a user-facing approved session.
- Plans never claim to diagnose, cure arthritis, replace medical treatment, or guarantee improvement.
- Every guided movement has qualified review, approved variation/dose, accessibility QA, and video demonstration.
- Substantive real-world pilot plus adverse-event reporting, and legal review of wellness/medical-device claims, are complete.

## 13. What is *not* built yet
Video assets; production mobile app; full exercise prescription tables; validated safety triage; physician/PT clearance workflows; secure accounts; medical device classification; clinician reviewed program approvals; regulatory-compliant health data stack; trials/proven efficacy; subscriptions and paywalls. The delivered API is a runnable *research and planning prototype*, not the finished medical or commercial backend.
