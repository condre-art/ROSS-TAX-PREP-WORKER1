import { useState } from "react";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function CreateAccount() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: ""
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const canSubmit = form.name.length > 1 && /@/.test(form.email) && form.password.length >= 8 && form.password === form.confirm;

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ type: "loading", message: "Creating account..." });
    try {
      const res = await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setStatus({ type: "success", message: "Account created! Please log in." });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h2>Create Your Account</h2>
        <form className="form card" onSubmit={onSubmit}>
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
          </label>
          <label className="field">
            <span>Confirm Password</span>
            <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required minLength={8} />
          </label>
          <Button type="submit" disabled={!canSubmit || status.type === "loading"} style={{ width: "100%", marginTop: 12 }}>
            {status.type === "loading" ? "Creating..." : "Create Account"}
          </Button>
          {status.type !== "idle" && <Alert type={status.type === "error" ? "error" : "success"}>{status.message}</Alert>}
        </form>
      </div>
    </section>
  );
}
