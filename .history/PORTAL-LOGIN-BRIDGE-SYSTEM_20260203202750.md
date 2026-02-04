# Client Portal Login Bridge & E-File Auto-Prep System

## Overview

This document describes the secure client portal login bridge and automatic e-file preparation workflow triggered by intake form submissions.

## Architecture Components

### 1. Portal Login Bridge (`/portal-login.html`)

**Purpose**: Reassure clients before portal access by highlighting security features

**Location**: `frontend/public/portal-login.html`

**Features Displayed**:
- Multi-Factor Authentication (MFA)
- End-to-End Encryption
- Audit Logging
- IRS-Compliant E-Filing

**User Flow**:
```
Home Page → "Client Portal Login" → /portal-login.html (Bridge) → /portal (Actual Portal)
```

**Trust Elements**:
- Visual security badges
- Feature explanations with icons
- Trust pills (256-bit encryption, IRS e-file ready, SOC 2 practices)
- Help contact information

### 2. Intake Form E-File Trigger

**Location**: `frontend/functions/api/intake.js`

**Workflow**: When a client submits an intake form:

1. **Receive Submission** - Validate form data (name, email, service type)
2. **Send Notification Email** - Via MailChannels to admin inbox
3. **Post to CRM** - Optional webhook to external CRM (Zapier, Make, etc.)
4. **Trigger E-File Prep** - POST to `/api/efile/prepare` endpoint
5. **Return Success** - Includes `portal_url` for next step

**New Response Fields**:
```json
{
  "success": true,
  "message": "Intake submission received. We'll follow up soon.",
  "id": "client-uuid",
  "next_step": "portal_login",
  "portal_url": "/portal-login.html"
}
```

### 3. E-File Preparation Endpoint

**Location**: `src/routes/efilePrep.ts`

**Endpoints**:

#### POST `/api/efile/prepare`

Creates complete workflow infrastructure when intake form is submitted.

**Request Body**:
```json
{
  "client_id": "uuid",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "5125551234",
  "service_type": "Individual Tax Preparation",
  "return_type": "1040",
  "source": "intake_form",
  "notes": "Additional details",
  "auto_start": true
}
```

**Process**:
1. Check if client exists (by email)
2. Create or update client record (PII encrypted)
3. Create tax return record (status: 'draft')
4. Create e-file transmission placeholder (status: 'created')
5. Log audit trail for compliance
6. Return workflow IDs

**Response**:
```json
{
  "success": true,
  "message": "E-file return preparation initiated",
  "data": {
    "client_id": 123,
    "return_id": "return-uuid",
    "transmission_id": "transmission-uuid",
    "status": "created",
    "next_steps": [
      "Client will receive portal access credentials via email",
      "Client can upload documents securely through portal",
      "Return will be prepared and reviewed",
      "E-file transmission will be submitted to IRS"
    ]
  }
}
```

#### GET `/api/efile/prepare/:client_id/status`

Check preparation status for a client.

**Response**:
```json
{
  "success": true,
  "data": {
    "return_id": "uuid",
    "return_type": "1040",
    "return_status": "draft",
    "tax_year": 2025,
    "transmission_id": "uuid",
    "transmission_status": "created",
    "irs_submission_id": null,
    "created_at": "2026-02-03T..."
  }
}
```

### 4. Database Schema

**Tables Used**:

#### `clients`
- `id` (INTEGER PRIMARY KEY)
- `full_name` (TEXT, encrypted)
- `email` (TEXT, encrypted, unique)
- `phone` (TEXT, encrypted, nullable)
- `status` (TEXT, e.g., 'intake_submitted')
- `source` (TEXT, e.g., 'intake_form')
- `created_at`, `updated_at` (TIMESTAMP)

