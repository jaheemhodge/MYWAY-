# Mobility 60: Conservative Research Backend v2

A revised, conservative package based on **all 15 source transcripts** and the previous backend and safety ZIPs.

Directories: `backend/` is the FastAPI prototype, `safety/` is the 36-question safety screening and 61-movement exercise audit, `docs/` contains revised dose and release requirements. All clinical approvals remain pending and the code is deliberately **fail-closed** for actual exercise delivery.

## Design decisions
- 13 gentle introductory candidates for review only; 48 candidates withheld from the starter curriculum (specialist or further review, or excluded).
- No weighted/advanced/dynamic balance, eyes-closed, floor transfer, kneeling, step-ups, unassessed back or shoulder pain rehab in the introductory preview.
- Aspirational low workload: one short set to begin (typically ~5 slow reps, not a universally safe prescription), max two sets after explicit approval and demonstrated tolerance.
- Strength days nonconsecutive and user can pause or regress; safety signals always override plans.
- See `docs/CONSERVATIVE_PROGRAM_V2.md`, plus original `backend/docs/PROGRAM_SPEC.md` and `safety/docs` for all details.

## Testing
Run: `cd backend && python -m pytest tests -q` and `cd safety && python -m pytest tests -q`. Neither passing tests nor professional YouTube sourcing is evidence of clinical safety.
