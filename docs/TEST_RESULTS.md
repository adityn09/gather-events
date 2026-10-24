# Gather verification results

Verified on 24 October 2026. Local and hosted checks are recorded separately below.

Hosted application: https://gather-events-adityn09.onrender.com. Public repository: https://github.com/adityn09/gather-events.

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

The app uses only fictional demonstration identities, schedules and attendance. The final screenshots were recaptured from the hosted application at different stages of the walkthrough, so their counts can differ.

## Hosted HTTPS checks

All 24 API acceptance checks passed against the hosted service: database health; anonymous access; organizer login; Secure/HttpOnly/SameSite cookie flags; student authentication and role; forged-role rejection; organizer draft access and student draft privacy; direct draft privacy; attendee and CSV permission checks; reservation, duplicate rejection, persistence, cancellation and seat release; search and pagination validation; browser-origin protection; SPA refresh; organizer CSV export; logout cookie clearing.

The hosted browser walkthrough also passed:

- Registered Demo Visitor and reserved a seat.
- Confirmed the first ticket and session persisted after refresh.
- Created and published the fictional Student makers meetup as organizer.
- Reserved the meetup, confirmed cancellation released the seat, and rebooked.
- Checked Demo Visitor in during the permitted window and observed Present.
- Downloaded the attendance CSV and confirmed it contained Demo Visitor.
- Signed in as the student and confirmed the Attended badge persisted after refresh.
- Checked desktop at 1440 x 1000 and mobile at 390 x 844. Mobile document client and scroll widths were both 375 CSS pixels, including with the ticket dialog open.
- Recaptured all eight major-view screenshots from the hosted application. Browser error/warning logs returned no entries.

Render reported a successful live deployment of application commit b442720decc3100747e786b3863eb6609b8d7b0e. The service uses Node 22, Singapore, free compute, a database health check, and private MongoDB/session environment variables. Atlas user gather_app is restricted to readWrite on gather and Cluster0; Render's two displayed outbound ranges were allowed. The setup IP rule was configured to expire automatically after six hours. No credentials are included in this document or repository.

One later browser login timed out and succeeded on retry; the live health endpoint returned HTTP 200 in 626 ms. Render free instances sleep after inactivity and can take 50 seconds or more to wake.

## Remaining verification

Sustained availability, institutional integration, concurrent load benchmarks and independent accessibility/security audits remain unverified. The Dockerfile is supplied but has not been built here. No email, payment, QR scanning, attendance certificates or biometric verification are implemented.

Source formatting does not change application behavior. Repeat functional checks after substantive changes, and rerun hosted acceptance after application changes.
