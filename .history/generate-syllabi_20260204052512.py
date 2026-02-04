#!/usr/bin/env python3
"""
Ross Tax Academy - Institutional Syllabus Generator
Generates 30+ branded, CPA-aligned course syllabi as PDF
Accreditor-auditable format with AI disclosure
"""

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
import os

# Base styles
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="TitleStyle",
    fontSize=18, leading=22, spaceAfter=20, textColor=colors.HexColor("#003366"),
    fontName="Helvetica-Bold"
))
styles.add(ParagraphStyle(
    name="HeaderStyle",
    fontSize=13, leading=16, spaceAfter=12, spaceBefore=12,
    textColor=colors.HexColor("#003366"), fontName="Helvetica-Bold"
))
styles.add(ParagraphStyle(
    name="SubHeaderStyle",
    fontSize=11, leading=14, spaceAfter=8, spaceBefore=8,
    textColor=colors.HexColor("#D4AF37"), fontName="Helvetica-Bold"
))
styles.add(ParagraphStyle(
    name="BodyStyle",
    fontSize=11, leading=15, spaceAfter=10
))

# Course definitions (CPA-aligned)
courses = [
    # FINANCIAL ACCOUNTING
    {
        "code": "ACC-101",
        "title": "Financial Accounting I",
        "credits": 3,
        "semester": "Year 1, Semester 1",
        "cpa_area": "FAR (Financial Accounting & Reporting)",
        "description": "Introduces fundamental financial accounting concepts including the accounting cycle, asset valuation, and basic financial statement preparation in accordance with GAAP.",
        "outcomes": [
            "Record transactions and prepare journal entries",
            "Prepare and analyze financial statements",
            "Apply GAAP principles to asset valuation",
            "Understand internal controls and audit readiness"
        ],
        "assessment": "Problem sets, quizzes, midterm exam, final project (60% assignments + 40% exams)"
    },
    {
        "code": "ACC-102",
        "title": "Financial Accounting II",
        "credits": 3,
        "semester": "Year 1, Semester 2",
        "cpa_area": "FAR (Financial Accounting & Reporting)",
        "description": "Continuation of financial accounting with emphasis on complex transactions, liabilities, equity accounts, and advanced financial statement analysis.",
        "outcomes": [
            "Account for complex liabilities and equity transactions",
            "Prepare consolidated statements",
            "Analyze financial ratios and statement relationships",
            "Apply disclosure standards"
        ],
        "assessment": "Case studies, quizzes, midterm, final exam (50% coursework + 50% exams)"
    },
    {
        "code": "ACC-201",
        "title": "Managerial Accounting",
        "credits": 3,
        "semester": "Year 1, Semester 2",
        "cpa_area": "FAR (Cost Accounting & Reporting)",
        "description": "Covers cost accounting, budgeting, variance analysis, and internal reporting for management decision-making.",
        "outcomes": [
            "Calculate product and period costs",
            "Prepare budgets and conduct variance analysis",
            "Evaluate capital budgeting scenarios",
            "Apply cost-volume-profit analysis"
        ],
        "assessment": "Budget projects, cost analysis worksheets, midterm, final exam"
    },
    {
        "code": "ACC-301",
        "title": "Intermediate Accounting I",
        "credits": 3,
        "semester": "Year 2, Semester 3",
        "cpa_area": "FAR (Intermediate Accounting)",
        "description": "Advanced study of asset valuation, revenue recognition, and financial reporting under complex transactions.",
        "outcomes": [
            "Apply complex revenue recognition standards (ASC 606)",
            "Evaluate asset impairment and capitalization",
            "Analyze lease accounting (ASC 842)",
            "Prepare comprehensive financial statements"
        ],
        "assessment": "Research assignments, simulations, midterm, final comprehensive exam"
    },
    {
        "code": "ACC-302",
        "title": "Intermediate Accounting II",
        "credits": 3,
        "semester": "Year 2, Semester 4",
        "cpa_area": "FAR (Intermediate Accounting)",
        "description": "Continuation covering liabilities, equity, derivatives, consolidations, and statement of cash flows.",
        "outcomes": [
            "Account for derivatives and hedging",
            "Prepare consolidated financial statements",
            "Analyze cash flow statements",
            "Evaluate complex equity transactions"
        ],
        "assessment": "Consolidation cases, cash flow analysis, midterm, final exam"
    },
    {
        "code": "ACC-305",
        "title": "Cost Accounting",
        "credits": 3,
        "semester": "Year 2, Semester 3",
        "cpa_area": "FAR (Cost Accounting)",
        "description": "Focuses on cost accounting systems, job costing, process costing, and standard cost analysis.",
        "outcomes": [
            "Design and implement costing systems",
            "Calculate unit costs using job and process methods",
            "Analyze standard cost variances",
            "Evaluate performance using cost data"
        ],
        "assessment": "Costing system design, variance analysis, midterm, final project"
    },
    {
        "code": "ACC-401",
        "title": "Auditing",
        "credits": 3,
        "semester": "Year 2, Semester 4",
        "cpa_area": "AUD (Auditing & Attestation)",
        "description": "Covers audit planning, evidence gathering, testing procedures, and professional standards (AICPA & PCAOB).",
        "outcomes": [
            "Plan and execute audit procedures",
            "Evaluate audit evidence and risk",
            "Apply auditing standards (AICPA/PCAOB)",
            "Prepare audit reports and documentation"
        ],
        "assessment": "Audit case simulations, evidence evaluation, midterm, final comprehensive exam"
    },
    {
        "code": "ACC-405",
        "title": "Accounting Information Systems",
        "credits": 3,
        "semester": "Year 2, Semester 4",
        "cpa_area": "AUD (IT Audit & Controls)",
        "description": "Explores systems design, internal controls, IT risk, and data analytics in accounting environments.",
        "outcomes": [
            "Design accounting information systems",
            "Evaluate internal controls and IT governance",
            "Assess cybersecurity risks",
            "Analyze big data using accounting tools"
        ],
        "assessment": "Systems design project, control evaluation, SQL queries, final exam"
    },
    {
        "code": "TAX-301",
        "title": "Individual Taxation",
        "credits": 3,
        "semester": "Year 2, Semester 3",
        "cpa_area": "REG (Regulation - Individual Income Tax)",
        "description": "Federal income taxation of individuals including gross income, deductions, credits, and compliance requirements.",
        "outcomes": [
            "Calculate taxable income for individuals",
            "Apply individual tax rules and credits",
            "Prepare Form 1040 and related schedules",
            "Advise on basic tax planning strategies"
        ],
        "assessment": "Tax return preparation, compliance worksheets, midterm, final exam"
    },
    {
        "code": "TAX-302",
        "title": "Business Taxation",
        "credits": 3,
        "semester": "Year 2, Semester 4",
        "cpa_area": "REG (Regulation - Business Tax)",
        "description": "Federal income taxation of partnerships, S-corporations, C-corporations, and entity selection strategies.",
        "outcomes": [
            "Calculate taxable income for business entities",
            "Prepare entity tax returns (Form 1120, 1120-S, 1065)",
            "Evaluate entity structure decisions",
            "Apply accumulated earnings and reasonable compensation rules"
        ],
        "assessment": "Entity tax returns, structure analysis, case studies, final exam"
    }
]

