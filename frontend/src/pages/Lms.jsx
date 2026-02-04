
import { useEffect, useMemo, useState } from "react";
import CertificateBadge from "../components/CertificateBadge";
import Logo from "../components/Logo";

export default function Lms() {
  const [overview, setOverview] = useState(null);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState("");

  const fallbackCourses = useMemo(() => ([
    {
      id: "lms-101",
      title: "Federal Tax Fundamentals (TY 2025)",
      duration: "6 hrs",
      status: "Required",
      approval: "Higher Ed Ready",
      sections: [
        { id: "s1", title: "Filing Status & Dependents", objectives: "Determine filing status and eligibility" },
        { id: "s2", title: "Income Types & Reporting", objectives: "W-2, 1099, Schedule C basics" },
        { id: "s3", title: "Deductions & Credits", objectives: "Standard vs itemized, EITC, CTC" },
        { id: "s4", title: "IRS Compliance", objectives: "Pub 17, Pub 1075 data handling" }
      ],
      uploads: ["Syllabus.pdf", "Lecture Slides.pptx", "Practice Return.xlsx"]
    },
    {
      id: "lms-202",
      title: "Advanced Business Returns",
      duration: "4.5 hrs",
      status: "Elective",
      approval: "Higher Ed Ready",
      sections: [
        { id: "s1", title: "Schedule C Deep Dive", objectives: "COGS, depreciation, QBI" },
        { id: "s2", title: "Entity Selection", objectives: "LLC vs S-Corp vs C-Corp" },
        { id: "s3", title: "Bank Products & ERO", objectives: "TPG flows and compliance" }
      ],
      uploads: ["Case Studies.pdf", "Compliance Checklist.docx"]
    },
    {
      id: "lms-303",
      title: "IRS E-File & MeF A2A Operations",
      duration: "3 hrs",
      status: "Required",
      approval: "Higher Ed Ready",
      sections: [
        { id: "s1", title: "MeF Lifecycle", objectives: "Transmit, acknowledge, resubmit" },
        { id: "s2", title: "Error Resolution", objectives: "Schema errors and business rules" },
        { id: "s3", title: "Security & Audit", objectives: "Audit logs and data retention" }
      ],
      uploads: ["MeF Workflow.pdf", "Error Codes.xlsx"]
    }
  ]), []);

  const courseList = modules.length ? modules : fallbackCourses;

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
    <>
      <CertificateBadge />
      <section className="section muted">
        <div className="container">
          <div className="section-head">
            <div>
              <div style={{ marginBottom: 16 }}>
                <Logo size="small" />
              </div>
              <p className="eyebrow">Ross Tax Prep Learning Hub</p>
              <h2 className="section-title">Branded LMS • Higher Education Standards</h2>
              <p className="subtitle">Structured courses, verified sections, and compliance-ready materials.</p>
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
                <div className="stat-value" aria-label={`${overview.satisfaction} out of 5 stars`}>
                  {overview.satisfaction}★
                </div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h3>Courses & Sections</h3>
              <span className="pill">Branded LMS</span>
            </div>
            <div className="module-list">
              {courseList.map((course) => (
                <div key={course.id} className="module-row" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div className="module-title">{course.title}</div>
                    <div className="module-meta">{course.duration} • {course.approval}</div>
                    <div style={{ marginTop: 12 }}>
                      <strong>Sections</strong>
                      <ul style={{ margin: "8px 0 0 16px" }}>
                        {(course.sections || []).map((s) => (
                          <li key={s.id} style={{ marginBottom: 6 }}>
                            <div>{s.title}</div>
                            <div style={{ fontSize: 13, color: "#6b7280" }}>{s.objectives}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <strong>Uploads (from memory)</strong>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        {(course.uploads || []).map((u) => (
                          <span key={u} className="pill">{u}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="pill">{course.status}</span>
                </div>
              ))}
              {!courseList.length && <p>Loading courses…</p>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
