#!/usr/bin/env python3
"""
IRS Audit Defense Playbook PDF Generator - Simplified Version
Ross Tax Prep & Bookkeeping LLC
EIN: 33-4891499

Generates a comprehensive, branded PDF playbook for IRS audit response procedures.
"""

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from datetime import datetime
import os

# Output file path
output_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(output_dir, "IRS_Audit_Defense_Playbook_ROSS_TAX_PREP.pdf")

# Company branding colors
BRAND_NAVY = colors.HexColor("#0A2540")
BRAND_GOLD = colors.HexColor("#D4AF37")
LIGHT_GRAY = colors.HexColor("#F4F6F8")
ACCENT_RED = colors.HexColor("#C41E3A")

# Document setup
doc = SimpleDocTemplate(
    file_path,
    pagesize=LETTER,
    rightMargin=48,
    leftMargin=48,
    topMargin=48,
    bottomMargin=48,
    title="IRS Audit Defense Playbook",
    author="Ross Tax Prep & Bookkeeping LLC",
)

# Define custom styles
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "TitleStyle",
    parent=styles["Heading1"],
    fontSize=24,
    textColor=BRAND_NAVY,
    alignment=TA_CENTER,
    spaceAfter=6,
    spaceBefore=12,
    fontName="Helvetica-Bold"
)

subtitle_style = ParagraphStyle(
    "SubtitleStyle",
    parent=styles["Normal"],
    fontSize=12,
    textColor=BRAND_GOLD,
    alignment=TA_CENTER,
    spaceAfter=20,
    fontName="Helvetica"
)

header_style = ParagraphStyle(
    "HeaderStyle",
    parent=styles["Heading2"],
    fontSize=14,
    textColor=BRAND_NAVY,
    alignment=TA_LEFT,
    spaceAfter=12,
    spaceBefore=12,
    fontName="Helvetica-Bold"
)

body_style = ParagraphStyle(
    "BodyStyle",
    parent=styles["Normal"],
    fontSize=10,
    alignment=TA_JUSTIFY,
    spaceAfter=10,
    leading=14,
    fontName="Helvetica"
)

warning_style = ParagraphStyle(
    "WarningStyle",
    parent=styles["Normal"],
    fontSize=10,
    textColor=ACCENT_RED,
    alignment=TA_LEFT,
    spaceAfter=10,
    fontName="Helvetica-Bold"
)

# Build document content
content = []

# ===== COVER PAGE =====
content.append(Spacer(1, 0.5 * 72))
content.append(Paragraph("IRS AUDIT DEFENSE PLAYBOOK", title_style))
content.append(Paragraph("Ross Tax Prep &amp; Bookkeeping LLC", subtitle_style))
content.append(Spacer(1, 12))

# Company info
company_info = Table(
    [
        ["Business Name:", "Ross Tax Prep &amp; Bookkeeping LLC"],
        ["EIN:", "33-4891499"],
        ["Location:", "Killeen &amp; Temple, Texas"],
        ["Document Type:", "Confidential | Internal Use Only"],
        ["Effective Date:", datetime.now().strftime("%B %d, %Y")],
        ["Classification:", "CONFIDENTIAL - Attorney-Client Privileged"]
    ],
    colWidths=[150, 300]
)
company_info.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
    ("TEXTCOLOR", (0, 0), (-1, -1), BRAND_NAVY),
    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey)
]))
content.append(company_info)
content.append(Spacer(1, 24))

# Confidentiality notice
content.append(Paragraph(
    "<b>CONFIDENTIALITY NOTICE</b>",
    header_style
))
content.append(Paragraph(
    "This document is privileged and confidential attorney work product and is intended solely for the use "
    "of Ross Tax Prep &amp; Bookkeeping LLC and its authorized representatives. If you are not the intended "
    "recipient, please do not read, distribute, or take action based on this document. Unauthorized disclosure "
    "may waive attorney-client privilege.",
    body_style
))

content.append(PageBreak())

# ===== TABLE OF CONTENTS =====
content.append(Paragraph("TABLE OF CONTENTS", header_style))
content.append(Spacer(1, 12))

