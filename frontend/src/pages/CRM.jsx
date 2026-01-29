import { useEffect, useState } from "react";

export default function CRM() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const r = await fetch("/api/crm/intakes");
      if (!r.ok) throw new Error("Failed to load CRM data");
      const data = await r.json();
      setRows(data);
    } catch (e) {
      setError(e.message || "Error loading CRM");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    await fetch("/api/crm/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intakeId: id, status })
    });
    load();
  }

  async function uploadDoc(intakeId, file) {
    const fd = new FormData();
    fd.append("intakeId", intakeId);
    fd.append("file", file);

    await fetch("/api/docs/upload", {
      method: "POST",
      body: fd
    });
  }

  return (
    <section className="section">
      <div className="container">
        <div className="crm-head">
          <h2>Client CRM</h2>

          <a className="btn btn-ghost" href="/api/crm/export.csv">
            Export CSV
          </a>
        </div>

        {loading && <p>Loading…</p>}
        {error && <p className="alert alert-error">{error}</p>}

        {!loading && (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Service</th>
                <th>Status</th>
                <th>Docs</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.full_name}</td>
                  <td>{r.email}</td>
                  <td>{r.service}</td>

                  <td>
                    <select
                      value={r.status || "New"}
                      onChange={e => updateStatus(r.id, e.target.value)}
                    >
                      <option>New</option>
                      <option>In Progress</option>
                      <option>Waiting on Client</option>
                      <option>Filed</option>
                      <option>Completed</option>
                    </select>
                  </td>

                  <td>
                    <input
                      type="file"
                      onChange={e => uploadDoc(r.id, e.target.files[0])}
                    />
                  </td>

                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
