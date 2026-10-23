import bcrypt from "bcryptjs";
import { User, Event } from "../src/models.js";
export async function seedDemo() {
  const organizerEmail = process.env.ADMIN_EMAIL || "organizer@gather.example",
    studentEmail = "student@gather.example";
  let organizer = await User.findOne({ email: organizerEmail });
  if (!organizer)
    organizer = await User.create({
      name: "Campus Events Office",
      email: organizerEmail,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
      role: "organizer",
    });
  let student = await User.findOne({ email: studentEmail });
  if (!student)
    student = await User.create({
      name: "Demo Student",
      email: studentEmail,
      passwordHash: await bcrypt.hash(process.env.DEMO_PASSWORD, 12),
      role: "student",
    });
  if (await Event.countDocuments()) return;
  const now = Date.now(),
    hour = 3600000,
    day = 24 * hour;
  const rows = [
    [
      "Build something brilliant",
      "A fictional hands-on workshop exploring creative coding, small web experiments and collaborative problem solving. Bring your laptop and curiosity.",
      "Workshop",
      "Innovation Lab",
      now + 30 * 60000,
      now + 2.5 * hour,
      40,
      "Published",
    ],
    [
      "Ideas after hours",
      "A fictional evening of short talks on design, technology and the ideas shaping our everyday lives. Meet peers and exchange perspectives.",
      "Talk",
      "Seminar Hall A",
      now + day,
      now + day + 2 * hour,
      80,
      "Published",
    ],
    [
      "The open mic social",
      "A fictional campus open mic for music, poetry and storytelling. Reserve a spot in the audience and discover a new favourite performer.",
      "Cultural",
      "Open-air Theatre",
      now + 2 * day,
      now + 2 * day + 2 * hour,
      120,
      "Published",
    ],
    [
      "Courtside Saturday",
      "A fictional friendly sports meet for students of every skill level. Come along for team games, good company and a little competition.",
      "Sports",
      "Sports Complex",
      now + 3 * day,
      now + 3 * day + 3 * hour,
      60,
      "Published",
    ],
    [
      "A greener kind of morning",
      "A fictional student community session on campus gardening, responsible consumption and practical changes for everyday sustainability.",
      "Community",
      "Garden Courtyard",
      now + 5 * day,
      now + 5 * day + 2 * hour,
      35,
      "Published",
    ],
    [
      "Design your first product",
      "A fictional introductory product design lab covering problem framing, low fidelity sketches and presenting a simple prototype.",
      "Workshop",
      "Design Studio",
      now + 7 * day,
      now + 7 * day + 3 * hour,
      25,
      "Published",
    ],
    [
      "Photography walk",
      "Draft planning example for a fictional campus photography session. Organizers can edit the event before publication.",
      "Cultural",
      "Main Gate",
      now + 9 * day,
      now + 9 * day + 2 * hour,
      30,
      "Draft",
    ],
  ];
  for (const [
    title,
    description,
    category,
    venue,
    startsAt,
    endsAt,
    capacity,
    status,
  ] of rows) {
    await Event.create({
      title,
      description,
      category,
      venue,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      capacity,
      status,
      createdBy: organizer._id,
      registrations:
        title === "Ideas after hours" ? [{ student: student._id }] : [],
    });
  }
}
