import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Ticket,
  CalendarDays,
  LogOut,
  Plus,
  ArrowRight,
  CheckCircle2,
  Compass,
  X,
} from "lucide-react";
import Auth from "./Auth";
import EventForm from "./EventForm";
import EventDetail from "./EventDetail";
import { api } from "./api";
import {
  categories,
  type EventRecord,
  type EventPage,
  type User,
} from "./types";
import { Logo, EventCard, Message } from "./ui";
export default function App() {
  const [user, setUser] = useState<User | null>(null),
    [booting, setBooting] = useState(true),
    [bootError, setBootError] = useState(""),
    [tab, setTab] = useState("discover"),
    [category, setCategory] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [data, setData] = useState<EventPage>({
      items: [],
      total: 0,
      page: 1,
      pages: 1,
    }),
    [stats, setStats] = useState<Record<string, number>>({}),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0),
    [selected, setSelected] = useState<EventRecord | null>(null),
    [form, setForm] = useState<EventRecord | true | null>(null),
    [help, setHelp] = useState(false);
  const organizer = user?.role === "organizer";
  function refresh() {
    setTick((t) => t + 1);
  }
  async function bootstrap() {
    setBooting(true);
    setBootError("");
    try {
      setUser((await api<{ user: User }>("/auth/me")).user);
    } catch (err) {
      if ((err as Error).message !== "Please sign in to continue.")
        setBootError(
          "We couldn’t reach Gather. Check your connection and try again.",
        );
    } finally {
      setBooting(false);
    }
  }
  useEffect(() => {
    void bootstrap();
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      const q = new URLSearchParams({
        page: String(page),
        scope: tab === "mine" ? "booked" : "all",
      });
      if (category) q.set("category", category);
      if (search) q.set("search", search);
      Promise.all([
        api<EventPage>("/events?" + q),
        api<Record<string, number>>("/stats"),
      ])
        .then(([d, s]) => {
          if (active) {
            setData(d);
            setStats(s);
          }
        })
        .catch((err) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user, category, search, page, tab, tick]);
  function navigate(value: string) {
    setTab(value);
    setCategory("");
    setSearch("");
    setPage(1);
  }
  async function signOut() {
    try {
      await api("/auth/logout", "POST");
      setUser(null);
      navigate("discover");
      setData({ items: [], total: 0, page: 1, pages: 1 });
      setStats({});
    } catch (err) {
      setError((err as Error).message);
    }
  }
  if (booting)
    return (
      <div className="boot">
        <Logo />
        <p>Getting campus plans ready…</p>
      </div>
    );
  if (!user)
    return (
      <>
        {bootError && (
          <div className="offline">
            <Message>{bootError}</Message>
            <button className="secondary" onClick={() => void bootstrap()}>
              Retry connection
            </button>
          </div>
        )}
        <Auth
          onLogin={(u) => {
            setUser(u);
            setBootError("");
          }}
        />
      </>
    );
  const statRows = organizer
    ? [
        ["Total events", stats.events, CalendarDays],
        ["Published events", stats.published, Compass],
        ["Registrations", stats.registrations, Ticket],
        ["Checked in", stats.attended, CheckCircle2],
      ]
    : [
        ["My reservations", stats.booked, Ticket],
        ["Coming up", stats.upcoming, CalendarDays],
        ["Events attended", stats.attended, CheckCircle2],
      ];
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <button
          className="brand-button"
          aria-label="Gather home"
          onClick={() => navigate("discover")}
        >
          <Logo />
        </button>
        <nav aria-label="Main navigation">
          <button
            className={tab === "discover" ? "active" : ""}
            onClick={() => navigate("discover")}
          >
            Discover
          </button>
          <button
            className={tab === "mine" ? "active" : ""}
            onClick={() => navigate("mine")}
          >
            My tickets
          </button>
          {organizer && (
            <button
              className={tab === "manage" ? "active" : ""}
              onClick={() => navigate("manage")}
            >
              Organize
            </button>
          )}
        </nav>
        <div className="profile">
          <div className="avatar">
            {user.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")}
          </div>
          <span>
            <strong>{user.name}</strong>
            <small>{organizer ? "Organizer" : "Student"}</small>
          </span>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>
      <main id="main" className="workspace">
        <div className="campus-bar">
          <span>
            <span className="online-dot" />
            SAHRDAYA CAMPUS
          </span>
          <button onClick={() => setHelp(!help)}>
            How Gather works <ArrowUpRight size={14} />
          </button>
        </div>
        {help && (
          <section className="help">
            <button
              className="icon-button"
              aria-label="Close help"
              onClick={() => setHelp(false)}
            >
              <X size={18} />
            </button>
            <h2>A good plan starts here.</h2>
            <p>
              Students can reserve a seat before an event starts, find the
              reservation in My tickets, and cancel before the start unless
              already checked in. Organizers publish drafts, manage attendees,
              record check-in and export attendance. Check-in opens one hour
              before the event and closes two hours after its end. Published
              event details are locked; cancel an event if plans change.
            </p>
            <p>
              Times use your device’s timezone. No payment, email delivery or
              attendance certificates are included. Demonstration schedules are
              fictional; verify real events with your college.
            </p>
          </section>
        )}
        {tab === "discover" ? (
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">MORE THAN JUST ANOTHER DAY.</span>
              <h1>
                Campus life,
                <br />
                <span>worth showing up for.</span>
              </h1>
              <p>
                New ideas. Shared interests. People like you.
                <br />
                Find what’s happening and save your seat.
              </p>
              <a className="dark-button" href="#events">
                Explore events <ArrowRight size={18} />
              </a>
              <div className="hero-note">
                <span className="avatar-stack">
                  <i>A</i>
                  <i>R</i>
                  <i>S</i>
                </span>
                <span>Find your people, one event at a time.</span>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <span className="art-orbit" />
              <span className="art-star">✳</span>
              <div className="floating-tag">GOOD COMPANY. GREAT PLANS.</div>
              <div className="art-ticket">
                <span>YOUR CAMPUS. YOUR NEXT THING.</span>
                <strong>
                  LET’S
                  <br />
                  GATHER<span>↗</span>
                </strong>
                <div className="art-ticket-foot">
                  <span>
                    ADMIT ONE
                    <br />
                    <b>YOU’RE INVITED.</b>
                  </span>
                  <div className="barcode" />
                </div>
              </div>
              <span className="art-spark">✦</span>
              <div className="art-label">
                <Ticket size={20} />
                <span>
                  A little time.
                  <br />
                  <strong>A lot to discover.</strong>
                </span>
              </div>
            </div>
          </section>
        ) : (
          <section className="page-intro">
            <span className="eyebrow">
              {tab === "mine"
                ? "YOUR NEXT EXPERIENCE"
                : "BEHIND EVERY GOOD EVENT"}
            </span>
            <h1>
              {tab === "mine"
                ? "Your plans, all together."
                : "Bring campus together."}
            </h1>
            <p>
              {tab === "mine"
                ? "Your reservations and attendance, in one place."
                : "Create events, watch registrations, and welcome everyone at the door."}
            </p>
          </section>
        )}
        <section
          className={"stats " + (organizer ? "four" : "")}
          aria-label="Your event statistics"
        >
          {statRows.map(([label, value, Icon]) => {
            const StatIcon = Icon as typeof CalendarDays;
            return (
              <div className="stat" key={String(label)}>
                <span>
                  {String(label)}
                  <StatIcon size={18} />
                </span>
                <strong>{loading ? "—" : Number(value || 0)}</strong>
              </div>
            );
          })}
        </section>
        <section id="events" className="events-section">
          <div className="section-row">
            <div>
              <span className="eyebrow">
                {tab === "mine" ? "SAVED YOU A SEAT" : "FIND YOUR NEXT THING"}
              </span>
              <h2>
                {tab === "mine"
                  ? "My tickets"
                  : tab === "manage"
                    ? "Manage events"
                    : "On the campus calendar"}{" "}
                <span className="count">{loading ? "…" : data.total}</span>
              </h2>
            </div>
            {organizer ? (
              <button className="primary" onClick={() => setForm(true)}>
                <Plus size={17} />
                Create event
              </button>
            ) : (
              <span className="section-note">
                <CalendarDays size={15} />
                Something for every interest
              </span>
            )}
          </div>
          <div className="toolbar">
            <div
              className="category-tabs"
              role="group"
              aria-label="Filter by category"
            >
              {["", ...categories].map((c) => (
                <button
                  key={c}
                  className={category === c ? "selected" : ""}
                  aria-pressed={category === c}
                  onClick={() => {
                    setCategory(c);
                    setPage(1);
                  }}
                >
                  {c || "All events"}
                </button>
              ))}
            </div>
            <label className="search">
              <Search size={17} />
              <input
                aria-label="Search events"
                placeholder="Search events…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <button
                  className="icon-button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </label>
          </div>
          {error ? (
            <div className="empty">
              <Message>{error}</Message>
              <button className="secondary" onClick={refresh}>
                Try again
              </button>
            </div>
          ) : loading ? (
            <div
              className="event-grid"
              role="status"
              aria-label="Loading events"
            >
              {[1, 2, 3].map((n) => (
                <div className="skeleton" key={n} />
              ))}
            </div>
          ) : data.items.length ? (
            <div className="event-grid">
              {data.items.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onOpen={() => setSelected(event)}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <SlidersHorizontal size={28} />
              <h3>
                {tab === "mine" && !search && !category
                  ? "Your calendar has room for something good."
                  : "No events found."}
              </h3>
              <p>
                {tab === "mine" && !search && !category
                  ? "Explore campus events and reserve your first seat."
                  : "Try another search or category."}
              </p>
              <button
                className="secondary"
                onClick={() => {
                  setCategory("");
                  setSearch("");
                  setPage(1);
                  if (tab === "mine") navigate("discover");
                }}
              >
                {tab === "mine" ? "Explore events" : "Clear filters"}
              </button>
            </div>
          )}
          <div className="pagination">
            <span>
              {loading
                ? "Loading…"
                : data.total + " event" + (data.total === 1 ? "" : "s")}
            </span>
            <div>
              <button
                className="secondary"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous page
              </button>
              <span>
                {page} / {data.pages}
              </span>
              <button
                className="secondary"
                disabled={loading || page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next page
              </button>
            </div>
          </div>
        </section>
        <section className="bottom-banner">
          <span className="banner-star" aria-hidden="true">
            ✳
          </span>
          <div>
            <h2>There’s a place for you here.</h2>
            <p>Turn a free afternoon into a good story.</p>
          </div>
          <button
            onClick={() => {
              setHelp(true);
            }}
            className="secondary"
          >
            About Gather
            <ArrowUpRight size={16} />
          </button>
        </section>
      </main>
      <footer className="site-footer">
        <Logo />
        <span>Made for campus. Built around people.</span>
        <small>Student project · Adithyan P B · 2026</small>
      </footer>
      {selected && (
        <EventDetail
          key={selected.id}
          initial={selected}
          user={user}
          onClose={() => setSelected(null)}
          onChange={refresh}
          onEdit={(e) => {
            setSelected(null);
            setForm(e);
          }}
        />
      )}
      {form && (
        <EventForm
          event={form === true ? undefined : form}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            refresh();
            navigate("manage");
          }}
        />
      )}
    </>
  );
}
