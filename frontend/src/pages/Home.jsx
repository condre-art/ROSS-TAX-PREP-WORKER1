import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-card">
          <h1>Tax &amp; Bookkeeping, Done Clean.</h1>
          <p className="hero-lead">
            Professional support for individuals and small businesses—organized workflows, clear communication,
            and compliant outcomes.
          </p>

          <div className="hero-actions">
            <Link className="btn btn-gold" to="/intake">
              Start Your Tax Filing
            </Link>
            <Link className="btn btn-ghost" to="/services">
              View Services
            </Link>
          </div>

          <div className="hero-badges">
            <div className="badge">Secure document workflow</div>
            <div className="badge">Responsive support</div>
            <div className="badge">Compliance-first</div>
          </div>
        </div>
      </div>
    </section>
  );
}