#### `tax_returns`
- `id` (TEXT PRIMARY KEY, UUID)
- `client_id` (INTEGER, FK to clients)
- `tax_year` (INTEGER)
- `return_type` (TEXT, e.g., '1040', '1065')
- `status` (TEXT, e.g., 'draft', 'ready_to_file', 'filed')
- `filing_status` (TEXT, e.g., 'single', 'married_filing_jointly')
- `service_type` (TEXT)
- `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

#### `efile_transmissions`
- `id` (TEXT PRIMARY KEY, UUID)
- `return_id` (TEXT, FK to tax_returns)
- `client_id` (INTEGER, FK to clients)
- `method` (TEXT, 'DIY' or 'ERO')
- `status` (TEXT, e.g., 'created', 'transmitting', 'accepted')
- `irs_submission_id` (TEXT, nullable)
- `ack_code` (TEXT, nullable)
- `ack_message` (TEXT, nullable)
- `environment` (TEXT, 'test' or 'production')
- `created_at`, `updated_at` (TIMESTAMP)

## Security & Compliance

### PII Encryption

All sensitive client data is encrypted before storage using `encryptPII()` utility:
- Client name
- Email address
- Phone number

### Audit Logging

Every workflow action is logged via `logAudit()`:
- Client creation
- Return creation
- E-file preparation initiation
- All with IP address tracking

### Access Control

E-file preparation endpoint accepts requests from:
- Frontend Pages Functions (same domain)
- Worker backend with API key authentication

## Environment Variables

### Frontend (Cloudflare Pages)

**Required**:
- `TO_EMAIL` - Admin email for intake notifications
- `WORKER_API_URL` - Worker endpoint (default: auto-detected)

**Optional**:
- `WORKER_API_KEY` - API key for worker authentication
- `FROM_EMAIL` - Sender email for MailChannels
- `FROM_NAME` - Sender name
- `CRM_WEBHOOK_URL` - External CRM webhook
- `ALLOWED_ORIGINS` - CORS origins

### Worker (Cloudflare Workers)

**Bindings**:
- `DB` - D1 database
- `DOCUMENTS_BUCKET` - R2 for document storage
- `ENCRYPTION_KEY` - PII encryption key

## URL Routing

### Cloudflare Pages Redirects (`_redirects`)

```
/portal           → /portal-login.html
/login            → /portal-login.html
/client-login     → /portal-login.html
```

### Worker Routes

```
POST /api/efile/prepare              → efilePrepRouter
GET  /api/efile/prepare/:id/status   → efilePrepRouter
```

## Testing

### Test Intake Form Submission

```bash
curl -X POST https://your-site.pages.dev/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Client",
    "email": "test@example.com",
    "phone": "5125551234",
    "service": "Individual Tax Preparation",
    "notes": "Test submission"
  }'
```

**Expected**: 
- Email sent to admin
- E-file prep initiated
- Response includes `portal_url`

### Test E-File Preparation

```bash
curl -X POST https://worker.workers.dev/api/efile/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test-uuid",
    "client_name": "Test Client",
    "client_email": "test@example.com",
    "return_type": "1040",
    "auto_start": true
  }'
```

**Expected**:
- Client record created
- Return record created
- Transmission placeholder created
- Audit log entry

## Deployment

### Deploy Frontend

```bash
cd frontend
npm run deploy
```

### Deploy Worker

```bash
npm run deploy
```

### Verify Routes

1. Visit `https://your-site.pages.dev/portal` - Should show bridge page
2. Submit test intake form - Check admin email
3. Check D1 database for new records:
   ```bash
   npx wrangler d1 execute DB --command "SELECT * FROM clients ORDER BY created_at DESC LIMIT 5"
   ```

## User Journey

### Complete Flow

1. **Client visits website** → Fills out intake form
2. **Intake submitted** → Email sent, CRM notified, e-file prep triggered
3. **Client receives email** → "We've received your submission"
4. **Staff creates portal account** → Sends credentials to client
5. **Client clicks portal link** → Sees security bridge page
6. **Client continues to portal** → Logs in with MFA
7. **Client uploads documents** → Encrypted, logged
8. **Staff prepares return** → Using uploaded docs
9. **Return ready** → Client reviews in portal
10. **Client approves** → E-file transmitted to IRS
11. **Acknowledgment received** → Client notified of acceptance

## Troubleshooting

### Intake form submits but no e-file prep

**Check**:
- `WORKER_API_URL` environment variable
- Worker logs for errors
- API key authentication if configured

### Portal login bridge not loading

**Check**:
- `_redirects` file deployed
- `/portal-login.html` exists in `frontend/public/`
- Cloudflare Pages build succeeded

### E-file prep returns 500 error

**Check**:
- D1 database binding configured
- `ENCRYPTION_KEY` environment variable set
- Database schema migrated (run `schema.sql`)

## Next Steps

### Future Enhancements

1. **Automated Portal Invites** - Send credentials automatically after intake
2. **Status Webhooks** - Notify client of e-file status changes
3. **Document Checklist** - Auto-generate based on service type
4. **Payment Integration** - Collect payment before e-file transmission
5. **IRS Refund Tracker** - Real-time refund status in portal

## Support

**Questions or Issues?**
- Email: info@rosstaxprepandbookkeeping.com
- Phone: (512) 489-6749
- Documentation: See `DOCUMENTATION-INDEX.md` for full system docs
