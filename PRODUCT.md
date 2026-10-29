# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Independently mobile adults aged roughly 50–70 who want to move more easily at home. They follow a short guided session most days, often in a living room or bedroom, sometimes from a chair or a bed. Many read at larger text sizes, use browser zoom, or tap with less precision than younger users.

## Product Purpose

Mobility (by Jah Brands LLC) is a self-guided, 60-day home movement web app. After a short questionnaire and safety check, the user picks one focus area (knees, lower back, or hips & balance) and gets a daily guided plan for it. Tagline: Feel like yourself again.

Success means the user opens the app, knows what today's session is, and finishes it without having to work out the interface.

## Positioning

One focus area and one daily plan, led by video, paced by a 2-1-3 rep rhythm (lift 2 seconds, hold 1 second, lower 3 seconds), across three named 20-day phases with re-checks on Day 30 and Day 60. Calm, self-paced, home-based. It is not a class, a community or a coaching service.

## Operating Context

- Phases: 1 Get familiar (Days 1–20), 2 Practice them (Days 21–40), 3 Stay with it (Days 41–60). Re-checks on Day 30 and Day 60.
- Positions: chair, standing, floor or bed.
- Each exercise will get an AI-generated video clip; until then a placeholder stands in.
- Exercise data (apps/mobile/src/data/library-slim.json, 56 exercises) is DRAFT and has not been clinically reviewed.

## Capabilities and Constraints

- No backend, auth, payments or analytics in the logged-in shell prototype; data is local.
- No coaches and no social features at launch. A local activities guide for people 50+ is planned for later; it is not built yet.
- Real plan generation, questionnaire and safety screening exist only as funnel prototypes; the logged-in shell uses a hardcoded sample Knees plan.

## Brand Commitments

- Colors: Forest #1A2E24, Cream #F7F4EE, Brass #C9A45C. Brass is a fill or accent only; never Brass text on Cream. Forest text on Brass is allowed.
- Fonts: Fraunces for headings, Source Sans 3 for everything else. No other faces.
- Never state or imply the program is clinically reviewed, approved or prescribed.
- No coaches, live events, community or social features, user counts, ratings or testimonials.
- Every exercise screen shows: Stop if this causes pain.
- Interface patterns may be borrowed from Sweatpals; its branding, logo, fonts, photos, copy, social proof and "Create an Experience" pattern may not.

## Evidence on Hand

- 56 draft exercises with setup, cues and safety notes taken from source videos (library-slim.json). Cue and safety text is used verbatim; do not edit it or add claims.
- No real exercise video yet, no photography, no testimonials, no user numbers. Do not fabricate any of these.

## Product Principles

1. Today first: the next thing to do is always obvious and one tap away.
2. Calm over clever: familiar patterns, generous targets, nothing that hurries the user.
3. Name everything: phases carry names and day ranges, controls carry text labels; color and icons only reinforce.
4. Honest about what it is: draft content stays labeled as draft, and safety copy is never softened.

## Accessibility & Inclusion

- Minimum text size 18px everywhere, including tags and captions.
- Minimum 56px height for every button, chip, tab, input and tappable row.
- Visible 3px Forest focus ring with a Cream offset.
- Works at 200% browser zoom and at 360px width; respects prefers-reduced-motion.
- No horizontal-scroll-only carousels: visible previous/next buttons and a See all link on every row.
- WCAG 2.2 AA as the floor.
