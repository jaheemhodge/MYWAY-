# US regulatory and privacy review checklist (research draft, not legal advice)

## FDA intended-use decision
- Initial wellness positioning: promoting strength, mobility, movement confidence and an active lifestyle for suitable adults.
- **Escalate to FDA counsel** if marketing/features claim to diagnose a rotator-cuff imbalance, prescribe therapy for sciatica, cure chronic pain, treat osteoarthritis, prevent falls in high-risk patients, or perform automated medical decision-making.
- The January 2026 FDA general-wellness guidance distinguishes low-risk healthy-lifestyle products from disease diagnosis/treatment intended uses; wording alone cannot fix contradictory software behavior. Source: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices
- Separate review of relevant software functions, state practice-of-physical-therapy rules, and any professional services model.

## Privacy and security
- Inventory information collected: age, goals, pain ratings, injury/surgery/falls history, self-reported diagnoses, activity and app feedback. All deserve strong protection.
- HIPAA **may not** apply to a direct-to-consumer app not operating for a covered entity, but other federal/state laws do. Confirm actual entity relationships. Source: https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/cell-phone-hipaa/index.html
- Assess FTC Health Breach Notification Rule coverage, including multi-source health records; do not assume it never applies. Source: https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0
- Assess state privacy laws including Washington My Health My Data Act and other applicable state consumer-health data laws, and California requirements where applicable.
- Avoid ad pixels and behavioral ad targeting using pain/diagnosis answers or other sensitive health data. Contractually limit processors; document data flow maps, retention, deletion, access rights, incident response.
- Encrypt in transit and at rest; least-privilege access, MFA for admin, role-based access, audit logs, key rotation, dependency security scans and penetration testing.
- Separate analytics from health profile when possible; never send symptoms to public LLM services without appropriate consent, protections and contractual assessment.
- Publish accessible privacy notice and consent choices; provide account/data deletion and vendor disclosures; don't claim HIPAA certification without basis.

## Claims to avoid before substantiation
- “Fix chronic shoulder pain in 8 weeks”; “prevents falls”; “reverses arthritis”; “AI diagnoses why you hurt”; “guaranteed pain-free in 60 days”; “clinically proven” without trials of THIS product.
- Safer hypothesis: “A guided 60-day program designed to help eligible adults practice strength and mobility skills, with progress tracking.” This is not automatically FDA-exempt.

## Compliance evidence required
Intended use memo signed by regulatory advisor; clinical content approval; source review; data protection impact/risk assessment; processor inventory and contracts; incident response runbook; penetration test results; accessible privacy policy/terms; release sign-off.
