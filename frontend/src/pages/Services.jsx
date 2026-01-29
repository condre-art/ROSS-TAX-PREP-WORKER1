import { Link } from "react-router-dom";

export default function Services() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>Services</h2>
          <p className="section-sub">Straightforward service options with professional execution.</p>
        </div>

        <div className="grid">
          <div className="card">
            <h3>Individual Tax Preparation</h3>
            <p>Federal and state returns prepared accurately, with clear next steps and timely filing.</p>
          </div>

          <div className="card">
            <h3>Business Tax Services</h3>
            <p>Support for small businesses, self-employed professionals, and contractors.</p>
          </div>

          <div className="card">
            <h3>Bookkeeping</h3>
            <p>Monthly/quarterly bookkeeping to keep your records clean, organized, and ready for tax time.</p>
          </div>
        </div>

        <div className="cta-row">
          <Link className="btn btn-navy" to="/intake">
            Submit Client Intake
          </Link>
        </div>
      </div>
    </section>
  );
}
