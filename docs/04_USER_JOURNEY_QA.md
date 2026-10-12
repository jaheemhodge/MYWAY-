# QA plan — synthetic simulations, not human testing

Automated checks ensure no plan is dispensed after known flags; they do not prove medical safety. Acceptance criteria:
- Missing/unknown screening -> no automatic exercise delivery.
- Emergency-type answer -> interrupt onboarding/session; emergency instruction; audit log; no workouts.
- Recent fall, unsteadiness, surgery, fracture, restriction -> referral/hold, including if user also reports no pain.
- Existing symptoms turn worse, near-fall during session -> pause and seek reviewed next steps.
- No unlocked exercise with missing clinician approval; forbidden exercise never appears.
- Consent refusal -> no collection beyond essential safety/session data and no personalization.
- Attempted LLM override or manipulated API payload -> server-side gating still enforced.
- Regression and missed days must not trigger harder exercises.
- Screen-reader and large-text interactions must remain usable.

Run `python -m unittest discover -s tests -v` from package root to exercise the supplied **synthetic** cases. Test all paths in production app separately; engine here is a reference safety gate, not a cleared triage system.
