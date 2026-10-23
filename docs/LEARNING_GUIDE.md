# Explaining Gather

Gather is a college event registration and attendance application. Students reserve seats. Organizers publish events and record attendance. The data model and workflow differ from an issue tracker: Event records contain a bounded list of registrations, and capacity must remain correct under simultaneous requests.

## Trace a reservation

1. A student opens EventDetail.tsx and selects Reserve my seat.
2. api.ts sends POST /api/events/:id/registrations with the session cookie.
3. Authentication checks the JWT and loads the current user and role.
4. The event controller matches Published status, future start, available capacity and no registration for that student.
5. MongoDB atomically pushes the registration and increments the document version.
6. The API returns safe event fields and that student's own reservation reference.
7. React updates the ticket and reloads the event list and dashboard counts.

A registration array is embedded because capacity and registrations belong to one bounded event. MongoDB single-document atomicity protects the final seat without a multi-document transaction. An event supports at most 500 seats. This design would need reconsideration for much larger attendance lists.

## Important distinctions

- Authentication identifies the user; authorization checks student versus organizer permissions.
- A hidden UI button is not permission enforcement. The server rejects forbidden calls.
- Public event summaries never include other students' identities.
- Draft editing is locked after publication, making booking information stable.
- Check-in records manual organizer action; it does not prove physical presence independently.
- Production and local demonstration data use separate databases and secrets.
- The visible ticket reference identifies a reservation; no QR reader or payment system is present.

## Demonstration

Register a student, discover an event, reserve a seat, inspect My tickets, cancel and rebook before the start, then sign out. Sign in as the local organizer, open the event, check the student in within the allowed window, and export the CSV. Return to the student to show Events attended. Create a draft, edit it, publish it, and explain why a student cannot see drafts.

Seed schedules are fictional. To demonstrate check-in after a long delay, create an event that starts within the next hour and has not yet started, then reserve with a student account. Do not change real institutional attendance records for a demonstration.

## Before review

Read README.md, the SRS and API notes. Run npm test and npm run build. Find the atomic capacity condition in server/src/controllers/events.js. Explain what happens with two simultaneous requests for one seat, an expired session, a cancelled event, or a failed API request. Practise explaining exclusions and disclose coding assistance according to the course rules.
