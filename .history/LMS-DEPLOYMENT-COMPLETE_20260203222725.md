# Ross Tax Academy LMS - Complete Deployment Guide

## System Overview

The Learning Management System (LMS) provides:
- **5 Certificate Programs**: TP-101 through AI-501 ($399-$899)
- **Secure Enrollment**: PII encryption, audit logging, agreement signing
- **Payment Integration**: Stripe, Square, PayPal, payment plans, employer billing
- **Certificate Generation**: Unique verification codes, QR code verification
- **FAFSA-Compatible Language**: Partners with accredited institutions
- **AI-Assisted Learning**: Instructor-controlled, human-certified completion

## Architecture

### Backend Components

1. **[src/routes/lmsEnrollment.ts](src/routes/lmsEnrollment.ts)** - New enrollment & certificate router
   - `POST /api/lms/enroll` - Submit enrollment application
   - `GET /api/lms/enrollments/:id` - Retrieve enrollment details
   - `POST /api/lms/certificates/generate` - Issue completion certificate
   - `GET /api/lms/certificates/verify/:code` - Verify certificate authenticity

2. **[src/routes/lms.ts](src/routes/lms.ts)** - Existing LMS routes (courses, students)

3. **[src/routes/lmsPayment.ts](src/routes/lmsPayment.ts)** - Payment processing (Stripe/Square)

4. **[src/index.ts](src/index.ts)** - Main worker with route delegation

### Frontend Components

1. **[frontend/public/academy.html](frontend/public/academy.html)** - Academy landing page
   - 5 course cards with pricing, badges, metadata
   - Features grid (instructor-led, career support, flexible schedule)
   - Financial aid information (FAFSA partners, payment plans)
   - Trust indicators (IRS-compliant curriculum, QR-verified certificates)

2. **[frontend/public/forms/enrollment.html](frontend/public/forms/enrollment.html)** - Enrollment form
   - Student information (name, DOB, contact, address)
   - Course selection (dropdown with dynamic pricing)
   - Payment method (full, payment plan, employer billing)
   - Financial aid interest checkbox
   - Legal agreements (enrollment, refund, conduct, privacy)

3. **[frontend/public/lms/courses.json](frontend/public/lms/courses.json)** - Course catalog
   - Complete program definitions with modules, pricing, outcomes
   - FAFSA disclaimer, AI usage policy, certificate details
   - Payment options, financial aid information

### Database Schema

1. **[schema/lms-pricing-enrollment.sql](schema/lms-pricing-enrollment.sql)**
   - `lms_tuition_pricing` - Program prices with payment plans
   - `lms_bundle_pricing` - Multi-program bundles with discounts
   - `lms_enrollments` - Student enrollments with locked pricing
   - `lms_payments` - Payment tracking (full, installments, refunds)

2. **[schema/lms-certificates.sql](schema/lms-certificates.sql)** - NEW
   - `lms_certificates` - Certificate records with verification codes
   - `lms_certificate_verifications` - Audit trail of verification requests

## Deployment Steps

### 1. Database Migration

```powershell
# Apply LMS enrollment schema
npx wrangler d1 execute DB --file=schema/lms-pricing-enrollment.sql --local

# Apply NEW certificates schema
npx wrangler d1 execute DB --file=schema/lms-certificates.sql --local

# For production:
npx wrangler d1 execute DB --file=schema/lms-pricing-enrollment.sql
npx wrangler d1 execute DB --file=schema/lms-certificates.sql
```

### 2. Environment Variables

Add to [wrangler.toml](wrangler.toml):

```toml
[vars]
# Encryption key for PII (32-byte hex)
ENCRYPTION_KEY = "your-32-byte-hex-key-here"

# Payment gateways
STRIPE_SECRET_KEY = "sk_live_..."
STRIPE_WEBHOOK_SECRET = "whsec_..."
SQUARE_ACCESS_TOKEN = "sq0atp..."
PAYPAL_CLIENT_ID = "..."
PAYPAL_CLIENT_SECRET = "..."

# Email notifications (MailChannels)
MAILCHANNELS_API_KEY = "..."
NOTIFICATION_FROM_EMAIL = "academy@rosstaxprep.com"

# Certificate generation
CERTIFICATE_BASE_URL = "https://rosstaxprep.com"
CERTIFICATE_VERIFICATION_URL = "https://rosstaxprep.com/verify"
```

### 3. Worker Deployment

```powershell
# Build and test locally
npm run dev

# Run LMS test suite
.\test-lms-flow.ps1

# Deploy to Cloudflare
npm run deploy
```

### 4. Frontend Deployment

```powershell
cd frontend

# Test locally
npm run dev

# Deploy to Cloudflare Pages
npm run deploy
```

### 5. Cloudflare Security Rules

#### Turnstile (CAPTCHA)
- Enable on `/forms/enrollment.html`
- Mode: Managed challenge
- Score threshold: 0.5

