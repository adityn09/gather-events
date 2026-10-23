# Gather API

Prefix: /api. Successful responses use JSON except CSV and 204 responses. Errors contain message. Authentication uses gather_session, an eight-hour HttpOnly cookie (Secure in production, SameSite=Lax, path /api).

| Method and path | Access | Purpose |
| --- | --- | --- |
| GET /health | Public | MongoDB readiness |
| POST /auth/register | Public | Name, email, password; creates student and session |
| POST /auth/login | Public | Email/password login |
| POST /auth/logout | Public | Clear session cookie |
| GET /auth/me | Signed in | Safe current profile |
| GET /meta | Signed in | Allowed categories and statuses |
| GET /stats | Signed in | Current role's dashboard counts |
| GET /events | Signed in | Search, category, scope=all/booked, page, limit <= 30 |
| POST /events | Organizer | Create Draft |
| GET /events/:id | Signed in | Details; student cannot see Draft |
| PATCH /events/:id | Organizer | Replace all editable draft fields |
| DELETE /events/:id | Organizer | Delete Draft only |
| PATCH /events/:id/status | Organizer | Allowed lifecycle transition |
| POST /events/:id/registrations | Student | Empty JSON object; atomic seat reservation |
| DELETE /events/:id/registrations/me | Signed in | Cancel own eligible reservation |
| GET /events/:id/attendees | Organizer | Search attendee name/email, page, limit <= 50 |
| POST /events/:id/registrations/:registrationId/check-in | Organizer | Empty JSON object; check in once within window |
| GET /events/:id/attendance.csv | Organizer | Download attendance register |

Event input: title (5–120), description (20–3000), category, venue (2–120), startsAt and endsAt (ISO UTC timestamps), capacity (integer 1–500). End must follow start, duration is at most seven days, and a new/editable event must not have ended. Category is Workshop, Talk, Cultural, Sports or Community.

Lists return items, total, page and pages. Event mutations return event, except deletion returns 204. Event responses expose aggregate counts and only the caller's own registration; attendee identities require the organizer endpoint. Student statistics are scoped to that student's registrations.

Typical statuses: 200 read/update/login; 201 create/register/reserve; 204 delete/logout; 400 invalid input; 401 missing session; 403 wrong role/origin; 404 missing/inaccessible record; 409 duplicate/full/closed reservation, invalid transition or concurrent edit.

Registration and attendance use conditional single-event document updates. Each mutation increments the version so concurrent organizer saves cannot silently overwrite reservation or attendance changes. CSV cells are quoted and risky formula prefixes are neutralized.
