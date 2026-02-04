# Student Email Infrastructure & Population System

## Overview

The Student Email Infrastructure provides **@rosstaxprepandbookkeeping.com** domain email addresses for all users (students, teachers, admins) upon enrollment or onboarding. This system ensures professional identity, enables secure communications, and supports compliance record-keeping.

## System Architecture

### Email Address Formats

```
Students:    firstname.lastname@rosstaxprepandbookkeeping.com
Teachers:    prof.firstname.lastname@rosstaxprepandbookkeeping.com
Admins:      admin.firstname.lastname@rosstaxprepandbookkeeping.com
```

On naming conflicts, system increments: `firstname.lastname1@`, `firstname.lastname2@`, etc.

## Database Schema

### `student_email_mappings` Table

Stores student email assignments with audit trail:

```sql
CREATE TABLE student_email_mappings (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  student_email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' ('active' | 'deactivated'),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deactivated_at DATETIME
);
```

**Key Features:**
- Unique constraint on `student_email` prevents duplicates
- Status tracking for account lifecycle
- Timestamp for compliance (email created date)
- Soft-delete via deactivation (FERPA compliance)

### `role_emails` Table

Stores teacher and admin email assignments:

```sql
CREATE TABLE role_emails (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL ('student' | 'teacher' | 'admin'),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);
```

**Key Features:**
- Composite unique key prevents multiple emails per user per role
- Role-based prefix generation (prof., admin.)
- Department tracking for organizational structure
- Creation timestamp for audit trails

### `email_generation_audit` Table

Complete audit log of all email generation events:

```sql
CREATE TABLE email_generation_audit (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  email TEXT NOT NULL,
  action TEXT NOT NULL,
  status_code TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Actions Tracked:**
- `email_generated` - Initial email creation
- `email_deactivated` - Account closure
- `conflict_resolved` - Duplicate name handling
- `error_*` - Failed generation attempts

## Email Generation Functions

### `generateStudentEmail(db, studentId, firstName, lastName)`

Generates unique student email address.

**Process:**
1. Sanitize name (lowercase, remove special chars, max length)
2. Check if student already has email (skip if exists)
3. Generate base format: `firstname.lastname@rosstaxprepandbookkeeping.com`
4. Check uniqueness in database
5. If conflict, increment counter: `firstname.lastname1@`, `firstname.lastname2@`, etc.
6. Insert mapping record with audit log
7. Return email and status

**Error Handling:**
- Throws if names invalid/empty
- Throws after 999 attempts (prevents infinite loops)
- Returns `status: 'existing'` if already assigned

**Example:**
```typescript
const result = await generateStudentEmail(
  db,
  'student-001',
  'John',
  'Smith'
);
// Returns: {
//   email: 'john.smith@rosstaxprepandbookkeeping.com',
//   status: 'created'
// }
```

### `generateTeacherEmail(db, teacherId, firstName, lastName, department)`

Generates teacher email with `prof.` prefix.

**Features:**
- Same conflict resolution logic as students
- Includes department field for organization
- Logs teacher role assignment

### `generateAdminEmail(db, adminId, firstName, lastName, department)`

Generates admin email with `admin.` prefix.

**Features:**
- Same conflict resolution as other roles
- Tracks admin department assignment
- Can be called multiple times (returns existing if present)

### `getUserEmail(db, userId, role)` → string | null

Retrieves existing email for user and role.

**Usage:**
```typescript
const studentEmail = await getUserEmail(db, 'student-001', 'student');
const teacherEmail = await getUserEmail(db, 'teacher-001', 'teacher');
```

### `deactivateStudentEmail(db, studentId)`

Soft-delete email on account closure (FERPA compliance).

**Process:**
1. Update status to 'deactivated'
2. Set deactivated_at timestamp
3. Log audit event
4. Does NOT delete record (audit trail preserved)

## Role-Based Email Communication

### Email Template System

Three role-specific email templates configured in [src/utils/role-emails.ts](src/utils/role-emails.ts):

#### Student Email Templates

1. **Account Created** - Welcome email with login credentials
   - Temporary password
   - Portal access link
   - First-time setup instructions

2. **Course Enrolled** - Enrollment confirmation
   - Course name and ID
   - Access link
   - What's next checklist

3. **Grade Posted** - Grade notification
   - Assignment name and grade
   - Feedback from instructor
   - Link to gradebook

4. **Attendance Reminder** - Upcoming class session
   - Course name and time
   - Reminder to join early
   - Join link

5. **Certificate Issued** - Completion certificate
   - Certificate code (RTA-YYYY-XXXXXX)
   - Download link
   - Verification info for employers

#### Teacher Email Templates

1. **Account Created** - Instructor access setup
   - Instructor email
   - Temporary password
   - Portal features listed

2. **Students Enrolled** - Enrollment notification
   - Number of new students
   - Link to student roster
   - Upcoming tasks

3. **Grade Deadline Reminder** - Grade submission due
   - Course name
   - Due date
   - Link to gradebook

4. **Lesson Plan Request** - Weekly lesson plan due
   - Course name
   - Due date
   - Required components

#### Admin Email Templates

1. **Daily Enrollment Summary** - Dashboard email
   - New enrollments count
   - Total revenue for day
   - Dashboard link

2. **System Alert** - Critical alerts
   - Alert title and severity
   - Message
   - Action required

### MailChannels Integration

All emails sent via MailChannels API (no SMTP required):

```typescript
import { sendStudentEmail, sendTeacherEmail, sendAdminEmail } from './src/utils/role-emails';