toc_items = [
    "1. Purpose &amp; Scope",
    "2. Core Audit Defense Principles",
    "3. IRS Notice Classification &amp; Response Timeline",
    "4. Notice Receipt &amp; Logging Procedures",
    "5. Staffing &amp; Communication Authorization Matrix",
    "6. Evidence Retention &amp; Document Management",
    "7. Approved IRS Communication Scripts",
    "8. Audit Response Procedures",
    "9. Escalation Thresholds &amp; Triggers",
    "10. Staff Training &amp; Compliance",
    "11. Post-Audit Review &amp; Remediation",
    "12. Emergency Contact Protocols",
]

for item in toc_items:
    content.append(Paragraph(item, body_style))

content.append(PageBreak())

# ===== SECTION 1: PURPOSE & SCOPE =====
content.append(Paragraph("1. PURPOSE &amp; SCOPE", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "<b>Objective:</b> This playbook establishes centralized procedures for managing IRS notices, audit inquiries, "
    "and related compliance matters to minimize risk, protect client confidentiality, and ensure consistent, defensible responses.",
    body_style
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Scope:</b> This playbook applies to all staff members, contractors, and partners involved in tax preparation, "
    "audit defense, or IRS communication at Ross Tax Prep &amp; Bookkeeping LLC.",
    body_style
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Authority:</b> This procedure is authorized under IRC &#167;6001 (Records), Treasury Regulation &#167;1.6001-1 "
    "(Records and their retention), and Circular 230 (Standards for tax practitioners).",
    body_style
))

# ===== SECTION 2: CORE PRINCIPLES =====
content.append(Spacer(1, 16))
content.append(Paragraph("2. CORE AUDIT DEFENSE PRINCIPLES", header_style))
content.append(Spacer(1, 8))

principles_data = [
    [Paragraph("<b>Principle</b>", styles["Normal"]), Paragraph("<b>Description</b>", styles["Normal"])],
    [
        Paragraph("Centralized Communication", body_style),
        Paragraph(
            "All IRS communication is handled exclusively by the Audit Defense Team (Admin + CTO). "
            "No direct staff-to-IRS contact is permitted.",
            body_style
        )
    ],
    [
        Paragraph("Written Responses Only", body_style),
        Paragraph(
            "All IRS responses are provided in writing with documented delivery. Verbal responses are prohibited "
            "unless explicitly authorized by legal counsel.",
            body_style
        )
    ],
    [
        Paragraph("No Admissions of Liability", body_style),
        Paragraph(
            "Staff are trained to never admit fault, speculate about corrections, or volunteer additional "
            "information beyond what is directly requested.",
            body_style
        )
    ],
    [
        Paragraph("24-72 Hour Buffer", body_style),
        Paragraph(
            "No response is sent within 24 hours of receipt. This ensures review, legal analysis, and quality control. "
            "Responses are sent within 72 hours or deadline, whichever is sooner.",
            body_style
        )
    ],
]

principles_table = Table(principles_data, colWidths=[140, 360])
principles_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BRAND_NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))

content.append(principles_table)

content.append(PageBreak())

# ===== SECTION 3: NOTICE CLASSIFICATION =====
content.append(Paragraph("3. IRS NOTICE CLASSIFICATION &amp; RESPONSE TIMELINE", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "All IRS notices must be immediately classified by the Audit Defense Team. Classification determines "
    "response timeline, escalation, and required documentation.",
    body_style
))
content.append(Spacer(1, 12))

notice_data = [
    [
        Paragraph("<b>Classification</b>", styles["Normal"]),
        Paragraph("<b>Examples</b>", styles["Normal"]),
        Paragraph("<b>Response Deadline</b>", styles["Normal"]),
        Paragraph("<b>Escalation</b>", styles["Normal"])
    ],
    [
        Paragraph("INFORMATION REQUEST", body_style),
        Paragraph("CP2000, Math verification, Routine inquiry", body_style),
        Paragraph("30 days from notice date", body_style),
        Paragraph("Manager review if &gt; $5K change", body_style)
    ],
    [
        Paragraph("AUDIT NOTICE (Low Risk)", body_style),
        Paragraph("Correspondence audit, Form inquiry", body_style),
        Paragraph("30 days from notice date", body_style),
        Paragraph("CTO + Legal if &gt; $10K", body_style)
    ],
    [
        Paragraph("AUDIT NOTICE (High Risk)", body_style),
        Paragraph("Office audit, Fieldwork notice, Criminal referral", body_style),
        Paragraph("15 days from notice date", body_style),
        Paragraph("IMMEDIATE: Legal counsel", body_style)
    ],
    [
        Paragraph("PENALTY NOTICE", body_style),
        Paragraph("Accuracy-related, Negligence, Fraud penalty", body_style),
        Paragraph("30 days or as specified", body_style),
        Paragraph("IMMEDIATE: Legal counsel", body_style)
    ],
]

