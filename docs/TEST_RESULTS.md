# Gather verification results

Verified on 24 October 2026. These are local results, not evidence of a hosted deployment.

## Automated checks

- npm run build: passed (TypeScript and Vite production bundle).
- npm test: 20 passed, 0 failed, using an isolated real MongoDB instance.
- npm ci initial audit: 0 reported vulnerabilities. This is not a security certification.

The integration tests verify anonymous protection, forged roles, duplicate emails, password hashing and byte limits, safe profiles, organizer-only event mutation, draft privacy, event dates and capacity validation, draft editing and publication, MongoDB persistence, attendee privacy, duplicate reservations, simultaneous requests for the last seat, owner-only booking cancellation, time windows, check-in permissions and duplicate prevention, event cancellation and completion, CSV formula escaping, literal search, pagination bounds, draft deletion, safe IDs, origin checks, logout, production cookie flags, health and SPA fallback.

## Browser checks

At http://127.0.0.1:5174:

- Created a fictional Demo Visitor through Join Gather.
- Opened an event, reserved a seat, saw its reference and My tickets entry.
- Cancelled through the confirmation control and observed the seat count return to zero.
- Rebooked, refreshed the page, and confirmed the session and reservation persisted.
- Signed out and signed in as the generated local organizer.
- Checked Demo Visitor in and observed Present and one checked-in attendee.
- Downloaded the attendance CSV through the browser.
- Created a fictional event draft and published it through organizer controls.
- Searched for a non-match and observed No events found; clearing filters restored the records.
- Signed in as the student and observed Events attended = 1 and the Attended ticket badge.
- Checked desktop at 1440 x 1000 and mobile at 390 x 844. Mobile document client width and scroll width were both 375 CSS pixels, including while the ticket dialog was open.
- Captured major views and checked the browser error log query, which returned no entries.

The app uses only fictional demonstration identities, schedules and attendance. Screenshots are local, and some were captured at different stages of the walkthrough, so their counts can differ.

## Remaining verification

External production MongoDB, hosted HTTPS acceptance, sustained availability, institutional integration, concurrent load benchmarks and independent accessibility/security audits remain pending. The Dockerfile is supplied but has not been built here. No email, payment, QR scanning, attendance certificates or biometric verification are implemented.

Source formatting does not change application behavior. Repeat functional checks after substantive changes, and repeat the complete student/organizer flow on the live URL before submission.
