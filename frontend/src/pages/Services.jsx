

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
            <Card>
              <h3>Individual Tax Preparation (1040)</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>Flat Fee: $1,499.99</div>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Federal 1040 & 1 state return</li>
                <li>W-2, 1099, Social Security, retirement, and basic credits</li>
                <li>Due diligence, e-file, audit support</li>
                <li>Includes compliance review and secure portal</li>
              </ul>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Add $150 per extra state. Complexities (rental, K-1, crypto, etc.) may increase fee.</div>
            </Card>
            <Card>
              <h3>Self-Employed / Schedule C</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>Flat Fee: $1,699.99</div>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>1040 with Schedule C (sole prop/LLC)</li>
                <li>Business income/expense, home office, depreciation</li>
                <li>1 state included, e-file, compliance review</li>
                <li>Includes audit support and secure portal</li>
              </ul>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Add $150 per extra state. Bookkeeping not included.</div>
            </Card>
            <Card>
              <h3>Business Tax Prep (S-Corp, C-Corp, Multi-Member LLC)</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>Flat Fee: $2,499.99</div>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>1120, 1120S, 1065, or state equivalent</li>
                <li>Financial review, officer/shareholder comp, K-1s</li>
                <li>Includes compliance, e-file, audit support</li>
                <li>Secure portal for uploads and signatures</li>
              </ul>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Add $250 per extra state. Payroll, bookkeeping, and 1099s billed separately.</div>
            </Card>
            <Card>
              <h3>Bookkeeping & Write-Up</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>From $299/mo</div>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Monthly/quarterly bookkeeping</li>
                <li>Bank/credit card reconciliation</li>
                <li>Financial statements, year-end close</li>
                <li>QuickBooks/Xero setup & support</li>
              </ul>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Includes up to 3 accounts. Additional accounts or catch-up billed separately.</div>
            </Card>
            <Card>
              <h3>Payroll & Contractor Payments</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>From $99/mo</div>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Payroll processing, direct deposit, tax filings</li>
                <li>W-2, W-3, 1099-NEC, 1096</li>
                <li>Quarterly/annual payroll tax returns</li>
                <li>Reasonable comp analysis (S-Corp)</li>
              </ul>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Includes up to 5 employees/contractors. Additional billed per person.</div>
            </Card>
            <Card>
              <h3>Notary Public (TX, LA, AR)</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>From $50</div>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Certified notary for Texas, Louisiana, Arkansas</li>
                <li>Document witnessing & certification</li>
                <li>Mobile notary available (by appointment)</li>
              </ul>
            </Card>
            <Card>
              <h3>IRS/State Notice Response & Audit Defense</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>From $399/case</div>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>Respond to IRS/state letters, notices, and audits</li>
                <li>Includes research, response drafting, and follow-up</li>
                <li>Audit defense for returns we prepared</li>
              </ul>
            </Card>
            <Card>
              <h3>Business Formation & Compliance</h3>
              <div style={{ fontWeight: 700, color: "#C9A24D", fontSize: 18 }}>From $499</div>
              <ul style={{ margin: '12px 0 0 18px', fontSize: 15 }}>
                <li>LLC, S-Corp, C-Corp, EIN, state registration</li>
                <li>Operating agreements, compliance checklists</li>
                <li>Registered agent (TX, LA, AR)</li>
              </ul>
            </Card>
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
