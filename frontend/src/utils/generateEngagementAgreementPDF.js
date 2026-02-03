import jsPDF from "jspdf";

export function generateEngagementAgreementPDF(returnDoc = false) {
  const doc = new jsPDF();
  // Logo watermark - text based branding
  doc.setFont("georgia", "bold");
  doc.setFontSize(28);
  doc.setTextColor(243, 160, 6); // Gold
  doc.text("ROSS", 20, 25);
  // Title
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(11, 35, 59); // Navy
  doc.text("Client Engagement Agreement", 105, 50, { align: "center" });
  // Gold divider
  doc.setDrawColor(201, 162, 77);
  doc.setLineWidth(1);
  doc.line(20, 55, 190, 55);
  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(11, 35, 59);
  doc.text(
    [
      "Scope of Services",
      "Preparation of tax returns, bookkeeping, payroll, notary, and related compliance services based solely on information provided by Client.",
      "",
      "Fees",
      "Fees begin at published starting rates and may increase based on complexity, forms required, additional services, or compliance issues. Full payment is required prior to filing.",
      "",
      "No Refund Policy",
      "Client agrees that all services rendered are non-refundable once work has begun.",
      "",
      "Client Responsibility",
      "Client is responsible for accuracy and completeness of all information provided.",
      "",
      "No Legal or CPA Services",
      "Ross Tax & Bookkeeping is not a law firm or CPA firm and does not provide legal advice or legal representation."
    ],
    20, 65
  );
  // Signature page
  doc.addPage();
  // Logo watermark on signature page
  doc.setFont("georgia", "bold");
  doc.setFontSize(28);
  doc.setTextColor(243, 160, 6); // Gold
  doc.text("ROSS", 20, 25);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(11, 35, 59);
  doc.text("Signature Page", 105, 50, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Client Signature: ___________________________", 30, 90);
  doc.text("Date: _______________", 30, 105);
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text("Est. 2021 | Independently Owned & Operated | LGBTQ+ Owned", 105, 285, { align: "center" });
  if (returnDoc) return doc;
  doc.save("RossTax_Engagement_Agreement.pdf");
}
