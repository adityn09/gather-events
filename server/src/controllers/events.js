import mongoose from "mongoose";
import { z } from "zod";
import { Event, CATEGORIES, STATUSES } from "../models.js";
import { problem, eventInput, listInput, eventView } from "../helpers.js";
export async function eventById(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id))
    throw problem(404, "Event not found.");
  req.event = await Event.findById(req.params.id);
  if (
    !req.event ||
    (req.user.role !== "organizer" && req.event.status === "Draft")
  )
    throw problem(404, "Event not found.");
  next();
}
export const metadata = (req, res) =>
  res.json({ categories: CATEGORIES, statuses: STATUSES });
export async function list(req, res) {
  const q = listInput.parse(req.query);
  const filter =
    req.user.role === "organizer" ? {} : { status: { $ne: "Draft" } };
  if (q.scope === "booked") filter["registrations.student"] = req.user._id;
  if (q.category) filter.category = q.category;
  if (q.search) {
    const safe = q.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = ["title", "description", "venue"].map((k) => ({
      [k]: { $regex: safe, $options: "i" },
    }));
  }
  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ startsAt: 1, _id: 1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Event.countDocuments(filter),
  ]);
  res.json({
    items: events.map((e) => eventView(e, req.user)),
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / q.limit)),
  });
}
export async function stats(req, res) {
  const filter =
    req.user.role === "organizer"
      ? {}
      : { "registrations.student": req.user._id };
  const rows = await Event.find(filter).lean();
  const own = rows.flatMap((e) =>
    e.registrations.filter((r) => String(r.student) === String(req.user._id)),
  );
  res.json(
    req.user.role === "organizer"
      ? {
          events: rows.length,
          published: rows.filter((e) => e.status === "Published").length,
          registrations: rows.reduce((s, e) => s + e.registrations.length, 0),
          attended: rows.reduce(
            (s, e) => s + e.registrations.filter((r) => r.checkedInAt).length,
            0,
          ),
        }
      : {
          booked: rows.filter((e) => e.status !== "Cancelled").length,
          upcoming: rows.filter(
            (e) => e.status === "Published" && e.startsAt > new Date(),
          ).length,
          attended: own.filter((r) => r.checkedInAt).length,
          cancelled: rows.filter((e) => e.status === "Cancelled").length,
        },
  );
}
export async function create(req, res) {
  const v = eventInput.parse(req.body);
  if (new Date(v.endsAt) <= new Date())
    throw problem(400, "Choose an event that has not ended.");
  const e = await Event.create({ ...v, createdBy: req.user._id });
  res.status(201).json({ event: eventView(e, req.user) });
}
export const detail = (req, res) =>
  res.json({ event: eventView(req.event, req.user) });
