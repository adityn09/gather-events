import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { api } from "./api";
import { categories, type EventRecord, type EventInput } from "./types";
import { Modal, Message } from "./ui";
const localDate = (s: string) => {
  const d = new Date(s);
  return new Date(+d - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export default function EventForm({
  event,
  onClose,
  onSaved,
}: {
  event?: EventRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError("");
    setBusy(true);
    try {
      const body: EventInput = {
        title: String(f.get("title")),
        description: String(f.get("description")),
        venue: String(f.get("venue")),
        category: String(f.get("category")),
        capacity: Number(f.get("capacity")),
        startsAt: new Date(String(f.get("startsAt"))).toISOString(),
        endsAt: new Date(String(f.get("endsAt"))).toISOString(),
      };
      await api(
        "/events" + (event ? "/" + event.id : ""),
        event ? "PATCH" : "POST",
        body,
      );
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={event ? "Edit draft event" : "Create an event"}
      onClose={onClose}
    >
      <form className="event-form" onSubmit={submit}>
        <p>
          Start with the details. Review your draft, then publish it when it’s
          ready.
        </p>
        <label>
          Event title
          <input
            name="title"
            defaultValue={event?.title}
            required
            minLength={5}
            maxLength={120}
            placeholder="Give your event a clear name"
          />
        </label>
        <div className="form-grid">
          <label>
            Category
            <select
              name="category"
              defaultValue={event?.category || "Workshop"}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Capacity
            <input
              name="capacity"
              type="number"
              min={1}
              max={500}
              defaultValue={event?.capacity || 40}
              required
            />
          </label>
        </div>
        <label>
          Venue
          <input
            name="venue"
            required
            minLength={2}
            maxLength={120}
            defaultValue={event?.venue}
            placeholder="Where are we gathering?"
          />
        </label>
        <div className="form-grid">
          <label>
            Starts at
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={localDate(
                event?.startsAt || new Date(Date.now() + 3600000).toISOString(),
              )}
              required
            />
          </label>
          <label>
            Ends at
            <input
              name="endsAt"
              type="datetime-local"
              defaultValue={localDate(
                event?.endsAt ||
                  new Date(Date.now() + 3 * 3600000).toISOString(),
              )}
              required
            />
          </label>
        </div>
        <small>
          Times use your device’s local timezone. Events can last up to seven
          days.
        </small>
        <label>
          About this event
          <textarea
            name="description"
            rows={4}
            minLength={20}
            maxLength={3000}
            required
            defaultValue={event?.description}
            placeholder="What can students expect? What should they bring?"
          />
        </label>
        {error && <Message>{error}</Message>}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : "Save draft"}
            <Save size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
