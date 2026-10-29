# Mobility

A personalized 60-day everyday movement app for independently mobile adults around 50–70.

**Feel like yourself again.**

This repository is a working product prototype: a premium iOS-ready client plus the research FastAPI from the conservative v2 backend package. It is **not** clinically approved, **not** a medical device, and **not** authorized to prescribe exercise.

## What’s here

| Path | Purpose |
|---|---|
| `apps/mobile` | React + TypeScript + Vite + Capacitor client matching the Claude Design screens |
| `backend` | Fail-closed research API, exercise catalog, intake, check-ins |
| `backend/data` | 61 exercises, 15 sources, 36-question screening, 4 pathways, 60-day calendar |
| `docs` | Program spec, safety, pathway, privacy, and architecture notes |
| `scripts/assign_video.py` | Replace placeholder videos without redesigning the UI |

## Run locally

Terminal 1 — API:

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Terminal 2 — app:

```bash
cd apps/mobile
npm install
npm run dev
```

Open http://localhost:5173. The public front door is the landing page. The free path is `/safety`, then `/check-in`, then the `/plan` preview and `/signup` placeholder. The existing in-app preview, including Day 1, is unchanged at `/welcome` and `/session/1`.

### Web funnel

| Route | What it is |
|---|---|
| `/` | Landing page |
| `/safety` | Safety screen before the check-in |
| `/safety/pause` | “Please check with your doctor first” |
| `/check-in/:step` | Free movement check-in, one question per screen |
| `/plan` | 60-day plan preview, with “what you told us” |
| `/signup` | Sign-up and price placeholder |
| `/session/1` | Existing Day 1 session screen |
| `/welcome` | Existing in-app welcome |

### Logged-in app shell (prototype)

Lives in `apps/mobile/src/app`. Local state only: no backend, auth or analytics. Uses a hardcoded sample Knees plan and the draft exercise data in `apps/mobile/src/data/library-slim.json` (not clinically reviewed).

| Route | What it is |
|---|---|
| `/app/today` | Today: day strip (stepper on phones), today's session, Up next, prototype day control |
| `/app/library` | Library rows; `?area=&position=&phase=&q=` shows the filtered grid |
| `/app/library/:id` | Exercise detail (preview only for later phases) |
| `/app/plan`, `/app/progress`, `/app/account` | Stubs |

The older phone-framed tab screens moved from `/app/*` to `/preview/home`, `/preview/progress`, `/preview/plan` and `/preview/profile`.

Answers stay in this browser under `mobility.movement-checkin.v1` and `mobility.safety-screen.v1`. To POST the same check-in JSON later, set `VITE_CHECKIN_API` to the endpoint URL and rebuild. A missing or failed endpoint does not erase the local copy.

`npm run build` writes a static Vite bundle. The repo `vercel.json` builds `apps/mobile` and rewrites client-side routes to `index.html`. If the Vercel project root is `apps/mobile`, that folder’s `vercel.json` does the rewrite.

### Tests

```bash
cd backend && python -m pytest tests -q
cd apps/mobile && npm test
```

### iPhone / Xcode

```bash
cd apps/mobile
npm run build
npx cap add ios    # first time, on a Mac
npx cap sync ios
npx cap open ios
```

The web app is the source of truth. Capacitor wraps `dist/` so you can run it on a phone. A Mac with Xcode is required for the native build.

## Product rules this build enforces

- Unanswered safety questions stay unknown and **never default to No**.
- Emergency, fall, surgery, restriction, or unsure answers withhold exercise.
- The 13 introductory movements appear only as **Demonstration** previews.
- Restricted movements (eyes-closed balance, floor transfers, specialist work) stay hidden.
- Check-ins can pause the next session and never auto-progress difficulty.
- Demo storage is local. Do not enter real sensitive health information.

## Adding your videos later

Put files in `apps/mobile/public/videos/`, then:

```bash
python scripts/assign_video.py --id seated_knee_extension --url /videos/seated_knee_extension.mp4
```

The player reads the content manifest, not hardcoded React clips.

## Production still required

Secure authentication, encrypted storage, clinician sign-off of each movement, filmed original media, legal/privacy review, and a decision on FDA general-wellness vs device claims. See `docs/RELEASE_CHECKLIST.md` and `docs/ARCHITECTURE.md`.
