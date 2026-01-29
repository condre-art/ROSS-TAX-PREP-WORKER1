import { Link } from "react-router-dom";

export default function Success() {
  return (
    <section className="section">
      <div className="container">
        <div className="success">
          <h2>✅ Request Received</h2>
          <p>Thanks—your intake was submitted successfully. We'll follow up soon with next steps.</p>
          <div className="cta-row">
            <Link className="btn btn-navy" to="/">
              Back to Home
            </Link>
            <Link className="btn btn-ghost" to="/services">
              View Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
