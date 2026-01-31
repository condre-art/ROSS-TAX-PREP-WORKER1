
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Alert from "../components/Alert";
import { generateEngagementAgreementPDF } from "../utils/generateEngagementAgreementPDF";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Intake() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    clientType: "Individual (W-2 only)",
    complexity: [],
    acknowledgements: [],
    service: "Individual Tax Preparation",
    notes: ""
  });

  const [status, setStatus] = useState({ type: "idle", message: "" });

  const requiredAcks = [
    "I understand pricing is based on forms and services rendered",
    "I understand services rendered are non-refundable",
    "I agree to provide accurate and complete information"
  ];
  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim().length >= 2 &&
      isValidEmail(form.email) &&
      requiredAcks.every(ack => form.acknowledgements.includes(ack))
    );
  }, [form.fullName, form.email, form.acknowledgements]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      setStatus({ type: "error", message: "Please enter a valid name and email." });
      return;
    }

    setStatus({ type: "loading", message: "Submitting…" });

    try {
      const res = await fetch("/api/crm/intakes", {
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
        <div className="section-head" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2>Client Intake</h2>
          <p className="section-sub">Submit a request and we'll follow up with next steps.</p>
          <Button variant="accent" onClick={generateEngagementAgreementPDF} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            Download Engagement Agreement (PDF)
          </Button>
        </div>

        <form className="form card" onSubmit={onSubmit} style={{ maxWidth: 600, margin: "0 auto" }}>
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
            <span>Client Type</span>
            <select
              value={form.clientType}
              onChange={e => setForm({ ...form, clientType: e.target.value })}
            >
              <option>Individual (W-2 only)</option>
              <option>Self-Employed / Schedule C</option>
              <option>LLC</option>
              <option>S-Corporation</option>
              <option>C-Corporation</option>
            </select>
          </label>

          <label className="field">
            <span>Complexity Triggers <span style={{ color: '#888', fontWeight: 400 }}>(Check all that apply)</span></span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {[
                "Multiple states",
                "Dependents",
                "Itemized deductions",
                "Rental income",
                "Capital gains",
                "Payroll or contractors",
                "Prior-year unfiled returns",
                "IRS or state notice received"
              ].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={form.complexity.includes(opt)}
                    onChange={e => {
                      setForm(f => ({
                        ...f,
                        complexity: e.target.checked
                          ? [...f.complexity, opt]
                          : f.complexity.filter(c => c !== opt)
                      }));
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </label>


          <label className="field">
            <span>Acknowledgements <span style={{ color: '#e67e22', fontWeight: 400 }}>(Required)</span></span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {requiredAcks.map(ack => (
                <label key={ack} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={form.acknowledgements.includes(ack)}
                    onChange={e => {
                      setForm(f => ({
                        ...f,
                        acknowledgements: e.target.checked
                          ? [...f.acknowledgements, ack]
                          : f.acknowledgements.filter(a => a !== ack)
                      }));
                    }}
                  />
                  {ack}
                </label>
              ))}
            </div>
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

          <Button
            type="submit"
            disabled={!canSubmit || status.type === "loading"}
            style={{ width: "100%", marginTop: 16 }}
          >
            {status.type === "loading" ? "Submitting…" : "Submit Intake Request"}
          </Button>

          <div className="fineprint" style={{ marginTop: 16 }}>
            Condre Ross | Owner | Lead Tax Professional | PTIN P03215544
          </div>
        </form>

        <Modal open={status.type === "error" || status.type === "success"} onClose={() => setStatus({ type: "idle", message: "" })}>
          <div style={{ minWidth: 240 }}>
            <Alert type={status.type === "error" ? "error" : "success"}>
              <strong>{status.type === "error" ? "Submission Error" : "Success"}</strong><br />
              {status.message}
            </Alert>
            <Button onClick={() => setStatus({ type: "idle", message: "" })} style={{ marginTop: 8 }}>Close</Button>
          </div>
        </Modal>
      </div>
    </section>
  );
}