notice_table = Table(notice_data, colWidths=[120, 120, 130, 130])
notice_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BRAND_NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))

content.append(notice_table)

content.append(PageBreak())

# ===== SECTION 4: NOTICE RECEIPT PROCEDURES =====
content.append(Paragraph("4. NOTICE RECEIPT &amp; LOGGING PROCEDURES", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "<b>Step 1: Receipt &amp; Initial Review (Same Day)</b><br/>"
    "- Any staff member receiving an IRS notice must immediately notify the Admin<br/>"
    "- Notice is logged in centralized Notice Tracking Spreadsheet with timestamp<br/>"
    "- Notice is scanned and securely stored in shared drive",
    body_style
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Step 2: Classification (Within 2 Hours)</b><br/>"
    "- Admin classifies notice using Notice Classification Matrix (Section 3)<br/>"
    "- Response deadline is calculated and entered into Notice Log<br/>"
    "- If HIGH RISK or PENALTY NOTICE: CTO and legal counsel are notified within 2 hours<br/>"
    "- Client is notified of notice receipt and planned response timeline",
    body_style
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Step 3: Evidence Gathering (Within 24 Hours)</b><br/>"
    "- Audit Defense Team retrieves engagement letter, tax return, and workpapers<br/>"
    "- Review for completeness, accuracy, and discrepancies with IRS question<br/>"
    "- Identify any missing documentation and request from client if needed<br/>"
    "- All evidence is organized and indexed in Notice folder",
    body_style
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Step 4: Response Preparation (Within 48-72 Hours)</b><br/>"
    "- CTO prepares draft response using approved templates and scripts<br/>"
    "- Response is reviewed for accuracy and consistency with prior positions<br/>"
    "- Client is consulted on any changes to prior positions<br/>"
    "- Legal counsel reviews if penalties or fraud allegations present<br/>"
    "- Final response is approved by Admin/CTO before mailing",
    body_style
))

content.append(PageBreak())

# ===== SECTION 5: COMMUNICATION AUTHORIZATION =====
content.append(Paragraph("5. STAFFING &amp; COMMUNICATION AUTHORIZATION MATRIX", header_style))
content.append(Spacer(1, 8))

auth_data = [
    [
        Paragraph("<b>Role</b>", styles["Normal"]),
        Paragraph("<b>Authorization Level</b>", styles["Normal"]),
        Paragraph("<b>Permitted Actions</b>", styles["Normal"])
    ],
    [
        Paragraph("Preparers", body_style),
        Paragraph("NONE", body_style),
        Paragraph("Must escalate any IRS communication to Admin.", body_style)
    ],
    [
        Paragraph("Staff", body_style),
        Paragraph("LIMITED", body_style),
        Paragraph("May receive/acknowledge receipt. Must immediately escalate to Audit Defense Team.", body_style)
    ],
    [
        Paragraph("CTO", body_style),
        Paragraph("FULL", body_style),
        Paragraph("Manages all aspects: receive, classify, respond, escalate, interface with legal counsel.", body_style)
    ],
    [
        Paragraph("Legal Counsel", body_style),
        Paragraph("ADVISORY", body_style),
        Paragraph("Consults on penalty notices, criminal referrals, fraud allegations. Reviews responses.", body_style)
    ],
]

auth_table = Table(auth_data, colWidths=[100, 130, 220])
auth_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BRAND_NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))

content.append(auth_table)

content.append(PageBreak())

# ===== SECTION 6: EVIDENCE RETENTION =====
content.append(Paragraph("6. EVIDENCE RETENTION &amp; DOCUMENT MANAGEMENT", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "<b>Retention Policy Summary:</b> All tax records, workpapers, engagement letters, correspondence, and IRS acknowledgments "
    "must be retained for a minimum of <b>seven (7) years</b> from the later of: (a) tax return filing date, or (b) client "
    "engagement termination.",
    body_style
))