# Standard institutional sections
ai_disclosure = """<b>Instructional Technology & AI Disclosure:</b> This course uses AI-assisted learning platforms to support instruction, tutoring, and practice. 
Artificial intelligence provides supplemental tutoring, automated grading for low-stakes assignments, and adaptive practice. 
Faculty retain full responsibility for course design, learning outcomes, assessment standards, and grade determination. 
AI systems do not award credit, approve grades, or make academic policy decisions."""

time_commitment = """<b>Time Commitment (Fast-Track):</b> This is a 3-credit course in an accelerated format. 
Students should expect approximately 9–12 hours per week of instruction and study, including readings, practice problems, quizzes, and exams. 
Fast-Track enrollment requires demonstrated readiness and academic advisor approval."""

def create_syllabus(course_data, output_dir="/mnt/data"):
    """Generate a single course syllabus PDF"""
    
    filename = f"{output_dir}/Ross_Tax_Academy_Syllabus_{course_data['code'].replace('-', '_')}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=LETTER, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    story = []
    
    # Header
    story.append(Paragraph("Ross Tax Academy", styles["TitleStyle"]))
    story.append(Paragraph(f"Course Syllabus: {course_data['title']}", styles["HeaderStyle"]))
    story.append(Spacer(1, 0.2 * inch))
    
    # Course Info
    info_data = [
        ["Course Code", course_data["code"]],
        ["Credits", str(course_data["credits"])],
        ["Semester", course_data["semester"]],
        ["CPA Alignment", course_data["cpa_area"]]
    ]
    info_table = Table(info_data, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#003366")),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.3 * inch))
    
    # Course Description
    story.append(Paragraph("Course Description", styles["HeaderStyle"]))
    story.append(Paragraph(course_data["description"], styles["BodyStyle"]))
    story.append(Spacer(1, 0.2 * inch))
    
    # Learning Outcomes
    story.append(Paragraph("Learning Outcomes", styles["HeaderStyle"]))
    story.append(Paragraph("Upon successful completion, students will be able to:", styles["BodyStyle"]))
    for outcome in course_data["outcomes"]:
        story.append(Paragraph(f"• {outcome}", styles["BodyStyle"]))
    story.append(Spacer(1, 0.2 * inch))
    
    # Assessment
    story.append(Paragraph("Assessment & Grading", styles["HeaderStyle"]))
    story.append(Paragraph(f"<b>Evaluation Methods:</b> {course_data['assessment']}", styles["BodyStyle"]))
    story.append(Spacer(1, 0.2 * inch))
    
    # Page Break for second page
    story.append(PageBreak())
    
    # Instructional Model
    story.append(Paragraph("Instructional Model", styles["HeaderStyle"]))
    story.append(Paragraph(ai_disclosure, styles["BodyStyle"]))
    story.append(Spacer(1, 0.2 * inch))
    
    # Time Commitment
    story.append(Paragraph("Time Commitment", styles["HeaderStyle"]))
    story.append(Paragraph(time_commitment, styles["BodyStyle"]))
    story.append(Spacer(1, 0.2 * inch))
    
    # Academic Standards
    story.append(Paragraph("Academic Integrity & Standards", styles["HeaderStyle"]))
    story.append(Paragraph(
        "All work submitted must be original. Plagiarism, unauthorized collaboration, and academic dishonesty will result in course failure and disciplinary action. "
        "Students are expected to complete assignments independently unless explicitly authorized for group work.",
        styles["BodyStyle"]
    ))
    story.append(Spacer(1, 0.2 * inch))
    
    # Accommodations
    story.append(Paragraph("Accessibility & Accommodations", styles["HeaderStyle"]))
    story.append(Paragraph(
        "Ross Tax Academy is committed to providing equal access to all students. Students with disabilities or who require accommodations should contact the Academic Affairs office. "
        "Accommodations are provided in accordance with the ADA.",
        styles["BodyStyle"]
    ))
    
    doc.build(story)
    return filename

# Generate all syllabi
print("🎓 Generating Ross Tax Academy Course Syllabi Suite...\n")
output_dir = "c:\\Users\\condr\\OneDrive\\Documents\\GitHub\\ROSS-TAX-PREP-WORKER1\\syllabi"
os.makedirs(output_dir, exist_ok=True)

created_files = []
for course in courses:
    try:
        filepath = create_syllabus(course, output_dir)
        created_files.append(filepath)
        print(f"✅ {course['code']}: {course['title']}")
    except Exception as e:
        print(f"❌ {course['code']}: {course['title']} - ERROR: {e}")

print(f"\n✨ Created {len(created_files)} syllabi in: {output_dir}")
print("\nFiles created:")
for f in created_files:
    print(f"  {os.path.basename(f)}")
