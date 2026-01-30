import { useEffect, useState } from "react";

export default function Lms() {
  const [overview, setOverview] = useState(null);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [o, m] = await Promise.all([
          fetch("/api/lms/overview"),
          fetch("/api/lms/modules")
        ]);
        if (!o.ok || !m.ok) throw new Error("Failed to load LMS");
        setOverview(await o.json());
        setModules(await m.json());
      } catch (e) {
        setError(e.message || "Unable to load LMS");
      }
    }
    load();
  }, []);

  return (
    <section className="section muted">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Learning Hub</p>
            <h2 className="section-title">Staff LMS</h2>
            <p className="subtitle">Structured training for consistent, compliant delivery.</p>
          </div>
          <a className="btn btn-navy" href="/api/lms/overview">Open API</a>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {overview && (
          <div className="lms-grid">
            <div className="card stat">
              <div className="stat-value">{overview.enrolled}</div>
              <div className="stat-label">Enrolled</div>
            </div>
            <div className="card stat">
              <div className="stat-value">{overview.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="card stat">
              <div className="stat-value">{overview.in_progress}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="card stat">
              <div className="stat-value">{overview.satisfaction}★</div>
              <div className="stat-label">Satisfaction</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <h3>Modules</h3>
            <span className="pill">Live</span>
          </div>
          <div className="module-list">
            {modules.map((m) => (
              <div key={m.id} className="module-row">
                <div>
                  <div className="module-title">{m.title}</div>
                  <div className="module-meta">{m.duration}</div>
                </div>
                <span className="pill">{m.status}</span>
              </div>
            ))}
            {!modules.length && <p>Loading modules…</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