content.append(Spacer(1, 12))

retention_data = [
    [
        Paragraph("<b>Document Type</b>", styles["Normal"]),
        Paragraph("<b>Retention Period</b>", styles["Normal"]),
        Paragraph("<b>Storage Location</b>", styles["Normal"])
    ],
    [
        Paragraph("Tax Returns &amp; Forms", body_style),
        Paragraph("7 years", body_style),
        Paragraph("Secure server + encrypted backup", body_style)
    ],
    [
        Paragraph("Workpapers &amp; Schedules", body_style),
        Paragraph("7 years", body_style),
        Paragraph("Secure server + encrypted backup", body_style)
    ],
    [
        Paragraph("Engagement Letters", body_style),
        Paragraph("7 years", body_style),
        Paragraph("Client file + CRM system", body_style)
    ],
    [
        Paragraph("IRS Correspondence", body_style),
        Paragraph("7 years", body_style),
        Paragraph("Compliance folder + backup DB", body_style)
    ],
]

retention_table = Table(retention_data, colWidths=[150, 120, 180])
retention_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BRAND_NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))

content.append(retention_table)

content.append(PageBreak())

# ===== SECTION 7: COMMUNICATION SCRIPTS =====
content.append(Paragraph("7. APPROVED IRS COMMUNICATION SCRIPTS", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "<b>Script #1: Notice Receipt Acknowledgment</b><br/>"
    "<i>\"Thank you for contacting Ross Tax Prep &amp; Bookkeeping LLC. All IRS correspondence and inquiries are "
    "handled by our compliance team. Please submit requests in writing to our office address.\"</i>",
    body_style
))

content.append(Spacer(1, 12))

content.append(Paragraph(
    "<b>Script #2: Standard Response Cover Letter</b><br/>"
    "<i>\"On behalf of [CLIENT NAME], we hereby respond to your [NOTICE CODE] as follows: [INSERT RESPONSE / ATTACHMENTS].\"</i>",
    body_style
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>PROHIBITED PHRASES:</b><br/>"
    "- \"We made a mistake...\" (admission of error)<br/>"
    "- \"The client didn't provide...\" (shifting blame)<br/>"
    "- \"We weren't aware of...\" (lack of diligence)<br/>"
    "- \"We assumed...\" (speculation)<br/>"
    "- Any verbal responses or admissions to IRS agents",
    warning_style
))

content.append(PageBreak())

# ===== SECTION 8: ESCALATION THRESHOLDS =====
content.append(Paragraph("8. ESCALATION THRESHOLDS &amp; TRIGGERS", header_style))
content.append(Spacer(1, 8))

escalation_data = [
    [
        Paragraph("<b>Trigger</b>", styles["Normal"]),
        Paragraph("<b>Action</b>", styles["Normal"]),
        Paragraph("<b>Timeline</b>", styles["Normal"])
    ],
    [
        Paragraph("Penalty &gt; $10,000", body_style),
        Paragraph("Notify legal counsel. Prepare penalty defense memo.", body_style),
        Paragraph("Within 2 hours", body_style)
    ],
    [
        Paragraph("Criminal Referral Language", body_style),
        Paragraph("STOP all communications. Retain criminal tax attorney immediately.", body_style),
        Paragraph("IMMEDIATE", body_style)
    ],
    [
        Paragraph("Fraud Allegation", body_style),
        Paragraph("Treat as criminal matter. Engage specialized tax attorney.", body_style),
        Paragraph("IMMEDIATE", body_style)
    ],
]

escalation_table = Table(escalation_data, colWidths=[130, 220, 100])
escalation_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BRAND_NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))

content.append(escalation_table)

content.append(PageBreak())

# ===== SECTION 9: STAFF TRAINING =====
content.append(Paragraph("9. STAFF TRAINING &amp; COMPLIANCE", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "<b>Required Training:</b><br/>"
    "- All staff must complete IRS Audit Defense Training before handling client files<br/>"
    "- Training covers: Notice classification, escalation procedures, approved scripts<br/>"
    "- Annual refresher training required for all staff<br/>"
    "- New staff must pass quiz (80% minimum) before unsupervised client access",
    body_style
))

content.append(Spacer(1, 12))

