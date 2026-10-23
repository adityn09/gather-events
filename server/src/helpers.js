import { z } from "zod";
import { CATEGORIES } from "./models.js";
export const problem = (status, message) =>
  Object.assign(new Error(message), { status });
export const text = (min, max) => z.string().trim().min(min).max(max);
export const email = z
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
export const password = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(72)
  .refine(
    (v) => Buffer.byteLength(v, "utf8") <= 72,
    "Use at most 72 UTF-8 bytes.",
  );
export const eventInput = z
  .object({
    title: text(5, 120),
    description: text(20, 3000),
    category: z.enum(CATEGORIES),
    venue: text(2, 120),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    capacity: z.number().int().min(1).max(500),
  })
  .strict()
  .refine(
    (v) => new Date(v.endsAt) > new Date(v.startsAt),
    "The end must be after the start.",
  )
  .refine(
    (v) => new Date(v.endsAt) - new Date(v.startsAt) <= 7 * 86400000,
    "Events may last at most seven days.",
  );
export const listInput = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(30).default(9),
    category: z.enum(CATEGORIES).optional(),
    search: text(0, 100).optional(),
    scope: z.enum(["all", "booked"]).default("all"),
  })
  .strict();
export function eventView(e, user) {
  const rows = e.registrations || [];
  const own = rows.find(
    (r) => String(r.student?._id || r.student) === String(user._id),
  );
  return {
    id: String(e._id),
    title: e.title,
    description: e.description,
    category: e.category,
    venue: e.venue,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    capacity: e.capacity,
    status: e.status,
    registeredCount: rows.length,
    attendedCount: rows.filter((r) => r.checkedInAt).length,
    seatsLeft: Math.max(0, e.capacity - rows.length),
    myRegistration: own
      ? {
          id: String(own._id),
          registeredAt: own.registeredAt,
          checkedInAt: own.checkedInAt,
        }
      : null,
  };
}
