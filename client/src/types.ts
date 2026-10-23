export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "organizer";
}
export interface EventRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: string;
  registeredCount: number;
  attendedCount: number;
  seatsLeft: number;
  myRegistration: {
    id: string;
    registeredAt: string;
    checkedInAt: string | null;
  } | null;
}
export interface Attendee {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  checkedInAt: string | null;
}
export interface EventPage {
  items: EventRecord[];
  total: number;
  page: number;
  pages: number;
}
export interface EventInput {
  title: string;
  description: string;
  category: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
}
export const categories = [
  "Workshop",
  "Talk",
  "Cultural",
  "Sports",
  "Community",
];
export const date = (s: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(s));
export const time = (s: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(s));
