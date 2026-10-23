import { useEffect, useRef, type ReactNode } from "react";
import { X, ArrowUpRight, MapPin, Clock, Users, Check } from "lucide-react";
import type { EventRecord } from "./types";
import { date, time } from "./types";
export function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark" aria-hidden="true">
        ✳
      </span>
      gather<span className="logo-dot">.</span>
    </span>
  );
}
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement | null;
    const d = ref.current;
    d?.showModal();
    return () => {
      d?.close();
      old?.focus();
    };
  }, []);
  return (
    <dialog
      aria-labelledby="gather-dialog-title"
      ref={ref}
      className={"modal " + (wide ? "wide" : "")}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <h2 id="gather-dialog-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Message({ children }: { children: ReactNode }) {
  return (
    <div className="message" role="alert">
      {children}
    </div>
  );
}
export function Poster({
  event,
  small = false,
}: {
  event: EventRecord;
  small?: boolean;
}) {
  return (
    <div
      className={
        "poster " + event.category.toLowerCase() + (small ? " small" : "")
      }
    >
      <span className="poster-label">
        GATHER / {event.category.toUpperCase()}
      </span>
      <div className="poster-shape" aria-hidden="true">
        {event.category === "Workshop"
          ? "✳"
          : event.category === "Talk"
            ? "“"
            : event.category === "Cultural"
              ? "♫"
              : event.category === "Sports"
                ? "↗"
                : "✿"}
      </div>
      <span className="poster-bottom">
        {event.category === "Workshop"
          ? "CREATE. CONNECT. REPEAT."
          : event.category === "Talk"
            ? "GOOD IDEAS START HERE."
            : event.category === "Cultural"
              ? "A LITTLE MORE EXPRESSION."
              : event.category === "Sports"
                ? "SHOW UP. PLAY TOGETHER."
                : "SMALL ACTS. SHARED IMPACT."}
      </span>
      <span className="poster-date">
        {new Date(event.startsAt).getDate()}
        <small>
          {new Date(event.startsAt).toLocaleString("en", { month: "short" })}
        </small>
      </span>
    </div>
  );
}
export function EventCard({
  event,
  onOpen,
}: {
  event: EventRecord;
  onOpen: () => void;
}) {
  const closed =
    event.status !== "Published" || new Date(event.startsAt) <= new Date();
  return (
    <article className="event-card">
      <button
        className="poster-button"
        onClick={onOpen}
        aria-label={"View " + event.title}
      >
        <Poster event={event} />
      </button>
      <div className="card-body">
        <div className="card-eyebrow">
          <span className="category-tag">{event.category}</span>
          {event.myRegistration ? (
            <span className="booked-tag">
              <Check size={12} />
              {event.myRegistration.checkedInAt ? "Attended" : "Registered"}
            </span>
          ) : (
            <span className="seat-count">
              {event.status === "Published"
                ? event.seatsLeft + " seats left"
                : event.status}
            </span>
          )}
        </div>
        <button className="event-title" onClick={onOpen}>
          {event.title}
        </button>
        <p>
          <MapPin size={14} />
          {event.venue}
        </p>
        <p>
          <Clock size={14} />
          {date(event.startsAt)} · {time(event.startsAt)}
        </p>
        <div className="card-footer">
          <span>
            <Users size={14} /> {event.registeredCount} going
          </span>
          <button onClick={onOpen}>
            {event.myRegistration
              ? "View ticket"
              : closed
                ? "View event"
                : "Explore event"}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
