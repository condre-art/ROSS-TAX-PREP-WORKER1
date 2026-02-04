# Education Institution Compliance & Record Keeping

## Overview

This document outlines the education institution compliance framework for Ross Tax Academy, including federal regulations (FERPA, GDPR), state requirements, and industry best practices for academic record management.

## Federal Regulatory Framework

### FERPA (Family Educational Rights and Privacy Act) - 20 U.S.C. § 1232g

**Applicability:** All educational institutions receiving federal funding

**Key Requirements:**

1. **Student Access Rights**
   - Students have right to inspect their educational records
   - Access must be provided within 45 calendar days of request
   - Include opportunity to request amendment of records
   - Institution must maintain record of disclosures

2. **Parental Access Rights**
   - Parents of dependent students have access rights
   - Dependent status determined by IRS tax deduction rules
   - Non-dependent students (age 18+) have exclusive rights

3. **Confidentiality Requirements**
   - No disclosure of PII without written consent
   - Exceptions: School officials, directory information, subpoena, safety emergencies
   - "School official" defined as having legitimate educational interest
   - Directory information (name, address, phone, email) can be shared if student opts out

4. **Directory Information**
   - Must provide students opportunity to opt out
   - Ross Tax Academy discloses:
     - Name
     - Email address
     - Enrollment status
     - Certificate completion status
   - Does NOT disclose:
     - Grades
     - Attendance records
     - GPA
     - Transcript details

5. **Record Retention Requirements**
   - Enrollment records: Maintain indefinitely
   - Academic progress: 7 years minimum
   - Attendance records: 3 years minimum
   - Grade records: Permanently
   - Communications: 2 years minimum
   - Compliance audits: 7 years

6. **Enforcement**
   - U.S. Department of Education, Office of Inspector General
   - Violations can result in loss of federal funding
   - Student can file complaint with FERPA office
   - Penalties up to $40,000 per violation

### State Regulations (Texas)

**Texas Education Code § 21.028** - School Records Access
- Students (age 18+) have rights to their records
- Records must be maintained in secure location
- Personally identifiable information protected

**Texas Administrative Code § 25.1** - Confidentiality of Student Records
- Schools must implement security measures
- PII restricted to authorized users
- Documentation of access required

## Data Protection & Privacy

### PII (Personally Identifiable Information) Definition

At Ross Tax Academy, PII includes:
- Full name
- Email address
- Phone number
- Social Security number (optional for some programs)
- Date of birth
- Address
- Banking information (payment details)
- Student ID number

### Encryption & Security

All PII encrypted using AES-256 before storage:

```typescript
// Encryption utility (src/utils/encryption.ts)
import { encryptPII, decryptPII } from './encryption';

// Before storage
const encrypted = encryptPII({
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@example.com'
});

// On retrieval
const decrypted = decryptPII(encrypted);
```

**Encryption Details:**
- Algorithm: AES-256 (Advanced Encryption Standard, 256-bit key)
- Mode: CBC (Cipher Block Chaining)
- IV: Randomly generated per record
- Key: Stored in Cloudflare Secrets (not in code)
- Key Rotation: Quarterly

### Access Control

**Role-Based Access Control (RBAC)**

Five roles with specific data access:

1. **Admin**
   - Full access to all records
   - Can view all student/teacher PII
   - Can generate reports
   - Can modify access controls

2. **Manager**
   - View student enrollments and progress
   - Cannot view financial information
   - Can request compliance reports
   - Limited grade modification

3. **Teacher**
   - View only their enrolled students
   - Can input grades and attendance
   - Cannot view student contact info
   - Can generate class reports

4. **Student**
   - View only their own records
   - Can download transcripts
   - Can view grades and attendance
   - Cannot view other students' data

5. **Guest**
   - No access to student records
   - Public information only (course descriptions, etc.)

**Implementation:**

```typescript
// In route handlers
router.get('/api/records/:studentId', verifyAuth(['admin', 'manager']), async (req) => {
  // Only return decrypted data if authenticated
  const record = await db.prepare('...').bind(studentId).first();
  if (!record) return new Response('Not found', { status: 404 });
  
  const decrypted = decryptPII(record.pii_encrypted);
  return new Response(JSON.stringify(decrypted));
});
```

## Audit Logging & Compliance

### Audit Log System

**Table: `audit_logs`**

Every action logged with:
- Action type (e.g., 'enrollment_created', 'grade_posted', 'record_accessed')
- Resource type and ID
- User ID (who performed action)
- IP address
- Timestamp
- Details (what changed)
- Status (success/failure)

**Audit Log Retention:** 7 years (FERPA requirement)

**Logged Actions:**
1. Enrollment actions
   - `enrollment_created`
   - `enrollment_dropped`
   - `enrollment_refunded`

2. Grade actions
   - `grade_posted`
   - `grade_updated`
   - `grade_deleted`

3. Attendance actions
   - `attendance_recorded`
   - `attendance_updated`
   - `attendance_warning_sent`

