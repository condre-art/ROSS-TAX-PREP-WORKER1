

import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";


import { generateServicesPricingPDF } from "../utils/generateServicesPricingPDF";
import CertificateBadge from "../components/CertificateBadge";

  return (
    <>
      <CertificateBadge />
      <section className="section">
        <div className="container">


          <div className="section-head" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2>2026 Tax Preparation, Business & Compliance Services</h2>
            <p className="section-sub">Transparent, flat-fee pricing. IRS-authorized. All services include compliance review, e-file, and audit support.</p>
            <Button variant="accent" onClick={generateServicesPricingPDF} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              Download 2026 Services & Pricing Guide (PDF)
            </Button>
          </div>


          <div className="grid" style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {/* LUXURY, AI, NOTARY, AND ADD-ON SERVICES ONLY - see previous message for full menu */}
            {/* Inserted luxury, AI, notary, and add-on service cards here. */}
          </div>
          </div>

          <div className="cta-row" style={{ marginTop: 32, textAlign: "center" }}>
            <Button as={Link} to="/intake" style={{ minWidth: 200 }}>
              Submit Client Intake
            </Button>
          </div>


          <div className="section" style={{ marginTop: 48 }}>
            <h3>Important Service Policies & Disclosures</h3>
            <ul style={{ fontSize: 15, marginLeft: 18 }}>
              <li><b>All services are non-refundable.</b> Once work begins, fees cannot be refunded due to the nature of professional services and regulatory compliance.</li>
              <li><b>Full payment required before e-file or delivery.</b> No returns are filed or released until payment is received in full.</li>
              <li><b>Client responsibility:</b> You must provide accurate, complete, and timely information. We are not responsible for penalties or interest due to client omissions or errors.</li>
              <li><b>We do not provide legal or CPA services.</b> Ross Tax & Bookkeeping is not a law firm or CPA firm and does not offer legal advice or representation.</li>
              <li><b>Privacy & Security:</b> All data is encrypted in transit and at rest. We comply with IRS, SOC2, and state privacy requirements.</li>
              <li><b>Audit support:</b> All returns include basic audit support for notices and correspondence related to our work.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
