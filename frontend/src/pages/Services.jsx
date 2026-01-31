

import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";

import { generateServicesPricingPDF } from "../utils/generateServicesPricingPDF";

  return (
    <>
      <CertificateBadge />
      <section className="section">
        <div className="container">

          <div className="section-head" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2>Tax Preparation & Business Services</h2>
            <p className="section-sub">Transparent pricing. Professional execution. Compliance-first.</p>
            <Button variant="accent" onClick={generateServicesPricingPDF} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              Download Services & Pricing Guide (PDF)
            </Button>
          </div>

          <div className="grid" style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            <Card>
              <h3>Individual & Basic Tax Filers</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>Starting at $1,399.99</div>
              <p>Final pricing depends on total forms and services rendered.</p>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Federal Individual Tax Return (Form 1040)</li>
                <li>State return (if applicable)</li>
                <li>W-2 income reporting</li>
                <li>Applicable credits and adjustments</li>
                <li>IRS-compliant electronic filing</li>
                <li>Required due diligence review</li>
              </ul>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Note: Pricing may increase based on additional schedules, dependents, prior-year issues, or compliance requirements.</div>
            </Card>
            <Card>
              <h3>Schedule C — Sole Proprietor / Single-Member LLC</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>Starting at $1,499.99</div>
              <p>Pricing varies based on services rendered and forms used.</p>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Individual tax return with Schedule C</li>
                <li>Business income & expense analysis</li>
                <li>Deduction review (ordinary & necessary)</li>
                <li>Basic depreciation</li>
                <li>One state return (if applicable)</li>
                <li>IRS-compliant e-file</li>
              </ul>
            </Card>
            <Card>
              <h3>Business Tax Preparation (LLC • S-Corp • C-Corp)</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>Starting at $1,999.99</div>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Federal business tax return</li>
                <li>State business filings (if required)</li>
                <li>Financial review & reconciliation</li>
                <li>Officer/shareholder compensation review (S-Corp)</li>
                <li>Compliance and accuracy checks</li>
                <li>Secure electronic filing</li>
              </ul>
            </Card>
            <Card>
              <h3>Bookkeeping</h3>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Monthly/quarterly bookkeeping</li>
                <li>Financial statement preparation</li>
                <li>Bank reconciliation</li>
                <li>Expense categorization</li>
                <li>Year-end tax readiness</li>
              </ul>
            </Card>
            <Card>
              <h3>Payroll Services</h3>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Payroll processing & reporting</li>
                <li>W-2, W-3, 1099 filings</li>
                <li>Quarterly/annual payroll tax returns</li>
                <li>Reasonable compensation analysis (S-Corp)</li>
              </ul>
            </Card>
            <Card>
              <h3>Notary Public (TX, LA, AR)</h3>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Certified notary services for Texas, Louisiana, Arkansas</li>
                <li>Document witnessing & certification</li>
                <li>Mobile notary available (by appointment)</li>
              </ul>
            </Card>
          </div>

          <div className="cta-row" style={{ marginTop: 32, textAlign: "center" }}>
            <Button as={Link} to="/intake" style={{ minWidth: 200 }}>
              Submit Client Intake
            </Button>
          </div>

          <div className="section" style={{ marginTop: 48 }}>
            <h3>Important Service Policy</h3>
            <p>All services rendered are <b>non-refundable</b>.<br />Once preparation, review, or filing services begin, fees cannot be refunded, as professional services cannot be reversed or recovered.</p>
          </div>

          <div className="section" style={{ marginTop: 32 }}>
            <h3>Service Agreement / Engagement Letter</h3>
            <p><b>Scope of Services</b><br />Ross Tax & Bookkeeping agrees to provide tax preparation, bookkeeping, payroll, and related compliance services based solely on information provided by the Client. Services are limited to preparation and filing assistance and do not include legal representation.</p>
            <p><b>Fees & Payment</b><br />Fees begin at the published starting rates and may increase based on:<br />- Number and complexity of tax forms<br />- Additional schedules, states, or amendments<br />- IRS or state notices<br />- Prior-year or corrective work<br />Full payment is required prior to electronic filing unless otherwise agreed in writing.</p>
            <p><b>No Refund Policy</b><br />Client acknowledges that all services rendered are non-refundable, as time, labor, expertise, and regulatory compliance obligations cannot be reversed once work has commenced.</p>
            <p><b>Client Responsibility</b><br />Client is responsible for providing accurate, complete, and timely information. Ross Tax & Bookkeeping is not responsible for penalties or interest resulting from omitted or inaccurate client-provided data.</p>
            <p><b>No Legal or CPA Services</b><br />Ross Tax & Bookkeeping is not a law firm or CPA firm and does not provide legal advice or legal representation.</p>
          </div>
        </div>
      </section>
    </>
  );
}
