import jsPDF from "jspdf";

export function generateSOPAuditChecklistPDF(returnDoc = false) {
  const doc = new jsPDF();
  // Logo - text based branding
  doc.setFont("georgia", "bold");
  doc.setFontSize(28);
  doc.setTextColor(243, 160, 6); // Gold
  doc.text("ROSS", 20, 25);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(11, 35, 59); // Navy
  doc.text("Internal SOP & Audit Checklist", 105, 50, { align: "center" });
  // Grey/white body
  doc.setFillColor(240, 240, 240);
  doc.rect(15, 60, 180, 120, "F");
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(11, 35, 59);
  // Checklist
  const items = [
    "Identity verification (KYC standards)",
    "Form 8867 completion when applicable",
    "Income reasonableness review",
    "Credit eligibility verification",
    "Record retention (min. 3 years)",
    "E-file authorization (Forms 8879/equivalents)",
    "Intake completed and acknowledged",
    "Documents reviewed for completeness",
    "Missing info request sent (if needed)",
    "Return prepared",
    "Compliance review performed",
    "Client approval obtained",
    "E-file submitted",
    "Confirmation archived"
  ];
  let y = 70;
  items.forEach(item => {
    doc.setTextColor(11, 35, 59);
    doc.text("•", 22, y);
    doc.text(item, 28, y);
    if (item.includes("REQUIRED")) {
      doc.setTextColor(201, 162, 77);
      doc.text("REQUIRED", 170, y);
    }
    y += 10;
  });
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text("Est. 2021 | Independently Owned & Operated | LGBTQ+ Owned", 105, 285, { align: "center" });
  if (returnDoc) return doc;
  doc.save("RossTax_Internal_SOP_Audit_Checklist.pdf");
}
