import jsPDF from "jspdf";

export function generateServicesPricingPDF(returnDoc = false) {
  const doc = new jsPDF();
  // Logo - using text based branding
  doc.setFont("georgia", "bold");
  doc.setFontSize(28);
  doc.setTextColor(243, 160, 6); // Gold
  doc.text("ROSS", 20, 25);
  // Title
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(11, 35, 59); // Navy
  doc.text("Services & Pricing Guide", 105, 50, { align: "center" });
  // Pricing Table
  doc.setFontSize(14);
  doc.setTextColor(201, 162, 77); // Gold
  doc.text("Individual & Basic Tax Filers: Starting at $1,399.99", 20, 70);
  doc.text("Schedule C / Sole Prop / LLC: Starting at $1,499.99", 20, 80);
  doc.text("Business Tax Prep (LLC/S-Corp/C-Corp): Starting at $1,999.99", 20, 90);
  doc.setTextColor(11, 35, 59);
  doc.setFontSize(12);
  doc.text("All services include: Federal & state returns, compliance review, e-file, due diligence.", 20, 100);
  // Non-refundable policy
  doc.setFillColor(245, 241, 232); // Cream
  doc.rect(15, 110, 180, 20, "F");
  doc.setTextColor(201, 162, 77);
  doc.setFont("helvetica", "bold");
  doc.text("All services rendered are non-refundable.", 105, 122, { align: "center" });
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text("Est. 2021 | Independently Owned & Operated | LGBTQ+ Owned", 105, 285, { align: "center" });
  if (returnDoc) return doc;
  doc.save("RossTax_Services_Pricing_Guide.pdf");
}
