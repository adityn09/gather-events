import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { User, Event } from "../src/models.js";
let mongo, app, alice, bob, organizer, aliceUser, bobUser, organizerUser;
const password = randomBytes(24).toString("base64url");
const input = (extra = {}) => ({
  title: "Creative coding workshop",
  description:
    "A fictional practical workshop with guided exercises and collaborative activities.",
  category: "Workshop",
  venue: "Innovation Lab",
  startsAt: new Date(Date.now() + 30 * 60000).toISOString(),
  endsAt: new Date(Date.now() + 2 * 3600000).toISOString(),
  capacity: 20,
  ...extra,
});
async function fresh(extra = {}, status = "Published") {
  return Event.create({
    ...input(extra),
    status,
    createdBy: organizerUser._id,
  });
}
before(
  async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
    await mongoose.connect(mongo.getUri("gather_test"));
    await User.init();
    app = createApp({
      jwtSecret: randomBytes(48).toString("hex"),
      rateLimit: false,
    });
    alice = request.agent(app);
    bob = request.agent(app);
    organizer = request.agent(app);
    aliceUser = (
      await alice
        .post("/api/auth/register")
        .send({ name: "Alice Test", email: "alice@example.test", password })
        .expect(201)
    ).body.user;
    bobUser = (
      await bob
        .post("/api/auth/register")
        .send({ name: "Bob Test", email: "bob@example.test", password })
        .expect(201)
    ).body.user;
    organizerUser = await User.create({
      name: "Test Organizer",
      email: "organizer@example.test",
      role: "organizer",
      passwordHash: await bcrypt.hash(password, 12),
    });
    await organizer
      .post("/api/auth/login")
      .send({ email: "organizer@example.test", password })
      .expect(200);
  },
  { timeout: 120000 },
);
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
test("anonymous requests are blocked and forged organizer registration is rejected", async () => {
  await request(app).get("/api/events").expect(401);
  await request(app).get("/api/stats").expect(401);
  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Forged",
      email: "forged@example.test",
      password,
      role: "organizer",
    })
    .expect(400);
});
test("email uniqueness and UTF-8 password limits are enforced", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Duplicate", email: "ALICE@example.test", password })
    .expect(409);
  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Unicode",
      email: "unicode@example.test",
      password: "🚀".repeat(20),
    })
    .expect(400);
});
test("password hashing, safe profiles and failed login are verified", async () => {
  const u = await User.findById(aliceUser.id).select("+passwordHash");
  assert.notEqual(u.passwordHash, password);
  assert.ok(await bcrypt.compare(password, u.passwordHash));
  const me = (await alice.get("/api/auth/me").expect(200)).body.user;
  assert.equal(me.passwordHash, undefined);
  assert.equal(me.role, "student");
  await request(app)
    .post("/api/auth/login")
    .send({ email: "alice@example.test", password: "wrong" })
    .expect(401);
});
test("students cannot create events and cannot see draft records", async () => {
  await alice.post("/api/events").send(input()).expect(403);
  const draft = await fresh({}, "Draft");
  await alice.get("/api/events/" + draft.id).expect(404);
  const rows = (await alice.get("/api/events").expect(200)).body.items;
  assert.ok(!rows.some((e) => e.id === draft.id));
  await organizer.get("/api/events/" + draft.id).expect(200);
});
test("event validation rejects invalid dates, forged fields and oversized capacity", async () => {
  await organizer
    .post("/api/events")
    .send(input({ capacity: 501 }))
    .expect(400);
  await organizer
    .post("/api/events")
    .send(input({ endsAt: new Date(Date.now() - 10000).toISOString() }))
    .expect(400);
  await organizer
    .post("/api/events")
    .send({ ...input(), status: "Published" })
    .expect(400);
});
test("organizer can create, edit and publish a draft; published details are locked", async () => {
  const e = (await organizer.post("/api/events").send(input()).expect(201)).body
    .event;
  assert.equal(e.status, "Draft");
  await organizer
    .patch("/api/events/" + e.id)
    .send(input({ title: "Updated workshop title" }))
    .expect(200);
  await organizer
    .patch("/api/events/" + e.id + "/status")
    .send({ status: "Published" })
    .expect(200);
  await organizer
    .patch("/api/events/" + e.id)
    .send(input())
    .expect(409);
  await organizer.delete("/api/events/" + e.id).expect(409);
});
test("reservation persists in MongoDB and never exposes the other students", async () => {
  const e = await fresh();
  const r = (
    await alice
      .post("/api/events/" + e.id + "/registrations")
      .send({})
      .expect(201)
  ).body.event;
  assert.ok(r.myRegistration.id);
  assert.equal(r.registeredCount, 1);
  assert.equal(r.registrations, undefined);
  const stored = await Event.findById(e.id);
  assert.equal(String(stored.registrations[0].student), aliceUser.id);
  const other = (await bob.get("/api/events/" + e.id).expect(200)).body.event;
  assert.equal(other.myRegistration, null);
  assert.equal(other.registrations, undefined);
});
test("duplicate reservations and forged registration payloads are rejected", async () => {
  const e = await fresh();
  await alice
    .post("/api/events/" + e.id + "/registrations")
    .send({ student: bobUser.id })
    .expect(400);
  await alice
    .post("/api/events/" + e.id + "/registrations")
    .send({})
    .expect(201);
  await alice
    .post("/api/events/" + e.id + "/registrations")
    .send({})
    .expect(409);
  assert.equal((await Event.findById(e.id)).registrations.length, 1);
});
test("concurrent requests cannot oversell the last seat", async () => {
  const e = await fresh({ capacity: 1 });
  const results = await Promise.all([
    alice.post("/api/events/" + e.id + "/registrations").send({}),
    bob.post("/api/events/" + e.id + "/registrations").send({}),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await Event.findById(e.id)).registrations.length, 1);
});
test("cancellation applies only to the signed-in student and releases a seat", async () => {
  const e = await fresh({ capacity: 1 });
  await alice
    .post("/api/events/" + e.id + "/registrations")
    .send({})
    .expect(201);
  await bob.delete("/api/events/" + e.id + "/registrations/me").expect(409);
  await alice.delete("/api/events/" + e.id + "/registrations/me").expect(200);
  await bob
    .post("/api/events/" + e.id + "/registrations")
    .send({})
    .expect(201);
  const rows = (await bob.get("/api/events?scope=booked").expect(200)).body
    .items;
  assert.ok(rows.some((x) => x.id === e.id));
});
test("registration and cancellation close once the event starts", async () => {
  const e = await fresh({
    startsAt: new Date(Date.now() - 60000).toISOString(),
    registrations: [{ student: aliceUser.id }],
  });
  await bob
    .post("/api/events/" + e.id + "/registrations")
    .send({})
    .expect(409);
  await alice.delete("/api/events/" + e.id + "/registrations/me").expect(409);
});
test("attendee identities and exports are organizer-only", async () => {
  const e = await fresh({ registrations: [{ student: aliceUser.id }] });
  await alice.get("/api/events/" + e.id + "/attendees").expect(403);
  await bob.get("/api/events/" + e.id + "/attendance.csv").expect(403);
  const r = (
    await organizer.get("/api/events/" + e.id + "/attendees").expect(200)
  ).body;
  assert.equal(r.items[0].email, "alice@example.test");
});
test("check-in is persisted once, rejects student calls and locks cancellation", async () => {
  const e = await fresh({ registrations: [{ student: aliceUser.id }] });
  const id = e.registrations[0].id;
  await alice
    .post("/api/events/" + e.id + "/registrations/" + id + "/check-in")
    .send({})
    .expect(403);
  await organizer
    .post("/api/events/" + e.id + "/registrations/" + id + "/check-in")
    .send({})
    .expect(200);
  await organizer
    .post("/api/events/" + e.id + "/registrations/" + id + "/check-in")
    .send({})
    .expect(409);
  await alice.delete("/api/events/" + e.id + "/registrations/me").expect(409);
  const row = (await Event.findById(e.id)).registrations[0];
  assert.ok(row.checkedInAt);
  assert.equal(String(row.checkedInBy), organizerUser.id);
});
test("check-in is blocked outside its time window and for unknown registrations", async () => {
  const e = await fresh({
    startsAt: new Date(Date.now() + 4 * 3600000).toISOString(),
    endsAt: new Date(Date.now() + 5 * 3600000).toISOString(),
    registrations: [{ student: aliceUser.id }],
  });
  await organizer
    .post(
      "/api/events/" +
        e.id +
        "/registrations/" +
        e.registrations[0].id +
        "/check-in",
    )
    .send({})
    .expect(409);
  await organizer
    .post("/api/events/" + e.id + "/registrations/invalid/check-in")
    .send({})
    .expect(404);
});
test("event cancellation retains bookings but blocks new reservations and check-in", async () => {
  const e = await fresh({ registrations: [{ student: aliceUser.id }] });
  await organizer
    .patch("/api/events/" + e.id + "/status")
    .send({ status: "Cancelled" })
    .expect(200);
  await bob
    .post("/api/events/" + e.id + "/registrations")
    .send({})
    .expect(409);
  await organizer
    .post(
      "/api/events/" +
        e.id +
        "/registrations/" +
        e.registrations[0].id +
        "/check-in",
    )
    .send({})
    .expect(409);
  assert.equal((await Event.findById(e.id)).registrations.length, 1);
});
test("completion respects the event end time and final statuses cannot reopen", async () => {
  const future = await fresh();
  await organizer
    .patch("/api/events/" + future.id + "/status")
    .send({ status: "Completed" })
    .expect(409);
  const past = await fresh({
    startsAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    endsAt: new Date(Date.now() - 3600000).toISOString(),
  });
  await organizer
    .patch("/api/events/" + past.id + "/status")
    .send({ status: "Completed" })
    .expect(200);
  await organizer
    .patch("/api/events/" + past.id + "/status")
    .send({ status: "Published" })
    .expect(409);
});
test("CSV export escapes spreadsheet formula cells", async () => {
  const u = await User.create({
    name: "=SUM(1,2)",
    email: "csv@example.test",
    passwordHash: "unused",
  });
  const e = await fresh({ registrations: [{ student: u.id }] });
  const r = await organizer
    .get("/api/events/" + e.id + "/attendance.csv")
    .expect(200);
  assert.match(r.text, /"'=SUM\(1,2\)"/);
  assert.match(r.headers["content-disposition"], /attachment/);
});
test("search is literal and pagination limits are validated", async () => {
  await fresh({ title: "Literal [special] event" });
  const found = (
    await alice.get("/api/events?search=%5Bspecial%5D").expect(200)
  ).body;
  assert.equal(found.total, 1);
  const paged = (await organizer.get("/api/events?limit=2&page=2").expect(200))
    .body;
  assert.equal(paged.items.length, 2);
  await alice.get("/api/events?limit=100").expect(400);
  await alice.get("/api/events?page=0").expect(400);
  await organizer
    .get("/api/events/" + (await fresh()).id + "/attendees?limit=100")
    .expect(400);
});
test("only draft events can be deleted, and missing IDs return safe 404s", async () => {
  const e = await fresh({}, "Draft");
  await organizer.delete("/api/events/" + e.id).expect(204);
  await organizer.get("/api/events/" + e.id).expect(404);
  await alice.get("/api/events/not-an-id").expect(404);
});
test("origin protection, logout and production cookie flags work", async () => {
  await alice
    .post("/api/events/not-an-id/registrations")
    .set("Origin", "https://untrusted.example")
    .send({})
    .expect(403);
  await bob.post("/api/auth/logout").expect(204);
  await bob.get("/api/auth/me").expect(401);
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const p = createApp({
      jwtSecret: randomBytes(48).toString("hex"),
      rateLimit: false,
    });
    const r = await request(p)
      .post("/api/auth/login")
      .send({ email: "alice@example.test", password })
      .expect(200);
    assert.match(r.headers["set-cookie"][0], /Secure/);
    assert.match(r.headers["set-cookie"][0], /HttpOnly/);
    assert.match(r.headers["set-cookie"][0], /SameSite=Lax/);
    await request(p).get("/api/health").expect(200);
    await request(p).get("/some/deep/link").expect(200);
  } finally {
    process.env.NODE_ENV = previous || "development";
  }
});