content.append(Paragraph(
    "<b>Monitoring &amp; Compliance:</b><br/>"
    "- All IRS communications logged in centralized tracking system<br/>"
    "- Monthly audit of Notice Log to verify proper classification<br/>"
    "- Quarterly compliance review with all staff<br/>"
    "- Any violation of these procedures results in disciplinary action",
    body_style
))

content.append(Spacer(1, 12))

content.append(Paragraph(
    "<b>Confidentiality &amp; Privilege:</b><br/>"
    "All IRS notices, responses, and audit work are considered attorney work product. "
    "Staff are prohibited from discussing audit matters with anyone except authorized personnel (CTO, Admin, legal counsel).",
    body_style
))

content.append(PageBreak())

# ===== SECTION 10: POST-AUDIT REVIEW =====
content.append(Paragraph("10. POST-AUDIT REVIEW &amp; REMEDIATION", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "Upon resolution of any IRS notice, the Audit Defense Team must conduct a comprehensive review to identify root causes.",
    body_style
))

content.append(Spacer(1, 12))

content.append(Paragraph(
    "<b>Post-Audit Review Checklist:</b><br/>"
    "- Verify IRS determination is fully satisfied<br/>"
    "- Analyze root cause: Return position, inadequate documentation, preparer error, or client misstatement<br/>"
    "- Assess exposure: Would this issue affect other prior-year returns<br/>"
    "- Update procedures: If preparer error, update SOPs<br/>"
    "- Update workpaper: Document conclusion and any changes accepted by IRS<br/>"
    "- Client communication: Explain outcome and lessons learned<br/>"
    "- Firm learning: Memorialize finding in quality control database",
    body_style
))

content.append(PageBreak())

# ===== SECTION 11: EMERGENCY CONTACTS =====
content.append(Paragraph("11. EMERGENCY CONTACT PROTOCOLS", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "In the event of a critical IRS matter, breach, or emergency, notify the following contacts in order:",
    body_style
))

content.append(Spacer(1, 12))

emergency_data = [
    [
        Paragraph("<b>Priority</b>", styles["Normal"]),
        Paragraph("<b>Contact</b>", styles["Normal"]),
        Paragraph("<b>Role</b>", styles["Normal"]),
        Paragraph("<b>Method</b>", styles["Normal"])
    ],
    [
        Paragraph("1", body_style),
        Paragraph("CTO / Admin", body_style),
        Paragraph("Incident Commander", body_style),
        Paragraph("Phone + Email", body_style)
    ],
    [
        Paragraph("2", body_style),
        Paragraph("CEO", body_style),
        Paragraph("Executive", body_style),
        Paragraph("Phone + Email", body_style)
    ],
    [
        Paragraph("3", body_style),
        Paragraph("External Legal Counsel", body_style),
        Paragraph("Attorney", body_style),
        Paragraph("Direct dial (on file)", body_style)
    ],
]

emergency_table = Table(emergency_data, colWidths=[80, 140, 140, 140])
emergency_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BRAND_NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "CENTER"),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))

content.append(emergency_table)

content.append(Spacer(1, 24))
content.append(Paragraph(
    "<b>Do NOT discuss audit matters with anyone not listed above without explicit authorization from CTO.</b>",
    warning_style
))

content.append(PageBreak())

# ===== FOOTER =====
content.append(Spacer(1, 12))
footer_data = [
    [
        Paragraph("<b>Document:</b> IRS Audit Defense Playbook", body_style),
        Paragraph("<b>Effective:</b> " + datetime.now().strftime("%B %d, %Y"), body_style),
        Paragraph("<b>Classification:</b> CONFIDENTIAL", body_style)
    ]
]

footer_table = Table(footer_data, colWidths=[200, 150, 150])
footer_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
    ("TEXTCOLOR", (0, 0), (-1, -1), BRAND_NAVY),
    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))

content.append(footer_table)

# ===== BUILD PDF =====
doc.build(content)

print(f"✅ PDF Generated Successfully!")
print(f"📄 File: {file_path}")
print(f"📊 Size: {os.path.getsize(file_path) / 1024:.1f} KB")
print(f"📋 Document: IRS Audit Defense Playbook")
print(f"🏢 Organization: Ross Tax Prep & Bookkeeping LLC (EIN: 33-4891499)")
print(f"📅 Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}")
