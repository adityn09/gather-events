import { Router } from "express";
import * as c from "../controllers/events.js";
import { organizer } from "../middleware/auth.js";
export function eventRoutes() {
  const r = Router();
  r.get("/meta", c.metadata);
  r.get("/stats", c.stats);
  r.route("/events").get(c.list).post(organizer, c.create);
  r.use("/events/:id", c.eventById);
  r.route("/events/:id")
    .get(c.detail)
    .patch(organizer, c.edit)
    .delete(organizer, c.remove);
  r.patch("/events/:id/status", organizer, c.status);
  r.post("/events/:id/registrations", c.book);
  r.delete("/events/:id/registrations/me", c.cancelBooking);
  r.get("/events/:id/attendees", organizer, c.attendees);
  r.post(
    "/events/:id/registrations/:registrationId/check-in",
    organizer,
    c.checkIn,
  );
  r.get("/events/:id/attendance.csv", organizer, c.exportCsv);
  return r;
}
