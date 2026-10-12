# Safety onboarding design — draft pending clinician review

**Purpose:** Screen for eligibility for a general strength/mobility wellness program; **not** diagnose, clear someone medically, predict falling, or determine the cause of pain.

## User flow
1. Before the assessment explain scope and obtain informed data consent; make emergency information accessible.
2. Ask baseline goals, function, usual activity, environment and symptom questions. Question catalog: `data/onboarding_questionnaire.json` (36 questions).
3. Ask every safety-critical question; do not allow skips/unknown to become a negative answer. Use branching for falls and pain location.
4. Check for emergency-type responses **before any exercise generation**. Show emergency services guidance appropriate to locale (US: call 911) and stop self-directed program. Do not make the app a monitoring service.
5. If unclear diagnoses, recent injury/surgery, falls, unsteadiness, clinician limitations, exercise-related symptoms or other unresolved flags: withhold automated prescription and recommend clinician review. Review should be based on professionally authored rules, not an LLM.
6. Only after completed screening + all required consents can a user enter a provisionally eligible general-wellness flow. Do not call this “medically cleared.”

## Proposed escalation behavior — not a validated triage protocol
- **Emergency concern**: acute stroke-like symptoms; new bladder/bowel dysfunction with back symptoms; saddle numbness; rapidly worsening neurologic deficits; active chest pain or related emergency symptoms. Interrupt session, advise urgent emergency evaluation. UI copy/locale reviewed clinically.
- **Prompt medical assessment / no auto-program**: recent falls, fear of falling/unsteadiness, unexplained dizziness/fainting, recent surgery, recent fracture, severe or progressively worsening pain, medical exercise restrictions, unclear serious diagnoses. Timing reviewed clinically; never tell these users they're safe to exercise from self-report alone.
- **Provisionally eligible**: complete responses, no flags, suitable age/ability and wellness goals; program remains *locked until specific pathway/exercise approvals*.

## Model data and accessibility
Explicit `unknown` allowed and safely routed to further assessment; accessible large tap targets, plain language, screen-reader labeling; do not force an age-based capability assumption. Do not require photos or cameras. Protect responses as sensitive information.

**Important:** A yes/no questionnaire cannot exclude all medical conditions. Never advertise it as a definitive safety test.
