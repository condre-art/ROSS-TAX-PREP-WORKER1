import React, { useState } from "react";

export default function AppointmentScheduler() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", time: "" });
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const canSubmit = form.name.length > 1 && form.email.includes("@") && form.date && form.time;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ type: "loading", message: "Booking…" });
    try {
      // Replace with backend API call or third-party integration
      await new Promise(res => setTimeout(res, 1200));
      setStatus({ type: "success", message: "Appointment booked! Check your email for confirmation." });
      setForm({ name: "", email: "", phone: "", date: "", time: "" });
    } catch {
      setStatus({ type: "error", message: "Could not book appointment. Try again." });
    }
  }

  return (
    <section className="appt-scheduler" style={{ background: '#f8fafc', padding: 32, borderRadius: 16, margin: '32px 0' }}>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Book an Appointment</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <input required placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 1, minWidth: 180, padding: 8 }} />
        <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ flex: 1, minWidth: 180, padding: 8 }} />
        <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ flex: 1, minWidth: 140, padding: 8 }} />
        <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ flex: 1, minWidth: 120, padding: 8 }} />
        <input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={{ flex: 1, minWidth: 100, padding: 8 }} />
        <button type="submit" disabled={!canSubmit || status.type === "loading"} style={{ padding: '8px 24px', fontWeight: 600, background: '#2C3E50', color: '#fff', border: 'none', borderRadius: 8, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
          {status.type === "loading" ? "Booking…" : "Book Now"}
        </button>
      </form>
      {status.type === "success" && <div style={{ color: 'green', marginTop: 12 }}>{status.message}</div>}
      {status.type === "error" && <div style={{ color: 'red', marginTop: 12 }}>{status.message}</div>}
    </section>
  );
}
