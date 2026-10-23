import mongoose from "mongoose";
export const CATEGORIES = [
  "Workshop",
  "Talk",
  "Cultural",
  "Sports",
  "Community",
];
export const STATUSES = ["Draft", "Published", "Cancelled", "Completed"];
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "organizer"], default: "student" },
  },
  { timestamps: true },
);
const registrationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GatherUser",
    required: true,
  },
  registeredAt: { type: Date, default: Date.now },
  checkedInAt: { type: Date, default: null },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GatherUser",
    default: null,
  },
});
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 3000 },
    category: { type: String, enum: CATEGORIES, required: true },
    venue: { type: String, required: true, maxlength: 120 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1, max: 500 },
    status: { type: String, enum: STATUSES, default: "Draft" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GatherUser",
      required: true,
    },
    registrations: { type: [registrationSchema], default: [] },
  },
  { timestamps: true, optimisticConcurrency: true },
);
eventSchema.index({ status: 1, startsAt: 1 });
eventSchema.index({ "registrations.student": 1, startsAt: 1 });
export const User = mongoose.model("GatherUser", userSchema);
export const Event = mongoose.model("GatherEvent", eventSchema);
