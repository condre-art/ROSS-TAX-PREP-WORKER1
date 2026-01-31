

import { Link } from "react-router-dom";
import Button from "../components/Button";
import CertificateBadge from "../components/CertificateBadge";
import CalloutBox from "../components/CalloutBox";

export default function Home() {
  return (
    <>
      <CertificateBadge />
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-card card" style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
            <h1 style={{ fontSize: 36, marginBottom: 12 }}>Tax &amp; Bookkeeping, Done Clean.</h1>
            <p className="hero-lead" style={{ fontSize: 20, marginBottom: 24 }}>
              Professional support for individuals and small businesses—organized workflows, clear communication,
              and compliant outcomes.
            </p>

            <div className="hero-actions" style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 24 }}>
              <Button as={Link} to="/intake" style={{ minWidth: 180 }}>
                Start Your Tax Filing
              </Button>
              <Button as={Link} to="/services" variant="accent" style={{ minWidth: 140 }}>
                View Services
              </Button>
            </div>

            <div className="hero-badges" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <div className="badge" style={{ background: "#F4F8FB", color: "#2C3E50", borderRadius: 16, padding: "6px 16px", fontWeight: 500 }}>Secure document workflow</div>
              <div className="badge" style={{ background: "#F4F8FB", color: "#2C3E50", borderRadius: 16, padding: "6px 16px", fontWeight: 500 }}>Responsive support</div>
              <div className="badge" style={{ background: "#F4F8FB", color: "#2C3E50", borderRadius: 16, padding: "6px 16px", fontWeight: 500 }}>Compliance-first</div>
            </div>

            <CalloutBox type="gold">
              <div>All services rendered are <b>non-refundable</b>.<br />Not a law firm or CPA firm.<br />Client-provided information relied upon.<br />No guaranteed outcomes.</div>
            </CalloutBox>
          </div>
        </div>
      </section>
    </>
  );
}