// Send student email
await sendStudentEmail(
  mailChannelsKey,
  'john.smith@rosstaxprepandbookkeeping.com',
  'accountCreated',
  { studentName: 'John Smith', studentEmail: '...', tempPassword: '...' }
);
```

**Configuration:**
- API Key: `MAILCHANNELS_API_KEY` (wrangler.toml)
- From Address: `noreply@rosstaxprepandbookkeeping.com`
- Rate Limits: Plan-dependent (typically 1000/hour)

## Enrollment-to-Email Integration

### Enrollment Flow with Email Population

```
1. Student submits enrollment form
   ↓
2. Backend validates form data
   ↓
3. Create lms_enrollments record
   ↓
4. Generate student email
   ├─ generateStudentEmail(db, studentId, firstName, lastName)
   ├─ Resolve conflicts if needed
   └─ Insert into student_email_mappings
   ↓
5. Create role_emails if teacher/admin
   ├─ generateTeacherEmail() or generateAdminEmail()
   └─ Assign department
   ↓
6. Send welcome email
   ├─ Template: accountCreated
   ├─ Include: email address, temp password
   └─ Send via MailChannels
   ↓
7. Log audit trail
   ├─ Enrollment created
   ├─ Email generated
   └─ Welcome email sent
   ↓
8. Return confirmation to student
   ├─ Enrollment ID
   ├─ Student email address
   └─ Next steps
```

### Implementation Example

```typescript
// In enrollment endpoint (POST /api/lms/enroll)
const { firstName, lastName, email, ...otherData } = enrollmentData;

// 1. Create enrollment record
const enrollmentId = `enr-${Date.now()}...`;
await db.prepare(
  `INSERT INTO lms_enrollments (id, first_name, last_name, ...) VALUES (...)`
).run();

// 2. Generate email
const emailResult = await generateStudentEmail(
  db,
  enrollmentId,
  firstName,
  lastName
);

// 3. Send welcome email
await sendStudentEmail(
  env.MAILCHANNELS_API_KEY,
  emailResult.email,
  'accountCreated',
  {
    studentName: `${firstName} ${lastName}`,
    studentEmail: emailResult.email,
    tempPassword: tempPassword // Generated on enrollment
  }
);

// 4. Log to audit
await logAudit(env, {
  action: 'enrollment_with_email',
  resource_id: enrollmentId,
  details: { email: emailResult.email, status: emailResult.status }
});

return {
  enrollmentId,
  studentEmail: emailResult.email,
  message: 'Enrollment complete. Welcome email sent.'
};
```

## Compliance Features

### FERPA Compliance

- **Soft-delete approach:** Email records are deactivated, never deleted
- **Audit trail:** Complete history of email generation/deactivation
- **Data retention:** Records kept per institutional retention policy (7 years standard)
- **Access control:** Role-based access to email records

### PII Handling

- Email addresses encrypted before storage (optional, via `encryptPII`)
- Sanitization of names removes special characters
- No sensitive data in audit logs (only action and timestamp)

### Account Lifecycle

```
New Enrollment
    ↓ generateStudentEmail()
Email Created
    ↓ (student active)
Email Active
    ↓ (account closed)
deactivateStudentEmail()
Email Deactivated
    ↓ (record retained for 7 years)
Archived
```

## API Endpoints

### Generate Email on Enrollment

**POST** `/api/student/email/generate`
- **Auth:** Admin, Manager
- **Body:** `{ enrollmentId, firstName, lastName }`
- **Response:** `{ email, status, createdAt }`

### Get User Emails

**GET** `/api/user/:userId/emails`
- **Auth:** Admin, User
- **Response:** `[{ role: 'student', email: '...' }, ...]`

### Deactivate Email

**POST** `/api/student/email/deactivate`
- **Auth:** Admin
- **Body:** `{ studentId }`
- **Response:** `{ success: true, deactivatedAt }`

### Bulk Generate

**POST** `/api/bulk/generate-emails`
- **Auth:** Admin
- **Body:** `{ enrollments: [{ studentId, firstName, lastName }, ...] }`
- **Response:** `{ created: N, errors: [], results: [...] }`

## Testing Email System

### Test Email Generation

```bash
# Generate single email
curl -X POST http://localhost:8787/api/student/email/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_token" \
  -d '{
    "enrollmentId": "test-001",
    "firstName": "Jane",
    "lastName": "Doe"
  }'