4. Record access
   - `record_accessed` (by whom, when)
   - `transcript_requested`
   - `transcript_generated`

5. Admin actions
   - `student_deactivated`
   - `email_deactivated`
   - `access_rights_modified`

**Audit Log Example:**

```json
{
  "id": "audit-001",
  "action": "grade_posted",
  "resource_type": "grade",
  "resource_id": "grd-001",
  "user_id": "teacher-001",
  "ip_address": "203.0.113.45",
  "details": {
    "enrollmentId": "student-001",
    "assignmentId": "asgn-001",
    "score": 92,
    "letterGrade": "A"
  },
  "status": "success",
  "timestamp": "2025-02-03T14:30:00Z"
}
```

### Compliance Reports

**Database Views** for compliance auditing:

```sql
-- 7-year retention check
SELECT COUNT(*) as records_expiring_soon
FROM audit_logs
WHERE timestamp < DATE('now', '-7 years');

-- Access pattern analysis
SELECT action, COUNT(*) as count
FROM audit_logs
WHERE timestamp > DATE('now', '-30 days')
GROUP BY action
ORDER BY count DESC;

-- Unauthorized access attempts
SELECT user_id, COUNT(*) as failed_attempts
FROM audit_logs
WHERE status = 'unauthorized'
GROUP BY user_id;
```

## Record Categories & Retention

### Academic Records (Permanent)

**Content:**
- Enrollment information
- Completed assignments
- Grade records
- Transcripts
- Course completion certificates

**Retention:** Permanently
**Access:** Student, Admin, (Registrar upon request)
**Encryption:** Yes, via `encryptPII()`

### Attendance Records (3+ years)

**Content:**
- Session attendance
- Check-in/check-out times
- Absences and late arrivals
- Attendance warnings

**Retention:** 3 years minimum (stored in `attendance_records` table)
**Access:** Teacher (own class), Admin, Student (own records)
**Encryption:** No (non-sensitive)
**Purge Schedule:** Automatic deletion after 3 years

### Grade Records (7+ years)

**Content:**
- Assignment scores
- Grading comments
- Grade adjustments
- Weighted calculations

**Retention:** 7 years minimum (FERPA requirement)
**Access:** Student (own), Teacher (own class), Admin
**Encryption:** Yes (via enrollment_id linkage)
**Archive Schedule:** Moved to archive table after 7 years, retained for compliance

### Assessment Records (7+ years)

**Content:**
- Quiz results
- Exam scores
- Learning outcomes assessment
- Proctoring records

**Retention:** 7 years (institutional best practice)
**Access:** Admin only (compliance audits)
**Encryption:** Yes
**Destruction:** Secure deletion after 7 years + 1 year buffer

### Communication Records (2+ years)

**Content:**
- Enrollment inquiry emails
- Grade notification emails
- Attendance warning emails
- Support tickets

**Retention:** 2 years minimum
**Access:** Admin, Support team
**Encryption:** Content encrypted if contains PII
**Purge Schedule:** Automated deletion after 2 years

### Financial Records (7 years)

**Content:**
- Payment records
- Invoice/receipt details
- Refund transactions
- Payment plan agreements

**Retention:** 7 years (IRS requirement)
**Access:** Admin, Accounting team only
**Encryption:** Yes (contains payment info)
**Compliance:** Separate from academic records

## Record Deletion & Retention Enforcement

### Automatic Purge System

Scheduled job runs daily at 2 AM:

```typescript
// In src/index.ts scheduled handler
export default {
  async scheduled(event, env) {
    // Purge audit logs older than 7 years
    await env.DB.prepare(
      `DELETE FROM audit_logs 
       WHERE timestamp < DATE('now', '-7 years')`
    ).run();

    // Purge attendance records older than 3 years
    await env.DB.prepare(
      `DELETE FROM attendance_records 
       WHERE recorded_at < DATE('now', '-3 years')`
    ).run();

    // Archive old email records
    await env.DB.prepare(
      `INSERT INTO email_archive 
       SELECT * FROM email_communications 
       WHERE created_at < DATE('now', '-2 years')`
    ).run();

    // Log purge action
    await logAudit(env, {
      action: 'scheduled_purge_complete',
      details: { purgedRecords: count }
    });
  }
};
```

### Student Data Deletion (Right to Erasure)

Upon student request, can delete non-essential records while maintaining compliance:

```typescript
// NOT deleted (retained for 7 years):
- Academic records
- Grade records
- Transcripts
- Attendance (aggregated)
- Enrollment info
- Financial records

// CAN be deleted:
- Communication logs (after retention)
- Optional survey data
- Archived lesson materials
```

## Discrepancy Resolution & Amendment

### Student Right to Amend

Process for students to challenge inaccurate records:

```
1. Student submits written request with explanation
2. School verifies record accuracy (within 30 days)
3. Options:
   a. Agree: Amend record, notify interested parties
   b. Disagree: Provide response, student can add statement
4. Document entire process in audit log
5. Notify parties previously provided access
```

