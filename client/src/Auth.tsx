import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  TicketCheck,
  ShieldCheck,
} from "lucide-react";
import { api } from "./api";
import type { User } from "./types";
import { Logo, Message } from "./ui";
export default function Auth({ onLogin }: { onLogin: (user: User) => void }) {
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const data = {
        email: String(form.get("email")),
        password: String(form.get("password")),
        ...(register ? { name: String(form.get("name")) } : {}),
      };
      const r = await api<{ user: User }>(
        "/auth/" + (register ? "register" : "login"),
        "POST",
        data,
      );
      onLogin(r.user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Logo />
        <div>
          <span className="eyebrow">THE CAMPUS HAS PLANS.</span>
          <h1>
            Be part of
            <br />
            what's next<span>.</span>
          </h1>
          <p>
            Find an event. Save your seat.
            <br />
            Make a campus memory.
          </p>
          <div className="auth-ticket">
            <CalendarDays size={32} />
            <div>
              <strong>Good things happen together.</strong>
              <span>Your next experience starts here.</span>
            </div>
            <span className="ticket-star">✳</span>
          </div>
        </div>
        <p className="auth-foot">
          Sahrdaya College of Engineering and Technology
        </p>
      </section>
      <section className="auth-form">
        <span className="eyebrow">WELCOME TO GATHER</span>
        <h2>{register ? "Your campus, your community." : "A seat for you."}</h2>
        <p>
          {register
            ? "Create a student account to start exploring."
            : "Sign in and see what’s happening on campus."}
        </p>
        <form onSubmit={submit}>
          {register && (
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
              />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 12 : 1}
              maxLength={72}
            />
          </label>
          {register && (
            <small>Use 12–72 characters and no more than 72 UTF-8 bytes.</small>
          )}
          {error && <Message>{error}</Message>}
          <button className="primary full" disabled={busy}>
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Already have an account?" : "New around here?"}{" "}
          <button
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register ? "Sign in" : "Join Gather"}
          </button>
        </p>
        <div className="auth-assurance">
          <TicketCheck size={17} />
          <span>Reservations and attendance in one place.</span>
        </div>
        <div className="auth-assurance">
          <ShieldCheck size={17} />
          <span>Only organizers can view attendee lists.</span>
        </div>
      </section>
    </main>
  );
}
