# PRODUCTION-KEYS-CONFIGURATION.md

## Ross Tax Academy - Production Environment Configuration

**Version:** 2.0  
**Last Updated:** 2025-01-15  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Cloudflare Configuration](#cloudflare-configuration)
3. [Email Service (MailChannels)](#email-service-mailchannels)
4. [Payment Processing (Stripe)](#payment-processing-stripe)
5. [AI Instructor System (OpenAI/Claude)](#ai-instructor-system-openaiclaus)
6. [Proctoring (Proctor-U)](#proctoring-proctor-u)
7. [Video Conferencing (Google Meet)](#video-conferencing-google-meet)
8. [Database Configuration](#database-configuration)
9. [Security & Key Management](#security--key-management)
10. [Environment Variables Template](#environment-variables-template)
11. [Deployment Checklist](#deployment-checklist)
12. [Troubleshooting](#troubleshooting)

---

## Overview

This document specifies all production keys, API credentials, and environment variables required for Ross Tax Academy's distance learning platform.

**Production Services:**
- Email Notifications: MailChannels
- Payments: Stripe (credit cards, ACH)
- AI Instructors: OpenAI GPT-4 or Anthropic Claude
- Exam Proctoring: Proctor-U
- Live Lectures: Google Meet
- File Storage: Cloudflare R2
- Database: Cloudflare D1 (SQLite)
- Authentication: JWT tokens

**Total Configuration Keys:** 25+
**Setup Time:** 2-3 hours
**Cost (Annual):**
- MailChannels: $0-500 (based on volume)
- Stripe: 2.2% + $0.30 per transaction
- OpenAI: $0.01-0.03 per 1K tokens (variable)
- Proctor-U: $15-30 per exam
- Google Meet: Included with Google Workspace
- Cloudflare: $200/month (Workers, D1, R2)

---

## Cloudflare Configuration

### Wrangler.toml Setup

```toml
# wrangler.toml - Production Configuration

name = "ross-tax-academy"
main = "src/index.ts"
compatibility_date = "2024-12-01"
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"
workers_dev = true

# D1 Database Bindings
[[d1_databases]]
binding = "DB"
database_name = "ross-tax-academy-prod"
database_id = "YOUR_D1_DATABASE_ID"

# R2 Storage Binding
[[r2_buckets]]
binding = "DOCUMENTS_BUCKET"
bucket_name = "ross-tax-academy-documents"

# KV Storage (for caching, tokens)
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"

# Environment Variables
[env.production]
vars = { ENVIRONMENT = "production", LOG_LEVEL = "info" }

[env.production.secrets]
# Email Service
MAILCHANNELS_API_KEY = "YOUR_MAILCHANNELS_API_KEY"
MAILCHANNELS_FROM_EMAIL = "noreply@rosstaxacademy.com"

# Payment Processing
STRIPE_SECRET_KEY = "sk_live_YOUR_STRIPE_SECRET"
STRIPE_PUBLIC_KEY = "pk_live_YOUR_STRIPE_PUBLIC"
STRIPE_WEBHOOK_SECRET = "whsec_YOUR_STRIPE_WEBHOOK"

# AI Instructors
OPENAI_API_KEY = "sk-YOUR_OPENAI_KEY"
CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY"

# Proctoring
PROCTOR_U_API_KEY = "YOUR_PROCTOR_U_API_KEY"
PROCTOR_U_ACCOUNT_ID = "YOUR_PROCTOR_U_ACCOUNT_ID"

# Google Meet/Classroom
GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_REFRESH_TOKEN = "YOUR_GOOGLE_REFRESH_TOKEN"

# Authentication & Security
JWT_SECRET = "YOUR_JWT_SECRET_MIN_32_CHARS"
ENCRYPTION_KEY = "YOUR_AES_256_ENCRYPTION_KEY"
API_KEY = "YOUR_API_KEY_FOR_INTERNAL_CALLS"

# Email Configuration
SMTP_HOST = "smtp.mailchannels.net"
ADMIN_EMAIL = "admin@rosstaxacademy.com"
SUPPORT_EMAIL = "support@rosstaxacademy.com"
BILLING_EMAIL = "billing@rosstaxacademy.com"

# Application URLs
FRONTEND_URL = "https://academy.rosstaxacademy.com"
BACKEND_URL = "https://api.rosstaxacademy.com"
CERTIFICATE_BASE_URL = "https://academy.rosstaxacademy.com/verify"

# Feature Flags
ENABLE_PROCTOR_U = "true"
ENABLE_GOOGLE_MEET = "true"
ENABLE_AI_PROFESSORS = "true"
ENABLE_CLASS_SCHEDULING = "true"

[triggers]
crons = [
  "0 2 * * *",      # Daily: Process pending enrollments (2 AM UTC)
  "*/6 * * * *",    # Every 6 hours: Send payment reminders
  "0 * * * *",      # Hourly: Check scheduled lectures
  "0 0 * * 0"       # Weekly: Generate compliance reports
]
```

### Key Cloudflare Resources

**Account ID:**
- Location: Cloudflare Dashboard → Account Home → API Tokens
- Format: 32-character hexadecimal string
- Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**API Tokens:**
```
Zone: Edit Cloudflare Workers
Token Level: Zone Level
Used for: Deployments via `wrangler deploy`
```

**D1 Database:**
```
Database Name: ross-tax-academy-prod
Database ID: Found in Cloudflare Dashboard
```

**R2 Bucket:**
```
Bucket Name: ross-tax-academy-documents
Public URL: https://cdn.rosstaxacademy.com/{file-path}
Access Type: Public (for certificates), Private (for student documents)
```

---

## Email Service (MailChannels)

### Setup Instructions

1. **Create MailChannels Account**
   - Visit: https://www.mailchannels.com/
   - Sign up for Cloudflare Workers plan ($0-500/month based on volume)

2. **Generate API Key**
   ```
   Dashboard → API Keys → Create New Key
   Scope: Send Emails
   Name: Ross Tax Academy Production
   ```

3. **Configure Authorized Sender Domain**
   ```
   Domain: rosstaxacademy.com
   Verification: Add TXT records to DNS
   ```

4. **DNS Configuration**
   ```
   TXT: mailchannels={domain}=rosstaxacademy.com
   SPF: v=spf1 include:mailchannels.net ~all
   DKIM: Add provided DKIM records
   ```

### Environment Variables

```env
# MailChannels Email Service
MAILCHANNELS_API_KEY=mc_1234567890abcdef1234567890abcdef
MAILCHANNELS_FROM_EMAIL=noreply@rosstaxacademy.com
MAILCHANNELS_FROM_NAME=Ross Tax Academy
```

### Email Templates Configured

1. **Enrollment Confirmation** → `sendEnrollmentConfirmation()`
2. **Payment Confirmation** → `sendPaymentConfirmation()`
3. **Certificate Issuance** → `sendCertificateEmail()`
4. **Refund Notification** → `sendRefundConfirmation()`
5. **Admin Alerts** → `sendAdminEnrollmentNotification()`
6. **Class Reminders** → `sendClassReminder()` (to be implemented)
7. **Lecture Links** → `sendLectureNotification()` (to be implemented)

### Cost Estimation

- **Volume**: 5,000 students × 10 emails/year = 50,000 emails/year
- **Cost**: $0.50-5.00/month (typical range for education)
- **Limits**: Check plan for daily/monthly sending limits

### Testing

```bash
# Test API connectivity
curl -X POST https://api.mailchannels.net/tx/v1/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "personalizations": [{
      "to": [{"email": "test@example.com"}]
    }],
    "from": {"email": "noreply@rosstaxacademy.com"},
    "subject": "Test Email",
    "content": [{
      "type": "text/html",
      "value": "<p>Test</p>"
    }]
  }'
```

---

## Payment Processing (Stripe)

### Setup Instructions

1. **Create Stripe Account**
   - Visit: https://stripe.com/
   - Sign up for production account
   - Verify business information

2. **Generate API Keys**
   - Dashboard → Developers → API Keys
   - Copy: Live Secret Key (`sk_live_...`)
   - Copy: Live Publishable Key (`pk_live_...`)

3. **Configure Webhook Endpoint**
   ```
   Endpoint URL: https://api.rosstaxacademy.com/webhooks/stripe
   Events: payment_intent.succeeded, payment_intent.payment_failed, customer.subscription.deleted
   Signing Secret: whsec_...
   ```

4. **Enable Payment Methods**
   - Settings → Payment Methods
   - Enable: Credit Cards, ACH Direct Debit, Bank Transfers
   - Set up: 3D Secure for international cards

### Environment Variables

```env
# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLIC_KEY=pk_live_YOUR_STRIPE_PUBLIC_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_CONNECT_ENABLED=true
```

### Pricing Configuration

```javascript
// src/config/pricing.ts
const PRICING = {
  'certificate-level-1': { amount: 29900, interval: 'once' }, // $299
  'certificate-level-2': { amount: 49900, interval: 'once' }, // $499
  'tax-practitioner': { amount: 79900, interval: 'once' }, // $799
  'ea-prep': { amount: 99900, interval: 'once' }, // $999
  'bundle-all': { amount: 149900, interval: 'once' }, // $1,499
  'aas-degree': { amount: 499900, interval: 'once' }, // $4,999
  'monthly-plan': { amount: 14900, interval: 'month' } // $149/month
};
```

### Payment Flow

1. Student selects course → Stripe Checkout
2. Payment processed → Stripe webhook
3. Enrollment activated → MailChannels confirmation
4. Portal access granted → Student dashboard updated

### Testing

```bash
# Use Stripe test cards
4242 4242 4242 4242  # Success
4000 0000 0000 0002  # Declined
```

### Cost Structure

- **Processing Fee**: 2.2% + $0.30 per transaction
- **Monthly Fee**: $0
- **ACH Fee**: 0.8% (capped at $5)
- **Example**: $299 course = $6.87 fee (2.3%)

---

## AI Instructor System (OpenAI/Claude)

### Configuration Options

**Option A: OpenAI GPT-4** (Recommended)
```
Model: gpt-4 or gpt-4-turbo
Cost: $0.01-0.03 per 1K tokens
Response Time: 1-5 seconds
```

**Option B: Anthropic Claude**
```
Model: claude-3-opus
Cost: $0.015-0.075 per 1K tokens
Response Time: 2-10 seconds
```

### Setup Instructions (OpenAI)

1. **Create OpenAI Account**
   - Visit: https://platform.openai.com/
   - Sign up for paid plan ($5+ monthly minimum)

2. **Generate API Key**
   - Dashboard → API Keys → Create new secret key
   - Name: Ross Tax Academy Production

3. **Set Up Usage Limits**
   - Billing → Usage Limits → Set max monthly: $500

### Setup Instructions (Claude)

1. **Create Anthropic Account**
   - Visit: https://console.anthropic.com/
   - Sign up for API access

2. **Generate API Key**
   - Dashboard → API Keys → Create new key
   - Name: Ross Tax Academy Production

### Environment Variables

```env
# AI Instructor Configuration
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY_HERE
OPENAI_MODEL=gpt-4-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# OR use Claude
CLAUDE_API_KEY=sk-ant-YOUR_CLAUDE_KEY_HERE
CLAUDE_MODEL=claude-3-opus-20240229
CLAUDE_MAX_TOKENS=2000

# AI Professor Configuration
AI_INSTRUCTOR_ENABLED=true
AI_INSTRUCTOR_PROVIDER=openai  # or 'claude'
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT=30000
```

### AI Professor Personas

```javascript
// src/config/ai-professors.json
{
  "professors": {
    "tax-1101": {
      "name": "Dr. Sarah Chen",
      "title": "Tax Fundamentals Expert",
      "bio": "15+ years teaching tax basics with focus on practical application",
      "teaching_style": "Socratic method, real-world examples",
      "specialization": "Individual tax returns, deductions, credits",
      "system_prompt": "You are Dr. Sarah Chen, a tax instructor. Explain concepts clearly with examples..."
    },
    "accounting-2201": {
      "name": "Professor James Mitchell",
      "title": "Accounting Methods Specialist",
      "bio": "Accounting educator passionate about bookkeeping fundamentals",
      "teaching_style": "Step-by-step walkthroughs, frequent quizzes",
      "specialization": "Double-entry bookkeeping, P&L statements",
      "system_prompt": "You are Professor James Mitchell, an accounting instructor..."
    }
  }
}
```

### Capabilities

1. **Lecture Generation**
   - Input: Course topic, student level
   - Output: Structured lecture (intro, main content, examples, summary)

2. **Question Answering**
   - Input: Student question, course context
   - Output: Detailed answer with examples and references

3. **Assignment Feedback**
   - Input: Student submission, rubric
   - Output: Detailed feedback with suggestions

4. **Quiz Generation**
   - Input: Topic, difficulty, question count
   - Output: Multiple choice/short answer quiz

### API Implementation

```typescript
// src/utils/ai-professor.ts
export async function generateLecture(
  env: any,
  courseId: string,
  topic: string,
  studentLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<string> {
  const apiKey = env.OPENAI_API_KEY;
  const professorConfig = getProfessorConfig(courseId);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: professorConfig.system_prompt
        },
        {
          role: 'user',
          content: `Create a ${studentLevel} lecture on: ${topic}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Cost Management

- **Budget Alert**: Set monthly limit to $500
- **Batching**: Queue requests to avoid peak pricing
- **Caching**: Store generated lectures for reuse
- **Monitoring**: Track token usage via dashboard

### Testing

```bash
# Test OpenAI connectivity
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

## Proctoring (Proctor-U)

### Setup Instructions

1. **Create Proctor-U Account**
   - Visit: https://www.proctorexam.com/
   - Create institutional account
   - Provide: Institution name, contact info, exam details

2. **Generate API Credentials**
   - Admin Dashboard → API Settings
   - Client ID: YOUR_PROCTOR_U_ACCOUNT_ID
   - API Key: YOUR_PROCTOR_U_API_KEY

3. **Configure Exam Settings**
   - Proctoring Type: Live (real-time proctor) or Record & Review
   - Requirements: ID verification, face detection, browser lockdown
   - Recording: Yes (for compliance)

### Environment Variables

```env
# Proctor-U Exam Proctoring
PROCTOR_U_ENABLED=true
PROCTOR_U_ACCOUNT_ID=YOUR_ACCOUNT_ID
PROCTOR_U_API_KEY=YOUR_API_KEY
PROCTOR_U_CLIENT_ID=YOUR_CLIENT_ID
PROCTOR_U_ENDPOINT=https://api.proctorexam.com/api/v1
PROCTOR_U_TEST_MODE=false
```

### Exam Configuration

```javascript
// src/config/exam-settings.ts
const EXAM_SETTINGS = {
  'tax-1101-exam': {
    title: 'Tax Fundamentals Final Exam',
    duration: 120, // minutes
    proctoring_type: 'live', // 'live' or 'record_review'
    require_id_verification: true,
    require_face_detection: true,
    allow_calculator: false,
    allow_notes: false,
    browser_lockdown: true,
    record_audio: true,
    record_video: true
  }
};
```

### Proctored Exam Flow

1. Student schedules exam → Proctor-U calendar
2. 15 minutes before: Identity verification begins
3. At exam start: Browser locks, proctor joins (live) or recording starts
4. During exam: Proctor monitors for cheating, suspicious behavior
5. After completion: Results sent to institution + Student portal
6. Review: Faculty reviews recording if exam flagged

### API Implementation

```typescript
// src/routes/proctor.ts
export async function scheduleProctorExam(
  env: any,
  db: any,
  enrollmentId: string,
  examId: string,
  scheduledTime: Date
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  const apiKey = env.PROCTOR_U_API_KEY;
  const accountId = env.PROCTOR_U_ACCOUNT_ID;

  const response = await fetch(
    `${env.PROCTOR_U_ENDPOINT}/schedule-exam`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account_id: accountId,
        exam_id: examId,
        enrollment_id: enrollmentId,
        scheduled_time: scheduledTime.toISOString(),
        exam_settings: EXAM_SETTINGS[examId]
      })
    }
  );

  const data = await response.json();
  return {
    success: data.success,
    sessionId: data.session_id,
    error: data.error
  };
}
```

### Cost Structure

- **Per Exam**: $15-30 depending on proctoring type
- **Setup Fee**: $0 (included with platform)
- **Monthly Minimum**: Usually $0
- **Annual Cost (500 exams)**: $7,500-15,000

### Testing

```bash
# Schedule test exam
curl -X POST https://api.proctorexam.com/api/v1/schedule-exam \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"exam_id":"test-123"}'
```

---

## Video Conferencing (Google Meet)

### Setup Instructions

1. **Create Google Workspace Account**
   - Visit: https://workspace.google.com/
   - Subscribe to Business Standard or higher
   - Enable Google Meet API

2. **Create OAuth 2.0 Credentials**
   - Google Cloud Console → APIs & Services
   - Create OAuth 2.0 Client ID (Web Application)
   - Authorized redirect URIs: https://api.rosstaxacademy.com/oauth/callback
   - Download credentials JSON

3. **Enable Google Meet API**
   - APIs & Services → Library
   - Search: Google Meet API
   - Enable the API
   - Enable: Google Calendar API (for scheduling)

4. **Generate Service Account** (for automated meeting creation)
   - Create Service Account
   - Create JSON key file
   - Share Google Calendar with service account email

### Environment Variables

```env
# Google Meet Configuration
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
GOOGLE_CALENDAR_ID=instructor@rosstaxacademy.com
GOOGLE_MEET_ENABLED=true
GOOGLE_MEET_DOMAIN=rosstaxacademy.com

# Service Account (for automated meetings)
GOOGLE_SERVICE_ACCOUNT_EMAIL=bot@rosstaxacademy.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=PATH_TO_KEY_JSON
```

### Meeting Configuration

```javascript
// src/config/google-meet.ts
const MEETING_DEFAULTS = {
  duration: 60, // minutes
  enableRecording: true,
  enableTranscription: true,
  requireAuth: true,
  allowGuests: false,
  meetingCode: 'auto-generate',
  timezone: 'America/Chicago'
};
```

### Features

1. **Live Lectures**
   - Instructor streams lecture
   - Students watch with chat disabled
   - Recording saved to Google Drive

2. **Office Hours**
   - Open discussion with students
   - Q&A sessions
   - One-on-one meetings

3. **Study Groups**
   - Student-led discussions
   - Peer learning
   - Group project work

4. **Recording & Archival**
   - Lectures recorded and archived
   - Available for asynchronous access
   - Auto-transcribed for accessibility

### API Implementation

```typescript
// src/routes/google-meet.ts
export async function createMeetingLink(
  env: any,
  db: any,
  courseId: string,
  lessonId: string,
  scheduledTime: Date
): Promise<{ meetUrl?: string; error?: string }> {
  const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GOOGLE_REFRESH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: `Lecture: ${courseId}`,
      description: `Lesson: ${lessonId}`,
      start: { dateTime: scheduledTime.toISOString() },
      end: { dateTime: new Date(scheduledTime.getTime() + 60 * 60000).toISOString() },
      conferenceData: {
        createRequest: { requestId: `${courseId}-${lessonId}` }
      }
    })
  });

  const data = await response.json();
  return { meetUrl: data.conferenceData.entryPoints[0].uri };
}
```

### Cost Structure

- **Cost**: Free (included with Google Workspace Business Standard)
- **Participants**: Unlimited
- **Recording Storage**: Limited by Google Drive quota (100GB minimum)
- **Concurrent Meetings**: Depends on Workspace plan

### Testing

```bash
# Test Google Meet integration
curl -H "Authorization: Bearer $GOOGLE_REFRESH_TOKEN" \
  https://www.googleapis.com/calendar/v3/calendars/primary
```

---

## Database Configuration

### D1 Schema Setup

```sql
-- Key tables for production

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  program_id TEXT NOT NULL,
  program_name TEXT NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status TEXT DEFAULT 'pending', -- pending, partial, complete
  total_cost DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' -- active, completed, refunded, suspended
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  certificate_code TEXT UNIQUE NOT NULL,
  course_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  completion_date TIMESTAMP NOT NULL,
  issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_url TEXT,
  qr_code_url TEXT,
  revoked INTEGER DEFAULT 0,
  revocation_reason TEXT,
  revoked_at TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);

CREATE TABLE IF NOT EXISTS ai_professors (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  professor_name TEXT NOT NULL,
  professor_title TEXT,
  system_prompt TEXT NOT NULL,
  teaching_style TEXT,
  specialization TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_schedules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  section_number TEXT NOT NULL,
  time_of_day TEXT NOT NULL, -- 'morning', 'afternoon', 'evening'
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week TEXT NOT NULL, -- 'MWF', 'TR', etc
  term_id TEXT NOT NULL,
  ai_professor_id TEXT,
  max_students INTEGER DEFAULT 30,
  enrolled_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', -- open, full, cancelled
  FOREIGN KEY (ai_professor_id) REFERENCES ai_professors(id)
);

CREATE TABLE IF NOT EXISTS proctor_sessions (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  session_id TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, flagged
  recording_url TEXT,
  proctor_notes TEXT,
  exam_score DECIMAL(5,2),
  flagged_for_review INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);

CREATE TABLE IF NOT EXISTS google_meet_sessions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  lesson_title TEXT,
  scheduled_time TIMESTAMP NOT NULL,
  meet_url TEXT NOT NULL,
  recording_url TEXT,
  recording_duration_minutes INTEGER,
  participants_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled', -- scheduled, live, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSON,
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_program ON enrollments(program_id);
CREATE INDEX idx_certificates_code ON certificates(certificate_code);
CREATE INDEX idx_class_schedules_course ON class_schedules(course_id);
CREATE INDEX idx_proctor_sessions_exam ON proctor_sessions(exam_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```

### Backup Configuration

```bash
# Automated D1 backups (daily)
Schedule: 3 AM UTC daily
Retention: 30 days
Location: R2 bucket (`backups/d1/`)

# R2 Lifecycle Policy
Delete old backups after 30 days
Versioning: Enabled
Replication: Optional (enterprise feature)
```

---

## Security & Key Management

### Secret Storage Best Practices

1. **Never Commit Secrets**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production.local
   wrangler.toml (if contains secrets)
   ```

2. **Use Cloudflare Secrets**
   ```bash
   # Publish secrets (not in git)
   wrangler secret put MAILCHANNELS_API_KEY
   wrangler secret put STRIPE_SECRET_KEY
   # etc.
   ```

3. **Rotation Schedule**
   - Monthly: API keys
   - Quarterly: JWT secrets
   - Annually: Encryption keys
   - On compromise: Immediately

4. **Access Control**
   - Production secrets: Only for deployment
   - Staging secrets: For QA testing
   - Development secrets: Local only (.env.local)

### Encryption Configuration

```typescript
// src/utils/encryption.ts
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

export function encryptPII(data: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(encryptionKey), iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
```

### Compliance Logging

```bash
# Audit logs track:
- Student enrollment
- Payment transactions
- Certificate issuance
- Access to PII
- Administrative actions
- Failed login attempts
- Role changes

# Retention: 7 years (FERPA requirement)
# Access: Only authorized admins
# Encryption: In transit (HTTPS) and at rest (AES-256)
```

---

## Environment Variables Template

Create `.env.production` with all required variables:

```env
# ========================================
# CLOUDFLARE CONFIGURATION
# ========================================
ENVIRONMENT=production
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# ========================================
# EMAIL SERVICE (MAILCHANNELS)
# ========================================
MAILCHANNELS_API_KEY=mc_your_key_here
MAILCHANNELS_FROM_EMAIL=noreply@rosstaxacademy.com
MAILCHANNELS_FROM_NAME=Ross Tax Academy

# ========================================
# PAYMENT PROCESSING (STRIPE)
# ========================================
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_PUBLIC_KEY=pk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ========================================
# AI INSTRUCTORS (OPENAI/CLAUDE)
# ========================================
AI_INSTRUCTOR_PROVIDER=openai  # or 'claude'
OPENAI_API_KEY=sk-proj-your_key_here
OPENAI_MODEL=gpt-4-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
# OR
CLAUDE_API_KEY=sk-ant-your_key_here
CLAUDE_MODEL=claude-3-opus-20240229

# ========================================
# PROCTORING (PROCTOR-U)
# ========================================
PROCTOR_U_ENABLED=true
PROCTOR_U_ACCOUNT_ID=your_account_id
PROCTOR_U_API_KEY=your_api_key
PROCTOR_U_CLIENT_ID=your_client_id
PROCTOR_U_ENDPOINT=https://api.proctorexam.com/api/v1

# ========================================
# VIDEO CONFERENCING (GOOGLE MEET)
# ========================================
GOOGLE_MEET_ENABLED=true
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_CALENDAR_ID=instructor@rosstaxacademy.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=bot@rosstaxacademy.iam.gserviceaccount.com

# ========================================
# DATABASE
# ========================================
D1_DATABASE_ID=your_d1_database_id

# ========================================
# FILE STORAGE (R2)
# ========================================
R2_BUCKET_NAME=ross-tax-academy-documents
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key

# ========================================
# SECURITY & AUTHENTICATION
# ========================================
JWT_SECRET=your_jwt_secret_min_32_chars_long
ENCRYPTION_KEY=your_aes_256_encryption_key_32_bytes
API_KEY=your_internal_api_key
API_SECRET=your_api_secret

# ========================================
# APPLICATION URLS
# ========================================
FRONTEND_URL=https://academy.rosstaxacademy.com
BACKEND_URL=https://api.rosstaxacademy.com
CERTIFICATE_BASE_URL=https://academy.rosstaxacademy.com/verify
ADMIN_URL=https://admin.rosstaxacademy.com

# ========================================
# FEATURE FLAGS
# ========================================
ENABLE_PROCTOR_U=true
ENABLE_GOOGLE_MEET=true
ENABLE_AI_PROFESSORS=true
ENABLE_CLASS_SCHEDULING=true
ENABLE_EMAIL_NOTIFICATIONS=true

# ========================================
# SUPPORT CONTACTS
# ========================================
ADMIN_EMAIL=admin@rosstaxacademy.com
SUPPORT_EMAIL=support@rosstaxacademy.com
BILLING_EMAIL=billing@rosstaxacademy.com
COMPLIANCE_EMAIL=compliance@rosstaxacademy.com

# ========================================
# LOGGING & MONITORING
# ========================================
LOG_LEVEL=info  # debug, info, warn, error
SENTRY_DSN=your_sentry_dsn_if_using

# ========================================
# SCHEDULED TASKS (CRON)
# ========================================
# Defined in wrangler.toml triggers section
```

---

## Deployment Checklist

### Pre-Production Verification

- [ ] All environment variables configured in Cloudflare Secrets
- [ ] Database migration applied (schema.sql)
- [ ] R2 bucket created and configured
- [ ] D1 database created and bindings verified
- [ ] Email domain verified with MailChannels
- [ ] Stripe webhook endpoint created and tested
- [ ] Google Meet API enabled and credentials generated
- [ ] Proctor-U account created and API keys verified
- [ ] AI provider (OpenAI/Claude) account created and API key generated
- [ ] TLS certificate valid (HTTPS enabled)
- [ ] Backups configured for D1 and R2
- [ ] Monitoring and alerting configured
- [ ] Security audit completed

### Deployment Steps

```bash
# 1. Test locally
npm run test
npm run build

# 2. Deploy to staging
wrangler deploy --env staging

# 3. Run smoke tests
npm run test:smoke

# 4. Deploy to production
wrangler deploy --env production

# 5. Verify production
curl https://api.rosstaxacademy.com/health
curl https://academy.rosstaxacademy.com/

# 6. Monitor logs
wrangler tail --env production
```

### Post-Deployment Verification

- [ ] Health check endpoint responds (200 OK)
- [ ] Database queries working
- [ ] File uploads to R2 working
- [ ] Email sending functional (test email sent)
- [ ] Stripe integration operational (test transaction)
- [ ] OAuth flows authenticated
- [ ] Scheduled tasks triggering (check logs)
- [ ] Monitoring dashboards active
- [ ] Error tracking (Sentry) reporting

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Email Not Sending

**Error:** `401 Unauthorized from MailChannels`

**Solutions:**
- Verify `MAILCHANNELS_API_KEY` is correct
- Check domain is verified (DNS TXT records)
- Ensure `MAILCHANNELS_FROM_EMAIL` matches authorized sender
- Check sending limits haven't been exceeded

```bash
# Test MailChannels connectivity
curl -X POST https://api.mailchannels.net/tx/v1/send \
  -H "X-API-Key: $MAILCHANNELS_API_KEY" \
  -d '{...}'
```

#### 2. Payment Processing Fails

**Error:** `Invalid API key provided`

**Solutions:**
- Verify using **Live** keys (not Test keys)
- Check Stripe account is in live mode
- Ensure key hasn't expired
- Verify webhook endpoint is correct

```bash
# Test Stripe connectivity
curl https://api.stripe.com/v1/account \
  -H "Authorization: Bearer sk_live_YOUR_KEY"
```

#### 3. Database Connection Fails

**Error:** `D1_ERROR: database is locked`

**Solutions:**
- Check for long-running transactions
- Reduce query timeout
- Verify database bindings in wrangler.toml
- Check local vs production database ID

```bash
# Test D1 query
wrangler d1 execute DB "SELECT 1;" --remote
```

#### 4. Google Meet Integration Fails

**Error:** `invalid_grant` during OAuth refresh

**Solutions:**
- Refresh token may have expired
- Re-generate OAuth tokens
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URI matches in Google Console

#### 5. Proctor-U Session Won't Start

**Error:** `Authentication failed`

**Solutions:**
- Verify `PROCTOR_U_API_KEY` in Proctor-U dashboard
- Check exam is properly configured
- Ensure student identity verified
- Check browser compatibility (Proctor-U requires Chromium)

---

## Support & Resources

**Cloudflare Docs:** https://developers.cloudflare.com/workers/
**Stripe Docs:** https://stripe.com/docs/api
**MailChannels Docs:** https://www.mailchannels.com/docs
**OpenAI Docs:** https://platform.openai.com/docs
**Proctor-U Docs:** https://www.proctorexam.com/support
**Google Meet Docs:** https://developers.google.com/meet

---

**Document Version:** 2.0  
**Last Updated:** 2025-01-15  
**Status:** Production Ready  
**Owner:** Ross Tax Academy IT Department
