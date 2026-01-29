# CRM Backend Setup Guide

## Overview
Complete CRM system with Cloudflare Access protection, D1 database, and R2 document storage.

---

## 1. Database Setup (D1)

### Execute Migration
Run the D1 migration to add intake status tracking and documents table:

```bash
npx wrangler d1 execute ross-tax-prep-db < frontend/schema-migration.sql
```

**What it does:**
- Adds `status` (default: 'New') and `last_status_at` columns to intakes
- Creates documents table with R2 key references
- Creates index for fast intake lookups

### Verify
```bash
npx wrangler d1 execute ross-tax-prep-db "SELECT * FROM intakes LIMIT 1;"
npx wrangler d1 execute ross-tax-prep-db "SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 2. R2 Bucket Setup

### Create Bucket
1. Cloudflare Dashboard → R2
2. Create bucket: **rtb-docs**
3. Jurisdiction: EU (or your preference)
4. Lifecycle: Optional (auto-delete after 90 days if desired)

### Update wrangler.toml
Already configured with:
```toml
[[r2_buckets]]
binding = "DOCS"
bucket_name = "rtb-docs"
```

### Test Upload
```bash
# After deployment, test via API:
curl -X POST https://your-pages-url.pages.dev/api/docs/upload \
  -F "intakeId=test-id-123" \
  -F "file=@document.pdf"
