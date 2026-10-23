# Gather

College event registration and attendance with MongoDB, Express, React and Node.js.

**Student:** Adithyan P B  
**Institution:** Sahrdaya College of Engineering and Technology

Students discover campus events, reserve a seat, cancel a reservation before the event starts, and view their attendance. Organizers publish events, manage attendee lists, check students in, and export a CSV attendance register.

## Run locally

Install Node.js 22.12 or later, then run these commands from the project folder:

~~~powershell
npm ci
npm run dev
~~~

Open **http://127.0.0.1:5174**. The API uses port **5001**, and Vite forwards /api to it. The first launch downloads an official MongoDB binary; later launches reuse it. Local data persists in the ignored .local-data/mongodb folder. If either port is busy, stop the other service or configure both the API and Vite proxy consistently.

Create your own student account through **Join Gather**. Passwords need 12–72 characters and must use no more than 72 UTF-8 bytes.

Local demonstration accounts are generated in **.local-data/credentials.json**. Its adminEmail is the organizer account; studentEmail is the seeded student. Its password works for both local demonstration accounts. This file also contains the local session secret. Keep it private and never upload it. Seeded schedules and identities are fictional. Restart the API after backend changes; frontend edits refresh automatically.

## Features

- Student registration, login and logout with an eight-hour HTTP-only cookie session.
- Search, category filters, pagination, responsive cards and event details.
- Draft creation and editing, publication, cancellation and completion.
- Free seat reservations with atomic capacity and duplicate checks.
- Student-owned ticket view and booking cancellation before the start.
- Organizer-only attendee lists with search and pagination.
- Time-limited, one-time check-in with actor and timestamp.
- CSV attendance export with quoted fields and spreadsheet-formula protection.
- Role-based dashboards and server-enforced access controls.
- Validation, rate limits, origin checks, safe errors, and password hashing.

## Workflow rules

Draft -> Published or Cancelled. Published -> Cancelled or Completed. Completion requires the scheduled end to have passed. Cancelled and Completed are final states. Only drafts may be edited or deleted; cancelling a published event retains its registrations.

Reservations require Published status, available capacity, a future start time, and no existing registration for that student. A reservation can be cancelled only before the start and before check-in. Check-in opens one hour before the start and closes two hours after the end, while the event remains Published.

Registrations are embedded in the event record and limited by a maximum capacity of 500. Conditional single-document MongoDB updates make seat allocation atomic. Organizer roles manage all events in this single-campus application; there is no per-club ownership boundary.

## Structure

~~~text
client/src/                 React screens, API client, types and styles
server/src/models.js        User, Event and embedded Registration schemas
server/src/controllers/    Account and event logic
server/src/middleware/     Authentication and organizer permission checks
server/src/routes/         Event endpoint mapping
server/scripts/            Development MongoDB, seed data and organizer creation
server/test/               MongoDB-backed integration tests
docs/                      SRS, report, screenshots and learning notes
~~~

## Commands

| Command | Purpose |
| --- | --- |
| npm run dev | Start React, Express and persistent local MongoDB |
| npm run build | Type-check React and build the production bundle |
| npm run check | Type-check the client |
| npm test | Run 20 integration tests in an isolated MongoDB |
| npm start | Serve the compiled frontend and API in production |
| npm run create-admin -w server | Create an organizer from environment variables |

## External database and production

Copy server/.env.example to server/.env and set MONGODB_URI, JWT_SECRET (32+ random characters), and CLIENT_ORIGIN. External databases are never seeded automatically. The production server requires an external MongoDB service and serves client/dist and /api from the same origin.

For a Node web service on Render:

1. Publish the source to Adithyan's repository and connect his own hosting account.
2. Use MongoDB Atlas with a database user restricted to the gather database and allow only the hosting provider's required outbound ranges.
3. Build: **npm ci --include=dev && npm run build && npm prune --omit=dev**
4. Start: **npm start**
5. Set NODE_ENV=production, NODE_VERSION=22.x, MONGODB_URI, JWT_SECRET, and CLIENT_ORIGIN to the exact hosted HTTPS origin. The host supplies PORT.
6. In a trusted local environment, set ADMIN_EMAIL and ADMIN_PASSWORD and run npm run create-admin -w server. Remove bootstrap password variables from any hosting configuration afterward.
7. Repeat the student-to-organizer journey on the hosted URL, then update the report and submission details with that verified URL.

No production secrets are committed. Do not reuse another student's database credential or session secret.

**Repository:** https://github.com/adityn09/gather-events (public).  
**Live URL:** not deployed yet. Hosting will use Adithyan's own account.

## Verification

The production build and 20 MongoDB-backed API integration tests passed on 24 October 2026. docs/TEST_RESULTS.md records the browser checks and limitations. Official technical references: [MongoDB atomic operations](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/), [React](https://react.dev/), [Express](https://expressjs.com/), and [Render Node deployment](https://render.com/docs/deploy-node-express-app).

## Limits and review

No payment gateway, email verification, password recovery, QR scanning, notifications, calendar-provider synchronization, or certificate generation. A ticket is a reservation reference shown in the app. Attendance is manually recorded by organizers and is not biometric or independently verified. No operational adoption by the institution is claimed. Capacity is capped at 500 per event; institutional scale and performance are unbenchmarked. Logout clears the cookie; issued tokens expire normally after eight hours. There is no attendance undo endpoint or account deletion interface.

Coding assistance was used to prepare the implementation and documents. Adithyan should read the learning guide, run the tests, follow a request through the code, and practise the demonstration before submission. Follow the course's disclosure requirements.