export async function edit(req, res) {
  if (req.event.status !== "Draft")
    throw problem(409, "Only draft events can be edited.");
  const v = eventInput.parse(req.body);
  if (new Date(v.endsAt) <= new Date())
    throw problem(400, "Choose an event that has not ended.");
  Object.assign(req.event, v);
  await req.event.save();
  res.json({ event: eventView(req.event, req.user) });
}
export async function remove(req, res) {
  if (req.event.status !== "Draft")
    throw problem(409, "Only draft events can be deleted.");
  const r = await Event.deleteOne({
    _id: req.event._id,
    status: "Draft",
    __v: req.event.__v,
  });
  if (!r.deletedCount)
    throw problem(409, "The event changed. Refresh and try again.");
  res.status(204).end();
}
export async function status(req, res) {
  const { status } = z
    .object({ status: z.enum(STATUSES) })
    .strict()
    .parse(req.body);
  const transitions = {
    Draft: ["Published", "Cancelled"],
    Published: ["Cancelled", "Completed"],
    Cancelled: [],
    Completed: [],
  };
  if (!transitions[req.event.status].includes(status))
    throw problem(409, "That status change is not allowed.");
  if (status === "Published" && req.event.endsAt <= new Date())
    throw problem(409, "An ended event cannot be published.");
  if (status === "Completed" && req.event.endsAt > new Date())
    throw problem(409, "Complete the event after its scheduled end.");
  req.event.status = status;
  await req.event.save();
  res.json({ event: eventView(req.event, req.user) });
}
export async function book(req, res) {
  z.object({}).strict().parse(req.body);
  if (req.user.role !== "student")
    throw problem(403, "Use a student account to reserve a seat.");
  const e = await Event.findOneAndUpdate(
    {
      _id: req.event._id,
      status: "Published",
      startsAt: { $gt: new Date() },
      "registrations.student": { $ne: req.user._id },
      $expr: { $lt: [{ $size: "$registrations" }, "$capacity"] },
    },
    {
      $push: {
        registrations: {
          student: req.user._id,
          registeredAt: new Date(),
          checkedInAt: null,
        },
      },
      $inc: { __v: 1 },
    },
    { new: true, runValidators: true },
  );
  if (!e)
    throw problem(
      409,
      "No seat was reserved. You may already be registered, the event may be full, or registration may have closed.",
    );
  res.status(201).json({ event: eventView(e, req.user) });
}
export async function cancelBooking(req, res) {
  const e = await Event.findOneAndUpdate(
    {
      _id: req.event._id,
      status: "Published",
      startsAt: { $gt: new Date() },
      registrations: {
        $elemMatch: { student: req.user._id, checkedInAt: null },
      },
    },
    { $pull: { registrations: { student: req.user._id } }, $inc: { __v: 1 } },
    { new: true },
  );
  if (!e)
    throw problem(
      409,
      "This reservation cannot be cancelled. Cancellation closes when the event starts or after check-in.",
    );
  res.json({ event: eventView(e, req.user) });
}
function attendeeView(e) {
  return e.registrations.map((r) => ({
    id: String(r._id),
    name: r.student?.name || "Unavailable account",
    email: r.student?.email || "",
    registeredAt: r.registeredAt,
    checkedInAt: r.checkedInAt,
  }));
}
export async function attendees(req, res) {
  const q = z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
      search: z.string().trim().max(100).default(""),
    })
    .strict()
    .parse(req.query);
  await req.event.populate("registrations.student", "name email");
  const all = attendeeView(req.event).filter((r) =>
    (r.name + " " + r.email).toLowerCase().includes(q.search.toLowerCase()),
  );
  res.json({
    items: all.slice((q.page - 1) * q.limit, q.page * q.limit),
    total: all.length,
    page: q.page,
    pages: Math.max(1, Math.ceil(all.length / q.limit)),
  });
}
export async function checkIn(req, res) {
  z.object({}).strict().parse(req.body);
  if (!mongoose.isValidObjectId(req.params.registrationId))
    throw problem(404, "Registration not found.");
  const now = new Date();
  const e = await Event.findOneAndUpdate(
    {
      _id: req.event._id,
      status: "Published",
      startsAt: { $lte: new Date(+now + 3600000) },
      endsAt: { $gte: new Date(+now - 2 * 3600000) },
      registrations: {
        $elemMatch: { _id: req.params.registrationId, checkedInAt: null },
      },
    },
    {
      $set: {
        "registrations.$.checkedInAt": now,
        "registrations.$.checkedInBy": req.user._id,
      },
      $inc: { __v: 1 },
    },
    { new: true },
  );
  if (!e)
    throw problem(
      409,
      "Check-in is unavailable. It opens one hour before the start, closes two hours after the end, and each registration can be checked in once.",
    );
  res.json({ event: eventView(e, req.user) });
}
export async function exportCsv(req, res) {
  await req.event.populate("registrations.student", "name email");
  const cell = (v) =>
    '"' +
    String(/^[=+\-@\t\r]/.test(String(v)) ? "'" + v : v).replaceAll('"', '""') +
    '"';
  const rows = [
    ["Name", "Email", "Registered at", "Attendance", "Checked in at"],
    ...attendeeView(req.event).map((r) => [
      r.name,
      r.email,
      new Date(r.registeredAt).toISOString(),
      r.checkedInAt ? "Present" : "Not checked in",
      r.checkedInAt ? new Date(r.checkedInAt).toISOString() : "",
    ]),
  ];
  res
    .set("Content-Disposition", 'attachment; filename="gather-attendance.csv"')
    .type("text/csv")
    .send("\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n"));
}
