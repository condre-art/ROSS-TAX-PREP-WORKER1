# Quick Reference Card

## 🚀 Deploy Now
```bash
cd frontend
npm run deploy
```

## 📋 CRM Setup (3 Steps)

### Step 1: Database
```bash
npx wrangler d1 execute ross-tax-prep-db < frontend/schema-migration.sql
```

### Step 2: Cloudflare Access
1. Dashboard → Zero Trust → Access → Applications
2. New App: "Ross Tax CRM"
3. Protect: `/crm*`, `/api/crm/*`, `/api/docs/*`
4. Auth: Email SSO

### Step 3: Environment Variables
Set in Cloudflare Pages → Project Settings:
```
TO_EMAIL=accounting@rosstaxprep.com
FROM_EMAIL=no-reply@rosstaxprep.com
FROM_NAME=Ross Tax & Bookkeeping
```

## 📁 New Files Created

| File | Purpose |
|------|---------|
| `frontend/src/pages/CRM.jsx` | Intake manager UI |
| `frontend/functions/api/crm/list.js` | List intakes |
| `frontend/functions/api/crm/update-status.js` | Update + email |
| `frontend/functions/api/crm/export.csv.js` | Export CSV |
| `frontend/functions/api/docs/upload.js` | Upload to R2 |
| `frontend/functions/api/docs/list.js` | List documents |
| `frontend/functions/_middleware.js` | Access validation |
| `frontend/schema-migration.sql` | D1 migration |
| `frontend/wrangler.toml` | Updated bindings |

## 🔑 Key Features

✅ Email SSO (Cloudflare Access)  
✅ Intake table with filtering  
✅ Status updates with email notifications  
✅ Document upload to R2  
✅ CSV export  
✅ TypeScript validation  
✅ Mobile responsive  
✅ Production ready  

## 🌐 Routes

- `/` Home
- `/services` Services
- `/intake` Client form
- `/success` Confirmation
- `/crm` Client manager (Access protected)

## 📞 API Endpoints

| Method | Path | Protected |
|--------|------|-----------|
| POST | /api/intake | No |
| GET | /api/crm/list | Yes |
| POST | /api/crm/update-status | Yes |
| GET | /api/crm/export.csv | Yes |
| POST | /api/docs/upload | Yes |
| GET | /api/docs/list | Yes |

## ✨ Frontend Build Status

```
✓ 39 modules built
✓ 11.18 kB CSS (gzipped)
✓ 178.04 kB JS (gzipped)
✓ Ready to deploy
```

## 🔒 Security

- Cloudflare Access JWT on protected routes
- R2 bucket for encrypted storage
- D1 automatic backups
- MailChannels for email
- CORS validation on intake form

## 📖 Documentation

- **Setup Guide:** `frontend/CRM-SETUP.md` (complete)
- **Summary:** `CRM-IMPLEMENTATION-SUMMARY.md` (overview)
- **This Card:** `CRM-QUICK-REFERENCE.md` (cheatsheet)

## ⚡ One-Liner Deploy

```bash
cd frontend && npm run deploy && echo "✅ Frontend deployed!"
```

## 🧪 Test After Deploy

1. Go to `/intake` → Submit form
2. Go to `/crm` → Login via Cloudflare Access
3. See intake in table
4. Upload document
5. Change status → Client gets email ✅

---

**Full setup guide:** See `frontend/CRM-SETUP.md`
