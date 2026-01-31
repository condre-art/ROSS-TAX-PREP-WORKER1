import JSZip from "jszip";
import { generateServicesPricingPDF } from "./generateServicesPricingPDF";
import { generateEngagementAgreementPDF } from "./generateEngagementAgreementPDF";
import { generatePortalGuidePDF } from "./generatePortalGuidePDF";
import { generateSOPAuditChecklistPDF } from "./generateSOPAuditChecklistPDF";

// Utility to generate all PDFs as blobs and bundle into a ZIP
export async function downloadOnboardingZip() {
  const zip = new JSZip();

  // Helper to get PDF as blob from jsPDF
  async function getPDFBlob(generateFn, filename) {
    const doc = generateFn(true); // Pass true to get doc, not auto-save
    return new Promise(resolve => {
      doc.save(filename, { returnPromise: true }).then(resolve);
    });
  }

  // Generate all PDFs as blobs
  const [services, agreement, portal, sop] = await Promise.all([
    getPDFBlob(generateServicesPricingPDF, "RossTax_Services_Pricing_Guide.pdf"),
    getPDFBlob(generateEngagementAgreementPDF, "RossTax_Engagement_Agreement.pdf"),
    getPDFBlob(generatePortalGuidePDF, "RossTax_Client_Portal_Guide.pdf"),
    getPDFBlob(generateSOPAuditChecklistPDF, "RossTax_Internal_SOP_Audit_Checklist.pdf")
  ]);

  zip.file("RossTax_Services_Pricing_Guide.pdf", services);
  zip.file("RossTax_Engagement_Agreement.pdf", agreement);
  zip.file("RossTax_Client_Portal_Guide.pdf", portal);
  zip.file("RossTax_Internal_SOP_Audit_Checklist.pdf", sop);

  // Generate ZIP and trigger download
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "RossTax_Onboarding_Package.zip";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
