# Mobility — architecture and implementation plan

**Status:** research prototype and product UI. Not clinically validated. Not a medical device. Not authorized to prescribe exercise.

## 1. Product understanding

Mobility is a premium, video-guided **60-day everyday movement journey** for independently mobile adults roughly aged 50–70. The emotional promise is **“Feel like yourself again.”**

It is **not**:

- a coaching marketplace
- a weightlifting or physique app
- an automated diagnosis or rehabilitation service
- a fall-prevention medical program

It **is** a structured calendar of education, short guided movement previews, recovery, and self-reported progress toward everyday goals (longer walks, easier chair rises, more comfortable workdays, easier mornings).

Primary personas:

- **Carol, 68** — walking confidence and independence. In the research spec, a real fall history would hold automated exercise. The in-app Carol journey is a **labeled demonstration profile**, not a clinical case.
- **Deb, 56** — workday stamina and stiffness. Also available as a labeled demonstration profile.

## 2. What already existed

The GitHub repo `MYWAY-` contained only an empty `README.md`. There was **no mobile app, no FastAPI tree, and no iOS project**.

The useful foundation lived in the uploaded research package (v2 conservative backend + safety + docs):

| Asset | Reuse |
|---|---|
| 61-exercise candidate library | Content catalog + approval gates. None are clinically cleared. |
| 61-exercise audit | `v2_mvp_classification` is the delivery gate. 13 introductory *review* candidates; 48 withheld or excluded. |
| 15 source transcripts (T01–T15) | Provenance only. Do not embed YouTube video or copy scripts. |
| 36-question questionnaire | Source of truth for screening. Grouped in UI; never silently defaulted to “No.” |
| 4 pathway definitions | Plan selection is from these pathways, not free-form AI. |
| 60-day calendar CSV | Phase, day type, check-in cadence. Research planning only. |
| Safety / pathway / QA / regulatory docs | Product and legal boundaries. |

The original FastAPI ZIP was **not present as runnable code**—only extracted data and documents. This repo implements a faithful research API from those contracts rather than inventing a new clinical engine.

## 3. Missing functionality (now being built)

- Premium iOS-ready client matching the Claude Design screens
- Working navigation, persistence, and demo/production separation
- Grouped onboarding + fail-closed safety outcomes
- 60-day program engine bound to pathways and the calendar
- Video/content manifest with approval status
- Guided player, check-ins, progress, milestones
- Research FastAPI that serves content and stores *demo* records only

## 4. Stack

| Layer | Choice |
|---|---|
| Mobile client | React 18 + TypeScript + Vite + React Router |
| iOS wrapper | Capacitor 6 (`apps/mobile`) so the project can be opened in Xcode |
| Design system | CSS tokens + reusable components from the Claude screens |
| Persistence (demo) | Capacitor Preferences / localStorage, clearly labeled demo mode |
| API | FastAPI research server in `backend/` |
| Data | Versioned JSON/CSV under `backend/data/` plus `apps/mobile/src/content/` |

## 5. Safety architecture (fail-closed)

Outcomes, evaluated **only after required questions are answered**:

1. `emergency` — chest, neurologic, saddle numbness, bladder/bowel with back symptoms, infection+severe pain. No movement. Urgent-care copy.
2. `clinical_review` — falls, unsteadiness, surgery, injury, clinician limits, worsening/unexplained pain, dizziness, unclear diagnoses, unknown answers. Plan on hold.
3. `out_of_scope` — age outside 50–70. No automated sessions.
4. `provisionally_eligible` — complete answers, no flags. User may **preview** program structure. **No approved prescription.**

Rules that must stay true:

- Unanswered safety questions are `unknown`, never coerced to “No.”
- `clinical_only`, `review_required`, `SPECIALIST_REVIEW_ONLY`, `EXCLUDED`, and `NOT_IN_STARTER_REQUIRES_REVIEW` never appear as unlocked live sessions.
- Introductory candidates may appear only as **Demonstration** previews.
- Check-ins can pause the next session; they never auto-progress difficulty.
- No LLM diagnoses or restriction overrides.

## 6. Content and video administration

Each exercise and education clip is a manifest record (id, titles, local/remote URL, alt URL, captions, instructions, category, source ids, pathway, eligibility, **approval status**, dose-as-design-only, contraindications, version).

Developers assign media without redesigning UI:

```bash
python scripts/assign_video.py --exercise seated_knee_extension --url /videos/seated_knee_extension.mp4
```

Until original films exist, the player uses bundled placeholder media and illustration stills.

## 7. Demo vs production

| | Demo | Production (not claimed ready) |
|---|---|---|
| Identity | Fictional Carol / Deb or a local development profile | Real auth (to be designed) |
| Health answers | Local only, labeled demo | Encrypted server, consent, deletion, legal review |
| Sessions | Marked Demonstration | Only clinician-approved content |
| API | Optional localhost FastAPI + SQLite | Hardened service; do not expose the prototype |

**Do not store real sensitive health information in this prototype.**

## 8. Decisions made so we can build

The brief asked for decisions. These are the defaults used in this iteration:

1. **Tab order follows the Claude designs:** Home · Progress · My Plan · Profile.
2. **Onboarding chrome is the 6-step design;** the 36 safety questions are grouped inside step 5 with their own progress (“Keeping you safe”).
3. **Carol and Deb are Explore Demo profiles** so the Day 14 UI can be reviewed without bypassing safety for a real user who reports falls.
4. **Fresh onboarding is fail-closed** and can land on the hold screen.
5. **Day 1** is the draft “Build Stronger Support for Your Knees” session from the brief.
6. **No real authentication** yet — Sign In resumes a local/demo profile.
7. **Capacitor iOS project** is configured; a Mac + Xcode is required to run on a phone.

Open items that still need the product owner later: final filmed videos, clinician sign-off, legal/privacy counsel, production auth/database, and whether age 50–70 is a hard gate or a soft recommendation in marketing.
