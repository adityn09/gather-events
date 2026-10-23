import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Clock,
  Users,
  Download,
  Ticket,
  Trash2,
} from "lucide-react";
import { api, downloadAttendance } from "./api";
import {
  date,
  time,
  type User,
  type EventRecord,
  type Attendee,
} from "./types";
import { Modal, Message, Poster } from "./ui";
export default function EventDetail({
  initial,
  user,
  onClose,
  onChange,
  onEdit,
}: {
  initial: EventRecord;
  user: User;
  onClose: () => void;
  onChange: () => void;
  onEdit: (e: EventRecord) => void;
}) {
  const [event, setEvent] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [confirm, setConfirm] = useState(""),
    [attendees, setAttendees] = useState<Attendee[]>([]),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [attendeeTotal, setAttendeeTotal] = useState(0),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(false),
    [tick, setTick] = useState(0);
  const organizer = user.role === "organizer";
  useEffect(() => {
    let active = true;
    if (organizer) {
      setLoading(true);
      api<{ items: Attendee[]; pages: number; total: number }>(
        `/events/${event.id}/attendees?page=${page}&search=${encodeURIComponent(search)}`,
      )
        .then((r) => {
          if (active) {
            setAttendees(r.items);
            setPages(r.pages);
            setAttendeeTotal(r.total);
          }
        })
        .catch((err) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [event.id, organizer, page, search, tick]);
  async function action(
    path: string,
    method: string,
    body?: unknown,
    success = "Event updated.",
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await api<{ event: EventRecord } | undefined>(
        path,
        method,
        body,
      );
      if (r) setEvent(r.event);
      else onClose();
      setTick((v) => v + 1);
      setConfirm("");
      setNotice(success);
      onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const prefix = "/events/" + event.id,
    registrationOpen =
      event.status === "Published" && new Date(event.startsAt) > new Date(),
    checkInOpen =
      event.status === "Published" &&
      Date.now() >= +new Date(event.startsAt) - 3600000 &&
      Date.now() <= +new Date(event.endsAt) + 7200000;
  return (
    <Modal title="Event details" onClose={onClose} wide>
      <div className="detail-layout">
        <div>
          <Poster event={event} small />
          <div className="detail-status">
            <span className="category-tag">{event.category}</span>
            <span className={"status-tag " + event.status.toLowerCase()}>
              {event.status}
            </span>
          </div>
          <h2 className="detail-title">{event.title}</h2>
          <div className="detail-meta">
            <span>
              <MapPin size={17} />
              {event.venue}
            </span>
            <span>
              <Clock size={17} />
              {date(event.startsAt)} · {time(event.startsAt)}–
              {time(event.endsAt)}
            </span>
            <span>
              <Users size={17} />
              {event.registeredCount} / {event.capacity} seats reserved
            </span>
          </div>
          <h3>About the event</h3>
          <p className="description">{event.description}</p>
          {event.status === "Cancelled" && (
            <Message>
              This event has been cancelled. Reservations are retained for
              reference, and attendance is closed.
            </Message>
          )}
        </div>
        <aside className="reservation-panel">
          <span className="eyebrow">
            {organizer ? "ORGANIZER WORKSPACE" : "YOUR CAMPUS PLANS"}
          </span>
          {organizer ? (
            <>
              <h3>Make it happen.</h3>
              <p>Manage publication and keep attendance up to date.</p>
              <div className="mini-stats">
                <div>
                  <strong>{event.registeredCount}</strong>
                  <span>registered</span>
                </div>
                <div>
                  <strong>{event.attendedCount}</strong>
                  <span>checked in</span>
                </div>
              </div>
              {event.status === "Draft" && (
                <>
                  <button
                    className="primary full"
                    disabled={busy}
                    onClick={() =>
                      action(
                        prefix + "/status",
                        "PATCH",
                        { status: "Published" },
                        "Event published. Students can now reserve seats.",
                      )
                    }
                  >
                    Publish event
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="secondary full"
                    disabled={busy}
                    onClick={() => onEdit(event)}
                  >
                    Edit draft
                  </button>
                  <button
                    className="text-button danger"
                    onClick={() => setConfirm("delete")}
                    disabled={busy}
                  >
                    <Trash2 size={14} />
                    Delete draft
                  </button>
                </>
              )}
              {event.status === "Published" && (
                <>
                  <button
                    className="secondary full"
                    disabled={busy || new Date(event.endsAt) > new Date()}
                    onClick={() =>
                      action(
                        prefix + "/status",
                        "PATCH",
                        { status: "Completed" },
                        "Event marked completed.",
                      )
                    }
                  >
                    Mark completed
                  </button>
                  <small>
                    Completion is available after the scheduled end.
                  </small>
                  <button
                    className="text-button danger"
                    disabled={busy}
                    onClick={() => setConfirm("event")}
                  >
                    Cancel event
                  </button>
                </>
              )}
            </>
          ) : event.myRegistration ? (
            <>
              <Ticket size={30} />
              <h3>You’re on the list.</h3>
              <p>
                {event.myRegistration.checkedInAt
                  ? "Your attendance has been recorded."
                  : "Your seat is reserved. An organizer will check you in at the event."}
              </p>
              <div className="ticket-reference">
                <span>RESERVATION</span>
                <strong>
                  GT-{event.myRegistration.id.slice(-6).toUpperCase()}
                </strong>
                <small>
                  {event.myRegistration.checkedInAt
                    ? "Checked in · " + date(event.myRegistration.checkedInAt)
                    : "Reserved · " + date(event.myRegistration.registeredAt)}
                </small>
              </div>
              {registrationOpen && !event.myRegistration.checkedInAt && (
                <button
                  className="secondary full"
                  disabled={busy}
                  onClick={() => setConfirm("booking")}
                >
                  Cancel reservation
                </button>
              )}
            </>
          ) : (
            <>
              <h3>A place for you.</h3>
              <p>
                {registrationOpen
                  ? event.seatsLeft + " seats available. Registration is free."
                  : "Registration is closed for this event."}
              </p>
              <button
                className="primary full"
                disabled={busy || !registrationOpen || event.seatsLeft === 0}
                onClick={() =>
                  action(
                    prefix + "/registrations",
                    "POST",
                    {},
                    "Your seat is reserved. See you there!",
                  )
                }
              >
                {busy
                  ? "Reserving…"
                  : event.seatsLeft === 0
                    ? "Event full"
                    : "Reserve my seat"}
                <Ticket size={17} />
              </button>
              <small>Only organizers can see the attendee list.</small>
            </>
          )}
          {confirm && (
            <div className="confirm-box" role="alert">
              <p>
                {confirm === "delete"
                  ? "Permanently delete this draft?"
                  : confirm === "event"
                    ? "Cancel this event for every registered student?"
                    : "Release your reserved seat?"}
              </p>
              <button
                className="primary full danger-bg"
                disabled={busy}
                onClick={() =>
                  confirm === "delete"
                    ? action(prefix, "DELETE")
                    : confirm === "event"
                      ? action(
                          prefix + "/status",
                          "PATCH",
                          { status: "Cancelled" },
                          "Event cancelled.",
                        )
                      : action(
                          prefix + "/registrations/me",
                          "DELETE",
                          undefined,
                          "Reservation cancelled.",
                        )
                }
              >
                {busy ? "Working…" : "Confirm"}
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => setConfirm("")}
              >
                Go back
              </button>
            </div>
          )}
          {error && <Message>{error}</Message>}
          {notice && (
            <p className="success" role="status">
              <CheckCircle2 size={17} />
              {notice}
            </p>
          )}
        </aside>
      </div>
      {organizer && (
        <section className="attendance-section">
          <div className="section-row">
            <div>
              <span className="eyebrow">AT THE DOOR</span>
              <h3>
                Attendance <span className="count">{attendeeTotal}</span>
              </h3>
            </div>
            <button
              className="secondary"
              disabled={busy}
              onClick={async () => {
                try {
                  await downloadAttendance(event.id);
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
          <p>
            Check-in opens one hour before the start and closes two hours after
            the end. Cancelled and completed events are read-only.
          </p>
          <label className="search-label">
            Search attendees
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or email"
            />
          </label>
          {loading ? (
            <p role="status">Loading attendees…</p>
          ) : attendees.length === 0 ? (
            <div className="empty small-empty">
              <h3>No attendees found.</h3>
              <p>
                {search
                  ? "Try another name or email."
                  : "Registrations will appear here when students reserve seats."}
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Registered</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.name}</strong>
                        <small>{a.email}</small>
                      </td>
                      <td>{date(a.registeredAt)}</td>
                      <td>
                        {a.checkedInAt ? (
                          <span className="success">
                            <CheckCircle2 size={15} />
                            Present
                          </span>
                        ) : (
                          <button
                            className="check-in"
                            disabled={busy || !checkInOpen}
                            onClick={() =>
                              action(
                                prefix + "/registrations/" + a.id + "/check-in",
                                "POST",
                                {},
                                "Attendance recorded.",
                              )
                            }
                          >
                            Check in
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="pagination">
            <button
              className="secondary"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous attendees
            </button>
            <span>
              {page} / {pages}
            </span>
            <button
              className="secondary"
              disabled={loading || page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next attendees
            </button>
          </div>
        </section>
      )}
    </Modal>
  );
}
