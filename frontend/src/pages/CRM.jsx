



import Table from "../components/Table";
import Button from "../components/Button";
import Alert from "../components/Alert";
import CrmSidebar from "../components/CrmSidebar";
import Spinner from "../components/Spinner";
import { useEffect, useState } from "react";
import CertificateBadge from "../components/CertificateBadge";
import { generateSOPAuditChecklistPDF } from "../utils/generateSOPAuditChecklistPDF";
import { downloadOnboardingZip } from "../utils/downloadOnboardingZip";

export default function ClientPortal() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function load() {
    try {
      setLoading(true);
      const r = await fetch("/api/crm/intakes");
      if (!r.ok) throw new Error("Failed to load Client Portal data");
      const data = await r.json();
      setRows(data);
    } catch (e) {
      setError(e.message || "Error loading Client Portal");
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

  const columns = ["Name", "Email", "Service", "Status", "Docs", "Date"];
  const filtered = rows.filter(r =>
    r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.service?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const tableData = paged.map(r => ({
    Name: r.full_name,
    Email: r.email,
    Service: r.service,
    Status: (
      <select
        value={r.status || "New"}
        onChange={e => updateStatus(r.id, e.target.value)}
        style={{ borderRadius: 6, padding: 4 }}
      >
        <option>New</option>
        <option>In Progress</option>
        <option>Waiting on Client</option>
        <option>Filed</option>
        <option>Completed</option>
      </select>
    ),
    Docs: (
      <input
        type="file"
        onChange={e => uploadDoc(r.id, e.target.files[0])}
        style={{ borderRadius: 6 }}
      />
    ),
    Date: new Date(r.created_at).toLocaleDateString(),
  }));

  return (
    <section className="section" style={{ padding: 0 }}>
      <CertificateBadge />
      <div style={{ display: "flex", minHeight: "80vh" }}>
        <CrmSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
        <div className="container" style={{ flex: 1, padding: 32 }}>

          <div className="crm-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <h2>Client Portal</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button as="a" href="/api/crm/export.csv" variant="accent">Export CSV</Button>
              <Button variant="accent" onClick={generateSOPAuditChecklistPDF}>
                Download SOP & Audit Checklist (PDF)
              </Button>
              <Button variant="primary" onClick={downloadOnboardingZip}>
                Download All Onboarding Docs (ZIP)
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '16px 0' }}>
            <input
              type="text"
              placeholder="Search name, email, or service…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 220 }}
            />
            <span style={{ color: '#888', fontSize: 14 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading && <div style={{ textAlign: 'center', margin: 32 }}><Spinner size={40} /></div>}
          {error && <Alert type="error">{error}</Alert>}

          {!loading && (
            <div className="card" style={{ marginTop: 24 }}>
              <Table columns={columns} data={tableData} />
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
                <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ minWidth: 36 }}>&lt;</Button>
                <span style={{ fontWeight: 500 }}>Page {page} of {totalPages}</span>
                <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ minWidth: 36 }}>&gt;</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
