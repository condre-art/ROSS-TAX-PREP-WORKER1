import React from "react";

export default function FAQ() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>Frequently Asked Questions</h2>
          <p className="section-sub">Transparent answers to common questions about our pricing, process, and compliance.</p>
        </div>
        <div className="faq-list" style={{ maxWidth: 700, margin: "0 auto" }}>
          <div className="faq-item">
            <h4>Why do your prices start higher than other tax preparers?</h4>
            <p>Our pricing reflects professional-level tax preparation, compliance responsibility, and due diligence requirements mandated by the IRS. We do not offer “quick” or incomplete filings. Every return is reviewed for accuracy, compliance, and audit risk reduction.</p>
          </div>
          <div className="faq-item">
            <h4>What does “starting at” mean?</h4>
            <p>“Starting at” reflects the base cost for standard filings. Final pricing depends on:</p>
            <ul>
              <li>Number of tax forms and schedules required</li>
              <li>Business activity, credits, or deductions</li>
              <li>Prior-year issues or amendments</li>
              <li>IRS or state compliance requirements</li>
            </ul>
            <p>No two tax situations are identical.</p>
          </div>
          <div className="faq-item">
            <h4>Do you offer refunds if I change my mind?</h4>
            <p>No. All services rendered are non-refundable. Once work begins, professional time, compliance labor, and regulatory obligations cannot be reversed or recovered.</p>
          </div>
          <div className="faq-item">
            <h4>Can I just file myself for cheaper?</h4>
            <p>You can. However, self-filing does not include professional review, due diligence, or compliance protection. Many clients come to us after filing errors, notices, or penalties.</p>
          </div>
          <div className="faq-item">
            <h4>Do you guarantee refunds or outcomes?</h4>
            <p>No tax professional can guarantee outcomes. Refunds and balances due are determined solely by taxing authorities based on accurate reporting.</p>
          </div>
          <div className="faq-item">
            <h4>What if I receive an IRS notice later?</h4>
            <p>Notice review and response preparation are available as separate services and are not included unless explicitly stated in your engagement.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
