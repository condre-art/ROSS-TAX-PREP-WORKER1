# ✅ CRM Complete: Deploy Now

## Quick Start (3 Steps)

### 1️⃣ Deploy to Cloudflare Pages

```bash
cd frontend
npm run deploy
```

This builds Vite + deploys functions to Pages.

### 2️⃣ Set Up Cloudflare Access (5 min)

1. **Cloudflare Dashboard** → Zero Trust → Access → Applications
2. **+ Add an application**
   - Name: `Ross Tax CRM`
   - Type: Self-hosted
   - Subdomain: `crm` (or your choice)
   - Domain: `yourdomain.com`

3. **Configure Access Policy**
   - Allow: Your email(s)
   - Auth method: Email (SSO)

4. **Protect these routes:**
   ```
   /crm*
   /api/crm*
   /api/docs*
   ```

5. **Deploy policy** ✅

### 3️⃣ Set Environment Variables

Cloudflare Pages → Project Settings → Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `TO_EMAIL` | accounting@rosstaxprep.com | ✅ Yes |
| `FROM_EMAIL` | no-reply@rosstaxprep.com | ✅ Yes |
| `FROM_NAME` | Ross Tax & Bookkeeping | ✅ Yes |
| `CRM_WEBHOOK_URL` | (your CRM webhook) | ❌ Optional |

---

## ✨ What You Get

### Frontend Routes
- `/` - Public home
- `/services` - Public services
- `/intake` - Public form
- `/success` - Public confirmation
- `/crm` - **Protected CRM (Cloudflare Access)**

### CRM Features
✅ View all client intakes in table  
✅ Change status (dropdown)  
✅ Status changes email client  
✅ Upload documents per intake  
✅ Export all intakes to CSV  
✅ Protected by Cloudflare Access (email SSO)  

### API Endpoints (All Protected by Cloudflare Access)

**GET /api/crm/intakes**
```json
[
  {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "service": "Individual Tax Prep",
    "status": "New",
    "created_at": "2026-01-28T..."
  }
]
```

**POST /api/crm/update-status**
```json
{ "intakeId": "uuid", "status": "In Progress" }
```
→ Client receives email notification

**POST /api/docs/upload**
```
Form data: intakeId, file
→ Stored in R2 bucket
```

**GET /api/crm/export.csv**
→ Download all intakes as CSV

---

## 🔒 Security

✅ **Cloudflare Access** protects `/crm*`, `/api/crm*`, `/api/docs*`  
✅ **JWT validation** in `_middleware.js`  
✅ **Intake form** (public) uses CORS validation  
✅ **Email notifications** via MailChannels API  
✅ **R2 storage** for document encryption at rest  
✅ **D1 database** with automatic backups  

---

## 📋 Database Setup

The intakes table already exists (from your form submission).

**To add status tracking, run this migration:**

```bash
npx wrangler d1 execute ross-tax-prep-db "
ALTER TABLE intakes ADD COLUMN status TEXT DEFAULT 'New';
ALTER TABLE intakes ADD COLUMN last_status_at TEXT;
"
```

**For document tracking, run:**

```bash
npx wrangler d1 execute ross-tax-prep-db "
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_documents_intake_id ON documents(intake_id);
"
```

---

## 🚀 Deploy Checklist

- [ ] Run `npm run deploy` in frontend/
- [ ] Create Cloudflare Access application
- [ ] Protect `/crm*`, `/api/crm*`, `/api/docs*` routes
- [ ] Set TO_EMAIL, FROM_EMAIL, FROM_NAME variables
- [ ] Test: Submit intake form
- [ ] Test: Login to /crm via Access
- [ ] Test: Change intake status (check email)
- [ ] Test: Upload document
- [ ] Test: Export CSV

---

## 🧪 Testing

### 1. Submit Intake (Public)
```
1. Visit https://your-pages.pages.dev/intake
2. Fill form, submit
3. Check TO_EMAIL for confirmation
```

### 2. Access CRM (Protected)
```
1. Visit https://crm.yourdomain.com (or /crm route)
2. Cloudflare Access login prompt
3. Enter your email
4. Get one-time code, verify
5. Access granted to CRM
```

### 3. Update Status
```
1. View intake in CRM table
2. Change status dropdown
3. Check client email for notification
```

### 4. Upload Document
```
1. Select intake row
2. Choose file in "Docs" column
3. Verify in R2 bucket
4. Verify in D1 documents table
```

### 5. Export CSV
```
1. Click "Export CSV" button
2. Download intakes.csv
3. Open in Excel/Sheets
```

---

## 📊 Build Stats

```
✓ 39 modules
✓ 8.51 kB CSS (gzipped)
✓ 173.64 kB JS (gzipped)
✓ Total: ~60 kB (gzipped)
✓ Build time: 654ms
```

---

## 📁 Files Created/Updated

**New Components:**
- `frontend/src/pages/CRM.jsx` - CRM UI (simplified)
- `frontend/functions/api/crm/intakes.js` - List intakes
- `frontend/functions/_middleware.js` - Access validation

**Updated:**
- `frontend/src/App.jsx` - Added /crm route + import
- `frontend/src/index.css` - Added CRM table styles
- `frontend/wrangler.toml` - D1 + R2 bindings

**Existing (reused):**
- `frontend/functions/api/crm/update-status.js` - Status + email
- `frontend/functions/api/crm/export.csv.js` - CSV export
- `frontend/functions/api/docs/upload.js` - Document upload
- `frontend/functions/api/docs/list.js` - List documents

---

## 🔑 Key Files Reference

| File | Purpose |
|------|---------|
| [CRM.jsx](frontend/src/pages/CRM.jsx) | Client manager UI |
| [_middleware.js](frontend/functions/_middleware.js) | Access JWT check |
| [intakes.js](frontend/functions/api/crm/intakes.js) | GET intakes |
| [update-status.js](frontend/functions/api/crm/update-status.js) | POST status + email |
| [export.csv.js](frontend/functions/api/crm/export.csv.js) | GET CSV |
| [upload.js](frontend/functions/api/docs/upload.js) | POST document |
| [list.js](frontend/functions/api/docs/list.js) | GET documents |

---

## 💡 Tips

- **Status dropdown updates immediately** - no refresh needed
- **Email sent automatically** when status changes
- **CSV includes all intakes** - use for reporting
- **Documents stored by intake ID** - organized in R2
- **Access handles authentication** - no login code needed

---

## ❓ Troubleshooting

**"Unauthorized" on /crm?**
- Check Cloudflare Access policy is active
- Clear cookies + cache
- Re-authenticate with Access

**Upload fails?**
- Check R2 bucket exists
- Verify D1 documents table created
- Check browser console for errors

**Status email not sent?**
- Verify TO_EMAIL, FROM_EMAIL environment variables
- Check MailChannels is accessible
- Review function logs

**Can't access /api/crm/intakes?**
- Verify _middleware.js is deployed
- Check Cloudflare Access JWT header being sent
- Test with authenticated session

---

**Ready to go live? Run:** `npm run deploy`

**Need help?** See `frontend/CRM-SETUP.md` for complete guide.
