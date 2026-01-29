import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Intake() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    service: "Individual Tax Preparation",
    notes: ""
  });

  const [status, setStatus] = useState({ type: "idle", message: "" });

  const canSubmit = useMemo(() => {
    return form.fullName.trim().length >= 2 && isValidEmail(form.email);
  }, [form.fullName, form.email]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      setStatus({ type: "error", message: "Please enter a valid name and email." });
      return;
    }

    setStatus({ type: "loading", message: "Submitting…" });

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Submission failed. Please try again.");
      }

      nav("/success");
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Something went wrong." });
    }
  }

  return (
    <section className="section muted">
      <div className="container">
        <div className="section-head">
          <h2>Client Intake</h2>
          <p className="section-sub">Submit a request and we'll follow up with next steps.</p>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span>Full Name</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              type="text"
              autoComplete="name"
              required
            />
          </label>

          <label className="field">
            <span>Email Address</span>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Phone Number</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              type="tel"
              autoComplete="tel"
            />
          </label>

          <label className="field">
            <span>Service Needed</span>
            <select
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
            >
              <option>Individual Tax Preparation</option>
              <option>Business Tax Services</option>
              <option>Bookkeeping</option>
            </select>
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              className="textarea"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional: any deadlines, questions, or context…"
              rows={4}
            />
          </label>

          <button 
            className="btn btn-navy" 
            type="submit" 
            disabled={!canSubmit || status.type === "loading"}
          >
            {status.type === "loading" ? "Submitting…" : "Submit Intake Request"}
          </button>

          {status.type !== "idle" && (
            <div className={status.type === "error" ? "alert alert-error" : "alert alert-info"}>
              {status.message}
            </div>
          )}

          <div className="fineprint">
            Condre Ross | Owner | Lead Tax Professional | PTIN P03215544
          </div>
        </form>
      </div>
    </section>
  );
}