```

---

## 3. Cloudflare Access Setup

### Create Access Policy

1. **Cloudflare Dashboard** → Zero Trust → Access → Applications
2. **Add Application**
   - **Name:** Ross Tax CRM
   - **Application Type:** Self-hosted
   - **Subdomain:** crm (or your preference)
   - **Domain:** yourdomain.com

3. **Allowed Users**
   - **Auth:** Email (SSO)
   - **Policies:** Allow all authenticated users
   - OR restrict to specific emails

4. **Protect Paths**
   - `/crm*` (CRM page)
   - `/api/crm/*` (CRM API endpoints)
   - `/api/docs/*` (Document endpoints)

### JWT Token Validation

The middleware (`frontend/functions/_middleware.js`) automatically:
- Checks for `CF-Access-Jwt-Assertion` header
- Returns 401 if missing
- Allows requests from authenticated Access users

**Cloudflare automatically injects this header** when users pass Access auth.

---

## 4. Environment Variables

### Required (Set in Cloudflare Pages Settings)

**Dashboard → Pages → Project Settings → Environment Variables**

| Variable | Example | Purpose |
|----------|---------|---------|
| `TO_EMAIL` | accounting@rosstaxprep.com | Receives new intake submissions |
| `FROM_EMAIL` | no-reply@rosstaxprep.com | Email sender address (MailChannels) |
| `FROM_NAME` | Ross Tax & Bookkeeping | Email sender display name |
| `CRM_WEBHOOK_URL` | (optional) | External CRM webhook for intakes |

### Example .env (for testing locally)
```bash
TO_EMAIL=admin@rosstaxprep.com
FROM_EMAIL=no-reply@rosstaxprep.com
FROM_NAME=Ross Tax & Bookkeeping
```

---

## 5. API Endpoints

### CRM Endpoints (Protected by Access)

#### List Intakes
```
GET /api/crm/list

Response:
{
  "ok": true,
  "results": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "service": "Individual Tax Prep",
      "status": "New",
      "notes": "...",
      "created_at": "2026-01-28T10:00:00Z"
    }
  ]
}
```

#### Update Intake Status
```
POST /api/crm/update-status

Body:
{
  "intakeId": "uuid",
  "status": "In Progress"
}

Response:
{
  "ok": true
}

Side Effects:
- Updates intake.status and intake.last_status_at in D1
- Sends email to client with status update
```

#### Export to CSV
```
GET /api/crm/export.csv

Response: Attachment (intakes.csv)
Columns: id, full_name, email, phone, service, status, created_at
```

### Document Endpoints (Protected by Access)

#### Upload Document
```
POST /api/docs/upload
Content-Type: multipart/form-data

Form Data:
- intakeId: (required) intake UUID
- file: (required) binary file

Response:
{
  "ok": true,
  "documentId": "uuid",
  "key": "intakes/intake-id/doc-id-filename.ext"
}

Storage: R2 bucket `rtb-docs` under intakes/{intakeId}/
Database: Recorded in documents table
```

#### List Documents
```
GET /api/docs/list?intakeId=uuid

Response:
{
  "ok": true,
  "results": [
    {
      "id": "uuid",
      "intake_id": "uuid",
      "filename": "tax-return.pdf",
      "content_type": "application/pdf",
      "size": 2048000,
      "created_at": "2026-01-28T10:00:00Z"
    }
  ]
}
```

---

## 6. Frontend Deployment

### Deploy to Cloudflare Pages

```bash
cd frontend
npm run build
npm run deploy
```

Or with specific environment:
```bash
npm run deploy -- --env production
```

### What Gets Deployed
- React SPA (Vite build output)
- API functions (routes, CRM endpoints, document handlers)
- Middleware (_middleware.js for Access validation)

---

## 7. Testing Workflow

### 1. Test Intake Form
```
1. Visit https://your-pages-url.pages.dev/intake
2. Submit form with test data
3. Check TO_EMAIL for submission email
4. Verify intake in database
```

### 2. Test CRM Access
```
1. Visit https://crm.yourdomain.com (or /crm route)
2. Cloudflare Access login prompt appears
3. Authenticate with email
4. Access CRM dashboard
5. Can view intakes, upload docs, export CSV
```

### 3. Test Status Update
```
1. Select intake in CRM
2. Change status dropdown
3. Check client email for status notification
4. Verify database update
```

### 4. Test Document Upload
```
1. Select intake
2. Click "Upload Document"
3. Choose PDF/file
4. Verify in R2 bucket
5. Verify in documents table
6. Confirm visible in "Documents" list
```

---

## 8. Security Checklist

- [ ] D1 database configured with proper bindings
- [ ] R2 bucket created and bound in wrangler.toml
- [ ] Cloudflare Access policy created for /crm and /api/crm/* routes
- [ ] Middleware (_middleware.js) validates JWT on protected routes
- [ ] Environment variables set in Cloudflare Pages
- [ ] Email credentials (MailChannels) working
- [ ] CORS headers properly configured for intake API
- [ ] SSL/TLS enabled on all custom domains
- [ ] Rate limiting (optional, can be added to middleware)

---

## 9. Troubleshooting

### "Unauthorized" on CRM Access
**Problem:** Getting 401 when accessing /crm
**Solution:** 
- Verify Cloudflare Access policy is active
- Clear browser cache and cookies
- Re-authenticate with Access login

### Document Upload Fails
**Problem:** Upload returns 500 error
**Solution:**
- Check R2 bucket exists and is bound in wrangler.toml
- Verify DATABASE binding in wrangler.toml
- Check file size isn't exceeding limits
- Review function logs: `npx wrangler pages deployment tail`

### Status Update Email Not Sent
**Problem:** Status updates but client email missing
**Solution:**
- Verify TO_EMAIL and FROM_EMAIL environment variables
- Check MailChannels API is accessible
- Review function logs for sendMailChannels errors
- Ensure intake.email is valid

### Database Migration Fails
**Problem:** SQL errors when running migration
**Solution:**
- Drop and recreate D1 if corrupted: `npx wrangler d1 delete`
- Verify SQL syntax in schema-migration.sql
- Run migrations line-by-line to identify issue

---

## 10. Scaling Considerations

- **Document Storage:** R2 bucket can hold unlimited files; set lifecycle policies to archive old docs
- **Database:** D1 scales automatically; monitor with analytics dashboard
- **Email Rate:** MailChannels free tier: 100k/month; upgrade tier if needed
- **Access Auth:** Cloudflare handles infinite auth sessions; no scaling limit

---

**Setup Complete!** Your CRM is ready for production use.
