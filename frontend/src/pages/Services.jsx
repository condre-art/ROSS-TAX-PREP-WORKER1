

import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { generateServicesPricingPDF } from "../utils/generateServicesPricingPDF";
import CertificateBadge from "../components/CertificateBadge";

export default function Services() {
  const handleTextbookPurchase = (volumeName) => {
    // Redirect to LMS API for textbook sales
    window.location.href = `/api/lms/textbooks/${volumeName}`;
  };

  const serviceCategories = [
    {
      title: "🧾 Individual Tax Preparation",
      services: [
        {
          name: "Basic W-2 Individual Return",
          price: "$499 – $1,200",
          description: "W-2 income reporting, dependents, standard deductions, common credits (CTC, education). Perfect for salaried individuals."
        },
        {
          name: "Complex Individual Tax Return",
          price: "$2,500 – $3,750",
          description: "Multiple income sources, retirement income, capital gains, credit optimization, prior-year issues, advanced compliance review."
        }
      ]
    },
    {
      title: "🏢 Business Taxation & Bookkeeping",
      services: [
        {
          name: "Business + Year-Round Bookkeeping + Tax Return",
          price: "$4,250 – $9,000+",
          description: "Year-round bookkeeping, monthly transaction categorization, financial statement readiness, business tax return preparation, tax-ready financials for lenders & audits."
        }
      ]
    },
    {
      title: "📊 Monthly Bookkeeping Tiers",
      services: [
        {
          name: "Essential Compliance",
          price: "Starting at $199/month",
          description: "Basic transaction categorization and monthly review."
        },
        {
          name: "Growth Bookkeeping",
          price: "Starting at $349/month",
          description: "Reconciliations, financial summaries, tax-ready reports."
        },
        {
          name: "Executive / CFO-Style Oversight",
          price: "$599 – $1,200/month",
          description: "Advanced reporting, strategy discussions, business tax coordination."
        }
      ]
    },
    {
      title: "🧮 IRS Resolution Services",
      services: [
        {
          name: "IRS Audit Representation",
          price: "$2,500 – $6,500",
          description: "Direct IRS communication and audit defense."
        },
        {
          name: "Offer in Compromise (OIC)",
          price: "$3,500 – $7,500",
          description: "Debt settlement negotiation and IRS settlement agreements."
        },
        {
          name: "Wage Garnishment & Levy Release",
          price: "$1,500 – $4,000",
          description: "Immediate relief from wage garnishments and asset levies."
        },
        {
          name: "IRS Notices & Compliance Issues",
          price: "Case-based pricing",
          description: "Specialized handling of complex IRS notices and compliance matters."
        }
      ]
    },
    {
      title: "✍🏽 Notary Public Services (TX • LA • AR)",
      services: [
        {
          name: "General Notarization",
          price: "$25 – $75 per signature",
          description: "Document notarization and verification."
        },
        {
          name: "Mobile Notary",
          price: "$150 – $350",
          description: "On-location notary services with travel included."
        },
        {
          name: "Real Estate / Loan Signings",
          price: "$250 – $500",
          description: "Comprehensive loan package and real estate document signing."
        },
        {
          name: "After-Hours / Emergency Services",
          price: "$200 – $450",
          description: "Premium availability for urgent notarization needs."
        }
      ]
    }
  ];

  const textbooks = [
    {
      id: "vol1",
      name: "Student Textbook – Volume 1",
      price: "$129.99",
      description: "Foundational federal tax education covering individual tax preparation, ethics, credits, deductions, and real-world practice scenarios.",
      required: true
    },
    {
      id: "vol2",
      name: "Student Textbook – Volume 2",
      price: "$79.99",
      description: "Advanced individual taxation, Schedule C, business income, depreciation, and applied tax planning.",
      required: true
    },
    {
      id: "instructor",
      name: "Instructor Edition (Volumes 1–4)",
      price: "$399.99",
      description: "Complete instructional system including all student volumes, answer keys, lesson plans, and comprehensive syllabus.",
      restricted: true
    }
  ];

  return (
    <>
      <CertificateBadge />
      <section className="section">
        <div className="container">
          <div className="section-head" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2>Luxury Tax Preparation, IRS Resolution & Notary Services</h2>
            <p className="section-sub">Serving Texas • Louisiana • Arkansas</p>
            <p style={{ fontSize: 16, marginTop: 12, color: '#2C3E50' }}>
              Premium tax services built for clients who expect more. We do not compete on price. We compete on expertise, protection, and long-term strategy.
            </p>
            <Button variant="accent" onClick={generateServicesPricingPDF} style={{ alignSelf: 'flex-start', marginTop: 16 }}>
              Download Complete Services & Pricing Guide (PDF)
            </Button>
          </div>

          {/* Service Categories */}
          {serviceCategories.map((category, idx) => (
            <div key={idx} style={{ marginTop: 48, marginBottom: 32 }}>
              <h3 style={{ color: '#003366', marginBottom: 20 }}>{category.title}</h3>
              <div className="grid" style={{ display: "flex", gap: 20, flexWrap: "wrap", flexDirection: "column" }}>
                {category.services.map((service, sidx) => (
                  <Card key={sidx} style={{ padding: 24, borderLeft: '4px solid #F3A006' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, color: '#003366' }}>{service.name}</h4>
                      <span style={{ fontSize: 18, fontWeight: 'bold', color: '#F3A006', whiteSpace: 'nowrap', marginLeft: 16 }}>
                        {service.price}
                      </span>
                    </div>
                    <p style={{ margin: '12px 0 0 0', color: '#555', lineHeight: 1.6 }}>
                      {service.description}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Ross Tax Academy Textbooks */}
          <div style={{ marginTop: 56, marginBottom: 32, paddingTop: 32, borderTop: '2px solid #e0e0e0' }}>
            <h3 style={{ color: '#003366', marginBottom: 12 }}>🎓 Ross Tax Academy – Required Course Materials</h3>
            <p style={{ fontSize: 15, color: '#555', marginBottom: 24, lineHeight: 1.6 }}>
              All Ross Tax Academy programs require the purchase of official proprietary textbooks developed exclusively for Ross Tax Academy curricula. These materials are mandatory and aligned with instructional content, assessments, and certification requirements.
            </p>
            <div className="grid" style={{ display: "flex", gap: 20, flexWrap: "wrap", flexDirection: "column" }}>
              {textbooks.map((textbook) => (
                <Card key={textbook.id} style={{ padding: 24, borderLeft: '4px solid #27AE60' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#003366' }}>{textbook.name}</h4>
                      {textbook.required && <span style={{ fontSize: 12, color: '#E74C3C', fontWeight: 'bold' }}>REQUIRED</span>}
                      {textbook.restricted && <span style={{ fontSize: 12, color: '#F3A006', fontWeight: 'bold' }}>INSTRUCTOR ONLY</span>}
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 'bold', color: '#27AE60', whiteSpace: 'nowrap', marginLeft: 16 }}>
                      {textbook.price}
                    </span>
                  </div>
                  <p style={{ margin: '12px 0 16px 0', color: '#555', lineHeight: 1.6 }}>
                    {textbook.description}
                  </p>
                  <Button 
                    variant="accent" 
                    style={{ padding: '8px 16px', fontSize: 14 }}
                    onClick={() => handleTextbookPurchase(textbook.id)}
                  >
                    Purchase Textbook
                  </Button>
                </Card>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 16, backgroundColor: '#F4F8FB', borderRadius: 6 }}>
              <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                <strong>📌 Important:</strong> Textbooks are separate from tuition unless stated otherwise. All textbook sales are non-refundable once accessed. Ross Tax Academy materials are proprietary educational content. Unauthorized reproduction or distribution is prohibited.
              </p>
            </div>
          </div>

          {/* Policies Section */}
          <div style={{ marginTop: 56, paddingTop: 32, borderTop: '2px solid #e0e0e0' }}>
            <h3 style={{ color: '#003366', marginBottom: 24 }}>⚖️ Important Service Policies & Disclosures</h3>
            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>🚫 Non-Refundable Services</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  <b>All services are non-refundable.</b> Once work begins, fees cannot be refunded due to the nature of professional services and regulatory compliance. This includes tax preparation, bookkeeping, IRS resolution, and notary services.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>💳 Payment Required</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  <b>Full payment required before delivery.</b> No returns are filed, services delivered, or documents released until payment is received in full. All invoices are due within 30 days.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>📋 Client Responsibility</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  You must provide accurate, complete, and timely information. Ross Tax & Bookkeeping is not responsible for penalties or interest due to client omissions, errors, or late submissions.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>⚠️ Scope of Services</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  Ross Tax & Bookkeeping is not a law firm or CPA firm. We do not offer legal advice, representation, or formal CPA opinions. Consult a licensed attorney or CPA for legal matters.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>🔐 Data Protection</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  All data is encrypted in transit and at rest. We comply with IRS Publication 1075, SOC2, and state privacy requirements. Your information is never shared without consent.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>📞 Audit Support</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  All returns include basic audit support for notices and correspondence related to our work. Representation rates apply for extended IRS matters.
                </p>
              </Card>
            </div>
          </div>

          {/* Legal / Arbitration */}
          <div style={{ marginTop: 32, padding: 24, backgroundColor: '#F9F9F9', borderRadius: 6, borderLeft: '4px solid #003366' }}>
            <h3 style={{ color: '#003366', marginTop: 0 }}>⚔️ Legal & Client Protection</h3>
            <p style={{ color: '#555', lineHeight: 1.7 }}>
              All services are governed by Texas law and include a mandatory arbitration agreement. This protects both client and firm while ensuring professional standards. 
              Disputes are resolved through binding arbitration, not litigation. No class actions are permitted. By engaging our services, you agree to these terms.
            </p>
          </div>

          {/* CTA Section */}
          <div className="cta-row" style={{ marginTop: 48, textAlign: "center", padding: 32, backgroundColor: '#F4F8FB', borderRadius: 6 }}>
            <h3 style={{ marginTop: 0, color: '#003366' }}>Ready to Work With Us?</h3>
            <p style={{ fontSize: 16, color: '#555', marginBottom: 24 }}>
              Submit your intake form or contact us directly for a consultation.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button as={Link} to="/intake" style={{ minWidth: 200 }}>
                Submit Client Intake
              </Button>
              <Button variant="secondary" style={{ minWidth: 200 }}>
                📧 CondreR@outlook.com
              </Button>
              <Button variant="secondary" style={{ minWidth: 200 }}>
                📞 254-394-7438
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