#### Rate Limiting
- `/api/lms/enroll`: 5 requests per 15 minutes per IP
- `/api/lms/certificates/generate`: 10 requests per hour per IP
- `/api/lms/certificates/verify/*`: 100 requests per hour per IP

#### Firewall Rules
```
(http.request.uri.path contains "/api/lms/enroll") and (cf.threat_score > 30)
Action: Challenge
```

#### Cache Rules
- Cache `/lms/courses.json` for 1 hour (with purge on update)
- Cache `/academy.html` for 5 minutes
- Never cache `/api/lms/*` endpoints

## Data Flow

### Enrollment Flow

1. **Student submits enrollment form** → `POST /api/lms/enroll`
2. **Backend validates data** → Check required fields, payment method
3. **Encrypt PII** → `encryptPII(studentInfo)` before storage
4. **Create enrollment record** → Insert into `lms_enrollments` with `status='pending'`
5. **Log audit trail** → `logAudit('lms_enrollment_created', enrollmentId)`
6. **Send notification email** → MailChannels to student + staff
7. **Return enrollment ID** → Frontend displays confirmation

### Certificate Generation Flow

1. **Staff marks course completed** → Updates `lms_enrollments.status='completed'`
2. **Staff triggers certificate** → `POST /api/lms/certificates/generate`
3. **Backend generates verification code** → `RTA-{timestamp}-{random6digits}`
4. **Create certificate record** → Insert into `lms_certificates`
5. **Generate PDF (future)** → ReportLab with QR code, store in R2
6. **Email certificate** → Send download link to student
7. **Log audit trail** → Certificate issuance logged

### Verification Flow

1. **Employer scans QR code** → Opens `https://rosstaxprep.com/verify/{code}`
2. **Backend queries certificate** → `GET /api/lms/certificates/verify/{code}`
3. **Decrypt student name** → `decryptPII(certificate.student_name_encrypted)`
4. **Check revocation status** → `certificate.revoked === 0`
5. **Log verification** → Insert into `lms_certificate_verifications`
6. **Return certificate data** → JSON with student, program, issue date
7. **Display verification page** → Show certificate details with validity status

## Payment Integration

### Stripe Integration

```typescript
// In src/routes/lmsPayment.ts
import Stripe from 'stripe';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: enrollment.total_price_locked * 100, // Convert to cents
  currency: 'usd',
  metadata: { enrollmentId: enrollment.id }
});

// After successful payment, grant access
await env.DB.prepare(
  `UPDATE lms_enrollments 
   SET status = 'active', access_granted_at = CURRENT_TIMESTAMP 
   WHERE id = ?`
).bind(enrollmentId).run();
```

### Payment Plans

Payment plans use recurring invoices:
- **Down payment**: 20% upfront
- **Installments**: 4-12 monthly payments
- **No interest**: Clear "0% APR" messaging
- **Automatic billing**: Stripe subscriptions

## Security Measures

### PII Encryption

All sensitive student data encrypted before storage:

```typescript
import { encryptPII, decryptPII } from './utils/encryption';

// Before insert
const encrypted = encryptPII({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '555-1234',
  dateOfBirth: '1990-01-15'
});

// Store encrypted blob
await db.prepare(
  'INSERT INTO lms_enrollments (student_info_encrypted) VALUES (?)'
).bind(encrypted).run();

// On retrieval
const decrypted = decryptPII(row.student_info_encrypted);
```

### Audit Logging

Every action logged to `audit_logs` table:

```typescript
import { logAudit } from './utils/audit';

await logAudit(env, {
  action: 'lms_enrollment_created',
  resource_type: 'enrollment',
  resource_id: enrollmentId,
  user_id: studentId,
  ip_address: request.headers.get('CF-Connecting-IP'),
  details: { programCode, paymentMethod }
});
```

## Legal Compliance

### FAFSA Language

✅ **Safe Claims:**
- "Our programs may qualify for financial aid through FAFSA-approved partner institutions"
- "Students may transfer credits to accredited partner schools"
- "We provide documentation for FAFSA applications"

❌ **Avoid:**
- "We accept FAFSA funding" (only accredited schools can)
- "Direct FAFSA enrollment" (requires institutional accreditation)

### AI Disclaimer

All course pages include:

> **AI-Assisted Learning:** This program uses AI tools to enhance instruction, provide feedback, and support learning. All course content is developed by licensed tax professionals. Final assessments are reviewed and certified by human instructors. AI does not autonomously grade or issue certificates.

### Refund Policy

- **Full refund**: Within 7 days of enrollment (no questions asked)
- **Partial refund**: 8-30 days (prorated based on course progress)
- **No refund**: After 30 days or course completion >50%

## Monitoring & Maintenance

### Key Metrics

Track via Cloudflare Analytics:
- Enrollment conversion rate (page visits → completed enrollments)
- Payment success rate (enrollments → successful payments)
- Certificate issuance rate (completed courses → certificates)
- Verification requests (QR scans per certificate)

### Scheduled Tasks

Add to [wrangler.toml](wrangler.toml):

