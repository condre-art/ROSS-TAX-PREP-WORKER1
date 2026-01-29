import "./index.css";

export default function App() {
  return (
    <>
      {/* Top Nav */}
      <header className="topbar">
        <div className="container topbar-inner">
          <img
            src="/rtb-logo.png"
            alt="Ross Tax & Bookkeeping"
            className="logo"
          />
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <h1>Trusted Tax &amp; Bookkeeping Services</h1>

          <p className="hero-text">
            Ross Tax &amp; Bookkeeping provides accurate, confidential, and
            dependable tax preparation and bookkeeping services for individuals
            and small businesses. We simplify the process so you can file with
            confidence.
          </p>

          <a href="#intake" className="btn btn-gold">
            Start Your Tax Filing
          </a>

          <p className="hero-subtext">
            Or visit:{" "}
            <a href="/intake" className="pretty-link">
              rosstaxprep.com/intake
            </a>
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="section muted">
        <div className="container">
          <h2 className="section-title">Our Services</h2>

          <div className="card">
            <h3>Individual Tax Preparation</h3>
            <p>
              Federal and state tax returns prepared accurately and on time, with
              personalized support every step of the way.
            </p>

            <h3>Business Tax Services</h3>
            <p>
              Tax solutions for small businesses, self-employed professionals,
              and independent contractors.
            </p>

            <h3>Bookkeeping</h3>
            <p>
              Monthly and quarterly bookkeeping to keep your finances organized,
              compliant, and stress-free.
            </p>
          </div>
        </div>
      </section>

      {/* Portal Announcement */}
      <section className="section portal-section">
        <div className="container">
          <h2 className="section-title">Secure Client Portal</h2>
          
          <div className="portal-content">
            <div className="portal-text">
              <h3>CloudBase Pro Web</h3>
              <p className="subtitle">Your documents, organized and secure</p>
              <ul className="feature-list">
                <li>✓ Upload Documents</li>
                <li>✓ E-Sign Effortlessly</li>
                <li>✓ Track Progress</li>
              </ul>
              <a href="https://rosstaxbookkeeping.com" className="btn btn-navy">
                Access Client Hub
              </a>
            </div>
            <div className="portal-image">
              <img 
                src="/launch-banner.png" 
                alt="CloudBase Pro Web Portal" 
                onError={(e) => {
                  // Fallback if image not found
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Navy Divider Footer */}
      <section className="footerbar">
        <div className="container footerbar-inner">
          © 2026 Ross Tax &amp; Bookkeeping. All rights reserved.
        </div>
      </section>

      {/* Intake Form */}
      <section className="section" id="intake">
        <div className="container">
          <h2 className="section-title">Client Intake Form</h2>

          <form className="form">
            <label>
              <span>Full Name</span>
              <input type="text" required />
            </label>

            <label>
              <span>Email Address</span>
              <input type="email" required />
            </label>

            <label>
              <span>Phone Number</span>
              <input type="tel" />
            </label>

            <label>
              <span>Service Needed</span>
              <select>
                <option>Individual Tax Preparation</option>
                <option>Business Tax Services</option>
                <option>Bookkeeping</option>
              </select>
            </label>

            <button type="submit" className="btn btn-navy">
              Submit Intake Request
            </button>

            <p className="disclosure">
              Condre Ross | Owner | Lead Tax Professional | PTIN P03215544
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