# Response:
# {
#   "email": "jane.doe@rosstaxprepandbookkeeping.com",
#   "status": "created",
#   "createdAt": "2025-02-03T..."
# }
```

### Test Conflict Resolution

```bash
# Generate duplicate name (should auto-increment)
curl -X POST http://localhost:8787/api/student/email/generate \
  -d '{
    "enrollmentId": "test-002",
    "firstName": "Jane",
    "lastName": "Doe"
  }'

# Response:
# {
#   "email": "jane.doe1@rosstaxprepandbookkeeping.com",
#   "status": "conflict_resolved",
#   "createdAt": "2025-02-03T..."
# }
```

### Test Welcome Email Delivery

```bash
# Generate email and send welcome
curl -X POST http://localhost:8787/api/enrollment/send-welcome \
  -d '{
    "enrollmentId": "test-001",
    "tempPassword": "TmpPass123!"
  }'

# Monitor MailChannels logs:
# https://mailchannels.com/dashboard
```

## Configuration

### Environment Variables

Add to [wrangler.toml](wrangler.toml):

```toml
[vars]
MAILCHANNELS_API_KEY = "your-api-key"
NOTIFICATION_FROM_EMAIL = "noreply@rosstaxprepandbookkeeping.com"
DOMAIN_NAME = "rosstaxprepandbookkeeping.com"

# Email retention period (days)
EMAIL_RETENTION_DAYS = 2555  # ~7 years

# Feature flags
ENABLE_EMAIL_GENERATION = true
ENABLE_BULK_EMAIL = true
```

### MailChannels Setup

1. Create MailChannels account: https://mailchannels.com
2. Verify domain ownership (DNS TXT record)
3. Generate API key
4. Add key to wrangler.toml secrets: `npx wrangler secret put MAILCHANNELS_API_KEY`

### DNS Configuration

Add to domain DNS provider:

```
Type: TXT
Name: _mailchannels.rosstaxprepandbookkeeping.com
Value: v=mc1 cfid=rosstaxacademy.cloudflare.com
```

## Performance Considerations

### Database Optimization

- Unique indexes on `student_email` prevent duplicates
- Indexed queries by `student_id` and `role`
- Composite index `(user_id, role)` for role_emails lookups
- Status index for filtering active vs. deactivated

### Email Performance

- MailChannels async delivery (fire-and-forget)
- Batch endpoint for bulk email (up to 100 at once)
- Queue system for high-volume periods
- Retry logic for failed sends (3 attempts with backoff)

### Data Volume Estimates

For 1,000 students:
- `student_email_mappings`: ~1.5 KB per record = 1.5 MB
- `email_generation_audit`: ~0.5 KB per record = 0.5 MB per year
- `role_emails`: ~1 KB per record = 100 KB (100 teachers/admins)
- **Total:** ~2 MB initial + 0.5 MB annually

## Troubleshooting

### Issue: Email Generation Fails with "Infinite Loop"

**Cause:** Same name with extremely high conflict count (>999)

**Solution:**
1. Review records with `SELECT COUNT(*) FROM student_email_mappings WHERE student_email LIKE 'firstname.lastname%'`
2. Manually assign email: `UPDATE student_email_mappings SET student_email = 'custom@rosstaxprepandbookkeeping.com' WHERE student_id = '...'`
3. Add to audit log for compliance

### Issue: MailChannels Emails Not Sending

**Cause:** Missing API key or domain verification

**Solution:**
1. Verify `MAILCHANNELS_API_KEY` is set: `npx wrangler secret list`
2. Check domain DNS: `nslookup _mailchannels.rosstaxprepandbookkeeping.com`
3. Review MailChannels dashboard for errors
4. Test with: `curl -H "X-API-KEY: key" https://api.mailchannels.net/tx/v1/send`

### Issue: Duplicate Email Address Error

**Cause:** Race condition in concurrent enrollment processing

**Solution:**
1. Enable database transaction: `BEGIN TRANSACTION`
2. Use `INSERT OR IGNORE` for idempotency
3. Catch duplicate constraint error and return existing email
4. Implement request deduplication at API layer

## Next Steps

1. **Integration:** Add email generation call to enrollment endpoint
2. **Testing:** Run test suite against MailChannels sandbox
3. **Monitoring:** Set up alerts for email delivery failures
4. **Scaling:** Implement queue system for bulk enrollments (>100/hour)
5. **Compliance:** Set up 7-year data retention policy with automatic archival

## See Also

- [src/utils/email-generation.ts](src/utils/email-generation.ts) - Email generation logic
- [src/utils/role-emails.ts](src/utils/role-emails.ts) - Email templates and delivery
- [ENROLLMENT-EMAIL-INTEGRATION.md](ENROLLMENT-EMAIL-INTEGRATION.md) - Step-by-step enrollment flow
- [COMPLIANCE-RECORD-KEEPING.md](COMPLIANCE-RECORD-KEEPING.md) - Federal compliance requirements