```toml
[triggers]
crons = [
  "0 2 * * *",  # Daily at 2 AM: Process pending enrollments
  "0 */6 * * *" # Every 6 hours: Send payment reminders
]
```

### Error Handling

Monitor these error types:
- Payment failures (card declined, insufficient funds)
- Encryption errors (invalid key, corrupted data)
- Email delivery failures (MailChannels errors)
- Certificate generation failures (missing enrollment data)

## Testing Checklist

- [ ] Course catalog loads correctly (`/lms/courses.json`)
- [ ] Academy landing page displays all 5 programs (`/academy.html`)
- [ ] Enrollment form validates all required fields
- [ ] PII encryption working (check D1 for encrypted blobs)
- [ ] Audit logs created for each enrollment
- [ ] Certificate generation produces unique verification codes
- [ ] Certificate verification accepts valid codes
- [ ] Certificate verification rejects invalid codes
- [ ] Payment integration test mode working (Stripe test keys)
- [ ] Email notifications sent (check MailChannels logs)
- [ ] Rate limiting enforced (test with rapid requests)
- [ ] Turnstile CAPTCHA blocks bots

## Production Readiness

### Pre-Launch

1. ✅ Database schema deployed
2. ✅ Frontend pages live
3. ✅ Backend endpoints tested
4. ✅ Payment gateways configured
   
   **Stripe Production Keys:**
   ```bash
   npx wrangler secret put STRIPE_SECRET_KEY
   # Enter: sk_live_...
   
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   # Enter: whsec_...
   ```
   
   **Square Production Keys:**
   ```bash
   npx wrangler secret put SQUARE_ACCESS_TOKEN
   # Enter: sq0atp-...
   
   npx wrangler secret put SQUARE_LOCATION_ID
   # Enter: LXXX...
   ```
   
   **PayPal Production Keys:**
   ```bash
   npx wrangler secret put PAYPAL_CLIENT_ID
   # Enter: AXX...
   
   npx wrangler secret put PAYPAL_CLIENT_SECRET
   # Enter: EXX...
   ```
5. ⚠️ Email notifications wired (need MailChannels)
6. ⚠️ Certificate PDF generation (need ReportLab integration)
7. ⚠️ QR code images generated (need qrcode library)
8. ✅ Security rules configured
9. ⚠️ Load testing completed (use [TAX-SEASON-LOAD-TEST-PLAN.md](TAX-SEASON-LOAD-TEST-PLAN.md))
10. ⚠️ Legal review (enrollment agreement, refund policy)

### Post-Launch

- Monitor enrollment rates daily
- Track payment failures and retry logic
- Review certificate verification logs for fraud patterns
- Collect student feedback via surveys
- Update course content based on outcomes
- Scale D1 database if >1000 enrollments/month

## Support & Troubleshooting

### Common Issues

**Enrollment fails with "PII encryption error"**
- Check `ENCRYPTION_KEY` is set in wrangler.toml
- Verify key is 32-byte hex string
- Test encryption utility: `npm run test -- encryption`

**Certificate verification returns 404**
- Check verification code format (RTA-{timestamp}-{6digits})
- Query D1 database: `SELECT * FROM lms_certificates WHERE verification_code = '...'`
- Verify certificate not revoked: `revoked = 0`

**Payment not processing**
- Check Stripe/Square credentials in environment
- Review payment gateway logs in dashboard
- Verify webhook endpoint configured: `/api/lms/payment/webhook`

**Email notifications not sending**
- Check MailChannels API key valid
- Verify sender email allowlisted
- Review MailChannels logs for delivery status

### Contacts

- **Technical Issues**: GitHub Issues
- **Payment Support**: Stripe/Square support
- **Legal Questions**: Consult attorney before launch
- **FAFSA Compliance**: Contact accreditation partner

## Next Steps

1. **Complete payment integration** - Wire up Stripe SDK with test mode
2. **Add certificate PDF generation** - Use PDF-lib or ReportLab
3. **Build student dashboard** - Track course progress, download certificates
4. **Implement video lessons** - Cloudflare Stream integration
5. **Create quiz system** - Instructor-reviewed assessments
6. **Add financial aid wizard** - Help students apply for FAFSA
7. **Partner with accredited school** - Enable actual FAFSA eligibility

## Documentation

- [Academy Overview](frontend/public/academy.html) - Public-facing course catalog
- [Enrollment Form](frontend/public/forms/enrollment.html) - Student application
- [Course Catalog](frontend/public/lms/courses.json) - Program details JSON
- [Database Schema](schema/lms-certificates.sql) - Certificate tables
- [Test Script](test-lms-flow.ps1) - End-to-end testing
- [Portal Bridge](PORTAL-LOGIN-BRIDGE-SYSTEM.md) - Security reassurance system

---

**Last Updated**: 2025-01-26  
**Status**: ✅ Backend Complete | ⚠️ Payment Integration Pending | ⚠️ PDF Generation Pending
