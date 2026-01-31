import jsPDF from "jspdf";
import logo from "../public/rtb-logo.png";

export function generatePortalGuidePDF(returnDoc = false) {
  const doc = new jsPDF();
  // Logo
  doc.addImage(logo, "PNG", 60, 10, 90, 30);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(11, 35, 59); // Navy
  doc.text("Client Portal Guide", 105, 50, { align: "center" });
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(11, 35, 59);
  // Steps
  const steps = [
    { icon: "⬆️", label: "Upload: ID, tax forms, financials" },
    { icon: "🔍", label: "Review: Staff checks completeness & compliance" },
    { icon: "✅", label: "Approve: Review summary, sign, pay" },
    { icon: "📤", label: "File: IRS/state e-file, confirmation, archive" }
  ];
  let y = 70;
  steps.forEach((step, i) => {
    doc.setFontSize(18);
    doc.text(step.icon, 25, y);
    doc.setFontSize(13);
    doc.text(step.label, 40, y);
    doc.setTextColor(201, 162, 77); // Gold check for completed steps
    if (i > 0) doc.text("✔", 180, y);
    doc.setTextColor(11, 35, 59);
    y += 18;
  });
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text("Est. 2021 | Independently Owned & Operated | LGBTQ+ Owned", 105, 285, { align: "center" });
  if (returnDoc) return doc;
  doc.save("RossTax_Client_Portal_Guide.pdf");
}
