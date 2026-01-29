#!/usr/bin/env python3
"""
IRS Audit Defense Playbook PDF Generator
Ross Tax Prep & Bookkeeping LLC
EIN: 33-4891499

Generates a comprehensive, branded PDF playbook for IRS audit response procedures.
"""

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, KeepTogether
)
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
ACCENT_RED = colors.HexColor("#C41E3A")  # For warnings

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

section_header = ParagraphStyle(
    "SectionHeader",
    parent=styles["Heading3"],
    fontSize=12,
    textColor=colors.white,
    alignment=TA_LEFT,
    spaceAfter=8,
    spaceBefore=8,
    fontName="Helvetica-Bold",
    backColor=BRAND_NAVY
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
    "13. Appendix A: Notice Classification Matrix",
    "14. Appendix B: Evidence Retention Schedule",
    "15. Appendix C: IRS Communication Templates"
]

for item in toc_items:
    content.append(Paragraph(item, body_style))

content.append(PageBreak())

# ===== SECTION 1: PURPOSE & SCOPE =====
content.append(Paragraph("1. PURPOSE &amp; SCOPE", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "<b>Objective:</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))
content.append(Paragraph(
    "This playbook establishes centralized procedures for managing IRS notices, audit inquiries, and "
    "related compliance matters to minimize risk, protect client confidentiality, and ensure consistent, "
    "defensible responses.",
    body_style
))

content.append(Paragraph(
    "<b>Scope:</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))
content.append(Paragraph(
    "This playbook applies to all staff members, contractors, and partners involved in tax preparation, "
    "audit defense, or IRS communication at Ross Tax Prep &amp; Bookkeeping LLC.",
    body_style
))

content.append(Paragraph(
    "<b>Authority:</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))
content.append(Paragraph(
    "This procedure is authorized under IRC §6001 (Records), Treasury Regulation §1.6001-1 (Records and "
    "their retention), and Circular 230 (Standards for tax practitioners).",
    body_style
))

# ===== SECTION 2: CORE PRINCIPLES =====
content.append(Spacer(1, 16))
content.append(Paragraph("2. CORE AUDIT DEFENSE PRINCIPLES", header_style))
content.append(Spacer(1, 8))

principles_data = [
    [Paragraph("<b>Principle</b>", styles["Normal"]), Paragraph("<b>Description</b>", styles["Normal"])],
    [
        Paragraph("Centralized<br/>Communication", body_style),
        Paragraph(
            "All IRS communication is handled exclusively by the Audit Defense Team (Admin + CTO). "
            "No direct staff-to-IRS contact is permitted.",
            body_style
        )
    ],
    [
        Paragraph("Written<br/>Responses Only", body_style),
        Paragraph(
            "All IRS responses are provided in writing with documented delivery. Verbal responses are prohibited "
            "unless explicitly authorized by legal counsel.",
            body_style
        )
    ],
    [
        Paragraph("No Admissions<br/>of Liability", body_style),
        Paragraph(
            "Staff are trained to never admit fault, speculate about corrections, or volunteer additional "
            "information beyond what is directly requested.",
            body_style
        )
    ],
    [
        Paragraph("Consistent<br/>Position", body_style),
        Paragraph(
            "All positions taken with the IRS must be consistent with tax return positions, prior responses, "
            "and contemporaneous documentation.",
            body_style
        )
    ],
    [
        Paragraph("Documentation<br/>Trail", body_style),
        Paragraph(
            "Every notice, response, communication, and decision is logged with timestamp, parties involved, "
            "and supporting documentation.",
            body_style
        )
    ],
    [
        Paragraph("24-72 Hour<br/>Buffer", body_style),
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
        Paragraph("INFORMATION<br/>REQUEST", body_style),
        Paragraph("CP2000, 2000C<br/>Math verification<br/>Routine inquiry", body_style),
        Paragraph("30 days from<br/>notice date", body_style),
        Paragraph("Manager review<br/>if > $5K change", body_style)
    ],
    [
        Paragraph("AUDIT NOTICE<br/>(Low Risk)", body_style),
        Paragraph("Correspondence<br/>audit<br/>Form inquiry", body_style),
        Paragraph("30 days from<br/>notice date", body_style),
        Paragraph("CTO + Legal<br/>if > $10K", body_style)
    ],
    [
        Paragraph("AUDIT NOTICE<br/>(High Risk)", body_style),
        Paragraph("Office audit<br/>Fieldwork notice<br/>Criminal referral", body_style),
        Paragraph("15 days from<br/>notice date", body_style),
        Paragraph("IMMEDIATE:<br/>Legal counsel", body_style)
    ],
    [
        Paragraph("PENALTY NOTICE", body_style),
        Paragraph("Accuracy-related<br/>Negligence<br/>Fraud penalty", body_style),
        Paragraph("30 days or<br/>as specified", body_style),
        Paragraph("IMMEDIATE:<br/>Legal counsel", body_style)
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
    "<b>Step 1: Receipt &amp; Initial Review (Same Day)</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))
content.append(Paragraph(
    "<bullet>•</bullet> Any staff member receiving an IRS notice must immediately notify the Admin (do not open envelope)<br/>"
    "<bullet>•</bullet> Notice is logged in centralized Notice Tracking Spreadsheet with timestamp, notice code, taxpayer, and initial observation<br/>"
    "<bullet>•</bullet> Notice is scanned and securely stored in shared drive: /Compliance/IRS_Notices/{Year}/",
    ParagraphStyle("BulletStyle", parent=styles["Normal"], fontSize=9, leading=12)
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Step 2: Classification (Within 2 Hours)</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))
content.append(Paragraph(
    "<bullet>•</bullet> Admin immediately classifies notice using Notice Classification Matrix (Section 3)<br/>"
    "<bullet>•</bullet> Response deadline is calculated and entered into Notice Log<br/>"
    "<bullet>•</bullet> If HIGH RISK or PENALTY NOTICE: CTO and legal counsel are notified within 2 hours<br/>"
    "<bullet>•</bullet> Client is notified of notice receipt and planned response timeline",
    ParagraphStyle("BulletStyle", parent=styles["Normal"], fontSize=9, leading=12)
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Step 3: Evidence Gathering (Within 24 Hours)</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))
content.append(Paragraph(
    "<bullet>•</bullet> Audit Defense Team retrieves engagement letter, tax return, workpapers, and supporting documents<br/>"
    "<bullet>•</bullet> Review for completeness, accuracy, and any discrepancies with IRS question<br/>"
    "<bullet>•</bullet> Identify any missing documentation and request from client (if needed)<br/>"
    "<bullet>•</bullet> All evidence is organized and indexed in Notice folder",
    ParagraphStyle("BulletStyle", parent=styles["Normal"], fontSize=9, leading=12)
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Step 4: Response Preparation (Within 48-72 Hours)</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))
content.append(Paragraph(
    "<bullet>•</bullet> CTO prepares draft response using approved templates and communication scripts<br/>"
    "<bullet>•</bullet> Response is reviewed for accuracy, tone, and consistency with prior positions<br/>"
    "<bullet>•</bullet> Client is consulted on any changes to prior positions or admissions of error<br/>"
    "<bullet>•</bullet> Legal counsel reviews if penalties, criminal language, or fraud allegations present<br/>"
    "<bullet>•</bullet> Final response is approved by Admin/CTO before mailing",
    ParagraphStyle("BulletStyle", parent=styles["Normal"], fontSize=9, leading=12)
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Step 5: Response Transmission &amp; Documentation (Before Deadline)</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))
content.append(Paragraph(
    "<bullet>•</bullet> Response is mailed via Certified Mail (Return Receipt Requested) or electronic filing per notice requirements<br/>"
    "<bullet>•</bullet> Receipt confirmation and tracking number are logged in Notice Tracking system<br/>"
    "<bullet>•</bullet> Client is provided copy of response with explanation of position taken<br/>"
    "<bullet>•</bullet> Response and proof of transmission are filed in Notice folder and backed up to database",
    ParagraphStyle("BulletStyle", parent=styles["Normal"], fontSize=9, leading=12)
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
        Paragraph("Must immediately escalate any IRS communication to Admin. Prohibited from direct IRS contact.", body_style)
    ],
    [
        Paragraph("Staff", body_style),
        Paragraph("LIMITED", body_style),
        Paragraph("May receive/acknowledge receipt of notices. Must immediately log and escalate to Audit Defense Team. Prohibited from responding.", body_style)
    ],
    [
        Paragraph("Manager", body_style),
        Paragraph("MEDIUM", body_style),
        Paragraph("May collect and organize evidence, draft initial analysis, prepare response draft under CTO supervision. Cannot send final response.", body_style)
    ],
    [
        Paragraph("Admin", body_style),
        Paragraph("HIGH", body_style),
        Paragraph("May classify notices, coordinate response team, send responses (non-penalty), approve escalations, interface with clients and IRS.", body_style)
    ],
    [
        Paragraph("CTO", body_style),
        Paragraph("FULL", body_style),
        Paragraph("May manage all aspects: receive, classify, respond, escalate, interface with legal counsel, make final decisions on positions and strategies.", body_style)
    ],
    [
        Paragraph("Legal Counsel<br/>(External)", body_style),
        Paragraph("ADVISORY", body_style),
        Paragraph("Consults on penalty notices, criminal referrals, fraud allegations. Reviews responses for legal sufficiency. Makes final determination on legal strategy.", body_style)
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
    "<b>Retention Policy Summary:</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))

content.append(Paragraph(
    "All tax records, workpapers, engagement letters, correspondence, DocuSign audit trails, payment records, "
    "and IRS acknowledgments must be retained for a minimum of <b>seven (7) years</b> from the later of: (a) tax return "
    "filing date, or (b) client engagement termination. This exceeds IRS requirements to support potential amendments, "
    "extensions, and audit defense.",
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
    [
        Paragraph("Client Documentation", body_style),
        Paragraph("7 years", body_style),
        Paragraph("Secure server + document vault", body_style)
    ],
    [
        Paragraph("Payment &amp; Refund Records", body_style),
        Paragraph("7 years", body_style),
        Paragraph("Accounting system + bank records", body_style)
    ],
    [
        Paragraph("Audit &amp; Compliance Logs", body_style),
        Paragraph("7 years</b> minimum", body_style),
        Paragraph("Immutable audit database", body_style)
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

# ===== SECTION 7: IRS COMMUNICATION SCRIPTS =====
content.append(Paragraph("7. APPROVED IRS COMMUNICATION SCRIPTS", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "The following scripts are approved for staff use when responding to IRS inquiries or requests. All responses "
    "must be cleared by CTO before transmission.",
    body_style
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Script #1: Notice Receipt Acknowledgment (if verbal contact)</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))
content.append(Paragraph(
    "<i>\"Thank you for contacting Ross Tax Prep &amp; Bookkeeping LLC. We are the tax representative for [CLIENT NAME]. "
    "All IRS correspondence and inquiries are handled by our compliance team. Please submit your request in writing to our office address, "
    "and we will respond promptly. You may also direct correspondence to [CTO NAME] at [EMAIL].\"</i>",
    ParagraphStyle("ItalicStyle", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=9, leading=12)
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Script #2: Standard Response Cover Letter (First Sentence)</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))
content.append(Paragraph(
    "<i>\"On behalf of [CLIENT NAME], we hereby respond to your [NOTICE CODE / INQUIRY DATE] as follows: [INSERT RESPONSE / ATTACHMENTS].\"</i>",
    ParagraphStyle("ItalicStyle", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=9, leading=12)
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>PROHIBITED PHRASES:</b>",
    warning_style
))
content.append(Paragraph(
    "<bullet>•</bullet> \"We made a mistake...\" (admission of error)<br/>"
    "<bullet>•</bullet> \"The client didn't provide...\" (shifting blame)<br/>"
    "<bullet>•</bullet> \"We weren't aware of...\" (lack of diligence)<br/>"
    "<bullet>•</bullet> \"We assumed...\" (speculation)<br/>"
    "<bullet>•</bullet> \"The instructions were unclear...\" (excuse)<br/>"
    "<bullet>•</bullet> Any verbal responses or admissions to IRS agents",
    ParagraphStyle("BulletStyle", parent=styles["Normal"], fontSize=9, leading=12, textColor=ACCENT_RED)
))

content.append(PageBreak())

# ===== SECTION 8: AUDIT RESPONSE PROCEDURES =====
content.append(Paragraph("8. AUDIT RESPONSE PROCEDURES", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "<b>Correspondence Audit (Low Risk)</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))

audit_steps = [
    "1. Obtain copy of inquiry and review taxpayer position on return",
    "2. Gather supporting documentation (receipts, statements, contemporaneous notes)",
    "3. Prepare response letter with clear explanation and supporting schedules",
    "4. Sign response by CTO (not taxpayer directly) unless IRS specifies taxpayer signature",
    "5. Send via Certified Mail with Return Receipt",
    "6. File response and receipt in Notice folder with due date reminder (30 days from IRS response)",
]

for step in audit_steps:
    content.append(Paragraph(step, body_style))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Office Audit or Fieldwork (High Risk - ESCALATE IMMEDIATELY)</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))

audit_steps_high = [
    "1. Receive fieldwork notice or audit appointment letter",
    "2. IMMEDIATELY notify CTO and external legal counsel",
    "3. Do NOT schedule appointment without legal counsel review",
    "4. Prepare audit response memorandum with all supporting documentation organized by item",
    "5. Attorney reviews and determines if representation is recommended",
    "6. If representation offered: Attorney attends IRS meeting or coordinates field examination",
    "7. Do NOT allow IRS agents direct access to workpapers without attorney present",
    "8. Document all IRS requests and responses in writing",
    "9. Request summary of examination findings in writing before closing",
]

for step in audit_steps_high:
    content.append(Paragraph(step, body_style))

content.append(PageBreak())

# ===== SECTION 9: ESCALATION THRESHOLDS =====
content.append(Paragraph("9. ESCALATION THRESHOLDS &amp; TRIGGERS", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "The following situations require IMMEDIATE escalation to legal counsel and management:",
    body_style
))

content.append(Spacer(1, 12))

escalation_data = [
    [
        Paragraph("<b>Trigger</b>", styles["Normal"]),
        Paragraph("<b>Action</b>", styles["Normal"]),
        Paragraph("<b>Timeline</b>", styles["Normal"])
    ],
    [
        Paragraph("Penalty asserted<br/>&gt; $10,000", body_style),
        Paragraph("Notify legal counsel. Prepare penalty defense memo. Determine if abatement reasonable-cause argument available.", body_style),
        Paragraph("Within<br/>2 hours", body_style)
    ],
    [
        Paragraph("Criminal referral<br/>language", body_style),
        Paragraph("STOP all communications. Retain criminal tax attorney immediately. Prepare no response until legal review.", body_style),
        Paragraph("IMMEDIATE<br/>(same day)", body_style)
    ],
    [
        Paragraph("Fraud allegation", body_style),
        Paragraph("Treat as criminal matter. Engage specialized tax attorney. Do not admit liability. Prepare defensive position only.", body_style),
        Paragraph("IMMEDIATE", body_style)
    ],
    [
        Paragraph("Audit of prior<br/>years", body_style),
        Paragraph("Assess cumulative exposure. Coordinate response across multiple years. Consider amended returns if beneficial.", body_style),
        Paragraph("Within<br/>24 hours", body_style)
    ],
    [
        Paragraph("Client threatens<br/>lawsuit", body_style),
        Paragraph("Document all communications. Notify malpractice insurance. Engage defense counsel. Limit firm communications.", body_style),
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

# ===== SECTION 10: STAFF TRAINING =====
content.append(Paragraph("10. STAFF TRAINING &amp; COMPLIANCE", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "<b>Required Training:</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))

content.append(Paragraph(
    "<bullet>•</bullet> All staff must complete IRS Audit Defense Training before handling any client files<br/>"
    "<bullet>•</bullet> Training covers: Notice classification, escalation procedures, approved scripts, evidence retention, confidentiality<br/>"
    "<bullet>•</bullet> Annual refresher training required for all staff (compliance review)<br/>"
    "<bullet>•</bullet> New staff must pass quiz (80% minimum) before unsupervised client access",
    ParagraphStyle("BulletStyle", parent=styles["Normal"], fontSize=9, leading=12)
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Monitoring &amp; Compliance:</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))

content.append(Paragraph(
    "<bullet>•</bullet> All IRS communications logged in centralized tracking system<br/>"
    "<bullet>•</bullet> Monthly audit of Notice Log to verify proper classification, timely response, and documentation<br/>"
    "<bullet>•</bullet> Quarterly compliance review with all staff (verbal & written confirmations)<br/>"
    "<bullet>•</bullet> Any violation of these procedures results in disciplinary action (warning, suspension, termination)",
    ParagraphStyle("BulletStyle", parent=styles["Normal"], fontSize=9, leading=12)
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Confidentiality &amp; Privilege:</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))

content.append(Paragraph(
    "All IRS notices, responses, and audit work are considered attorney work product and confidential client information. "
    "Staff are prohibited from discussing audit matters with anyone except authorized personnel (CTO, Admin, legal counsel). "
    "Violation of confidentiality may result in termination and legal action.",
    body_style
))

content.append(PageBreak())

# ===== SECTION 11: POST-AUDIT REVIEW =====
content.append(Paragraph("11. POST-AUDIT REVIEW &amp; REMEDIATION", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "Upon resolution of any IRS notice, audit, or inquiry, the Audit Defense Team must conduct a comprehensive review "
    "to identify root causes and prevent recurrence.",
    body_style
))

content.append(Spacer(1, 12))
content.append(Paragraph(
    "<b>Post-Audit Review Checklist:</b>",
    ParagraphStyle("BoldText", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10)
))

review_items = [
    "<bullet>□</bullet> Verify IRS determination is fully satisfied (no outstanding balance, penalties, or follow-up)",
    "<bullet>□</bullet> Analyze root cause: Was issue due to (a) return position taken, (b) inadequate documentation, (c) preparer error, (d) client misstatement?",
    "<bullet>□</bullet> Assess exposure: Would this issue affect other prior-year returns?",
    "<bullet>□</bullet> Update procedures: If preparer error or systematic issue, update SOPs and provide retraining",
    "<bullet>□</bullet> Update workpaper: Document conclusion of examination and any changes accepted by IRS",
    "<bullet>□</bullet> Client communication: Explain outcome, lessons learned, and steps taken to prevent recurrence",
    "<bullet>□</bullet> Firm learning: Memorialize finding in quality control database for future reference",
]

for item in review_items:
    content.append(Paragraph(item, ParagraphStyle("BulletStyle", parent=styles["Normal"], fontSize=9, leading=12)))

content.append(PageBreak())

# ===== SECTION 12: EMERGENCY CONTACTS =====
content.append(Paragraph("12. EMERGENCY CONTACT PROTOCOLS", header_style))
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
    [
        Paragraph("4", body_style),
        Paragraph("Malpractice Insurance", body_style),
        Paragraph("Claims Handler", body_style),
        Paragraph("1-800 # (on file)", body_style)
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

# ===== APPENDIX A =====
content.append(Paragraph("APPENDIX A: IRS NOTICE CODE CLASSIFICATION MATRIX", header_style))
content.append(Spacer(1, 8))

content.append(Paragraph(
    "Use this matrix to quickly classify incoming IRS notices and determine response timeline.",
    body_style
))

content.append(Spacer(1, 12))

appendix_a_data = [
    [
        Paragraph("<b>Notice Code</b>", styles["Normal"]),
        Paragraph("<b>Description</b>", styles["Normal"]),
        Paragraph("<b>Risk Level</b>", styles["Normal"]),
        Paragraph("<b>Response<br/>Deadline</b>", styles["Normal"])
    ],
    [Paragraph("CP2000", body_style), Paragraph("Math verification", body_style), Paragraph("LOW", body_style), Paragraph("30 days", body_style)],
    [Paragraph("CP2000C", body_style), Paragraph("Updated math notice", body_style), Paragraph("LOW", body_style), Paragraph("30 days", body_style)],
    [Paragraph("556", body_style), Paragraph("Verification of income", body_style), Paragraph("MEDIUM", body_style), Paragraph("30 days", body_style)],
    [Paragraph("4549", body_style), Paragraph("Income tax exam results", body_style), Paragraph("MEDIUM", body_style), Paragraph("30 days", body_style)],
    [Paragraph("3115", body_style), Paragraph("Change of accounting method", body_style), Paragraph("MEDIUM", body_style), Paragraph("30 days", body_style)],
    [Paragraph("886-A", body_style), Paragraph("Examination report", body_style), Paragraph("HIGH", body_style), Paragraph("15-30 days", body_style)],
    [Paragraph("906", body_style), Paragraph("Closing agreement offer", body_style), Paragraph("HIGH", body_style), Paragraph("Negotiate", body_style)],
    [Paragraph("Letter 916", body_style), Paragraph("Field examination notice", body_style), Paragraph("HIGH", body_style), Paragraph("URGENT", body_style)],
]

appendix_a_table = Table(appendix_a_data, colWidths=[110, 150, 90, 100])
appendix_a_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BRAND_NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
]))

content.append(appendix_a_table)

content.append(PageBreak())

# ===== FOOTER =====
footer_data = [
    [
        Paragraph("<b>Document:</b><br/>IRS Audit Defense Playbook", body_style),
        Paragraph("<b>Effective:</b><br/>" + datetime.now().strftime("%B %d, %Y"), body_style),
        Paragraph("<b>Classification:</b><br/>CONFIDENTIAL", body_style)
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

content.append(Spacer(1, 24))
content.append(footer_table)

# ===== BUILD PDF =====
doc.build(content)

print(f"✅ PDF Generated Successfully!")
print(f"📄 File: {file_path}")
print(f"📊 Size: {os.path.getsize(file_path) / 1024:.1f} KB")
print(f"📋 Document: IRS Audit Defense Playbook - Ross Tax Prep & Bookkeeping LLC")
print(f"🏢 EIN: 33-4891499")
print(f"📅 Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}")