**Grounds for Amendment:**
- Clerical errors (name misspelling, wrong date)
- Grade calculation errors
- Duplicate records
- Unauthorized entries

**Cannot amend:**
- Subjective grades (appeal through grade appeal process)
- Legitimate teacher judgments
- Attendance (only add explanation)

## Subpoena & Legal Disclosure

### Subpoena Response Protocol

If served with subpoena for student records:

1. **Verify legitimacy:** Confirm with legal counsel
2. **Notify student:** Inform within 3 days (unless restricted by court order)
3. **Maintain confidentiality:** Only disclose what's specifically requested
4. **Document disclosure:** Log every page provided
5. **Retain copy:** Keep record of what was released

**Without court order:** Refuse disclosure (except parents of dependents, emergencies)

**With court order:** Comply and document fully

## Marketing & Disclosure Restrictions

### Prohibited Claims

❌ **Cannot claim:**
- "Accredited institution" (unless actually accredited)
- "Students eligible for FAFSA/federal aid"
- "Degree-granting authority" (unless licensed)
- "Guaranteed job placement"
- "Quick path to certification" (without qualifications)

### Compliant Language

✅ **Can claim:**
- "Texas Workforce Commission authorized" (for tax/bookkeeping)
- "Recognized by professional associations"
- "Partnerships with accredited institutions for credit transfer"
- "Instructor-led, professional-level instruction"
- "IRS-approved curriculum"

### Pre-Enrollment Disclosure

**Required before enrollment:**
- Fact that institution is not accredited
- All fees and costs
- Refund policy
- Length and credit hours
- Does not qualify for federal financial aid
- Alternative financing options

**Location:** [frontend/public/forms/enrollment.html](frontend/public/forms/enrollment.html)

## Compliance Checklist

### Annual Audit Checklist

**Q1 (January-March):**
- [ ] Verify FERPA disclosures posted
- [ ] Audit RBAC access logs (unauthorized access?)
- [ ] Check encryption key rotation (quarterly)
- [ ] Verify 7-year retention schedule active
- [ ] Review student amendment requests

**Q2 (April-June):**
- [ ] Test automatic purge system (backup first)
- [ ] Audit teacher access to student records
- [ ] Verify PII encryption implementation
- [ ] Review financial record compliance (IRS)
- [ ] Test disaster recovery procedures

**Q3 (July-September):**
- [ ] Audit admin access logs
- [ ] Verify email retention policies
- [ ] Check compliance documentation
- [ ] Review marketing claims compliance
- [ ] Test data export/import procedures

**Q4 (October-December):**
- [ ] Full FERPA compliance audit
- [ ] Year-end data retention report
- [ ] Review all audit logs for anomalies
- [ ] Verify encryption keys not exposed
- [ ] Prepare annual compliance report

### Monthly Tasks

- [ ] Review audit logs for unauthorized access
- [ ] Verify scheduled purge jobs ran successfully
- [ ] Check MailChannels email delivery rates
- [ ] Monitor database backups
- [ ] Review student data access requests

## Incident Response Plan

### Data Breach Response (72-hour requirement)

**Within 1 hour:**
1. Isolate affected systems
2. Disable compromised credentials
3. Contact IT security team
4. Preserve evidence

**Within 24 hours:**
1. Determine scope of breach
2. Identify affected students
3. Assess data sensitivity
4. Begin notification letters

**Within 72 hours:**
1. Notify affected students
2. Offer identity monitoring (if SSN breached)
3. Notify U.S. Department of Education
4. Begin regulatory investigation

**Documentation:**
- Store incident report in audit system
- Include: Date, time, systems affected, response actions, timeline
- Review process with legal counsel

## See Also

- [src/utils/encryption.ts](src/utils/encryption.ts) - PII encryption/decryption
- [src/utils/audit.ts](src/utils/audit.ts) - Audit logging system
- [schema/compliance-schema.sql](schema/compliance-schema.sql) - Database tables
- [FAFSA-TITLE5-COMPLIANCE.md](FAFSA-TITLE5-COMPLIANCE.md) - Financial aid compliance
- [STUDENT-EMAIL-INFRASTRUCTURE.md](STUDENT-EMAIL-INFRASTRUCTURE.md) - Email system
- [INSTRUCTOR-PORTAL-COMPLETE.md](INSTRUCTOR-PORTAL-COMPLETE.md) - Academic records

## References

- 20 U.S.C. § 1232g - FERPA statute
- 34 CFR Part 99 - FERPA regulations
- Texas Education Code § 21.028
- Texas Administrative Code § 25.1
- IRS Publication 17 (Student record retention)
- GDPR Article 5 (Data protection principles)

---

**Last Updated:** February 3, 2025  
**Next Review:** May 3, 2025 (Quarterly)  
**Compliance Officer:** [To be assigned]  
**Legal Review:** [To be scheduled]
