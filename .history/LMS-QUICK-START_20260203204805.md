# 🚀 Ross Tax Academy LMS - Quick Start Guide

## 5-Minute Setup

### 1. Deploy Database

```powershell
# Local (development)
npx wrangler d1 execute DB --file=schema/lms-pricing-enrollment.sql --local
npx wrangler d1 execute DB --file=schema/lms-certificates.sql --local

# Production
npx wrangler d1 execute DB --file=schema/lms-pricing-enrollment.sql
npx wrangler d1 execute DB --file=schema/lms-certificates.sql
```

### 2. Start Development Server

```powershell
npm run dev
```

### 3. Test LMS Flow

```powershell
# In new terminal
.\test-lms-flow.ps1
```

### 4. Access Dashboards

- **Academy**: http://localhost:8787/academy.html
- **Student Dashboard**: http://localhost:8787/student/dashboard.html
- **Admin Dashboard**: http://localhost:8787/admin/dashboard.html
- **Certificate Verification**: http://localhost:8787/verify.html

---

## 📋 Key Endpoints

### Public Endpoints
- `GET /lms/courses.json` - Course catalog
- `GET /academy.html` - Landing page
- `GET /forms/enrollment.html` - Enrollment form
- `GET /verify.html?cert_id={code}` - Certificate verification

### API Endpoints
- `POST /api/lms/enroll` - Submit enrollment
- `GET /api/lms/enrollments/:id` - Get enrollment details
- `POST /api/lms/certificates/generate` - Issue certificate (instructor)
- `GET /api/lms/certificates/verify/:code` - Verify certificate
- `POST /api/lms/certificates/:id/revoke` - Revoke certificate (admin)
- `GET /api/lms/certificates/:id/download` - Download certificate

---

## 🔐 Default Roles

| Role | Access Level | Login |
|------|--------------|-------|
| **Super Admin** | Full system access | admin@rosstaxprep.com |
| **Instructor** | Grade, issue certificates | instructor@rosstaxprep.com |
| **Student** | Own courses & certificates | student@rosstaxprep.com |

---

## 💳 Test Payment

**Voucher Code**: `FREE-LMS-TEST-100` (100% off - Stripe test mode only)

**Test Cards**:
- Valid: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 9995`

---

## 📄 Certificate Testing

1. **Generate Certificate**:
   ```bash
   curl -X POST http://localhost:8787/api/lms/certificates/generate \
     -H "Content-Type: application/json" \
     -d '{"enrollmentId":"TEST-123","completionDate":"2026-02-03"}'
   ```

2. **Verify Certificate**:
   ```bash
   curl http://localhost:8787/api/lms/certificates/verify/RTA-1738635441-123456
   ```

3. **Revoke Certificate**:
   ```bash
   curl -X POST http://localhost:8787/api/lms/certificates/RTA-1738635441-123456/revoke \
     -H "Content-Type: application/json" \
     -d '{"reason":"Test revocation","revokedBy":"ADMIN-001"}'
   ```

---

## 📊 Check Status

```powershell
# View enrolled students
npx wrangler d1 execute DB --command "SELECT * FROM lms_enrollments LIMIT 10"

# View issued certificates
npx wrangler d1 execute DB --command "SELECT * FROM lms_certificates LIMIT 10"

# View audit logs
npx wrangler d1 execute DB --command "SELECT * FROM audit_log WHERE action LIKE 'lms_%' ORDER BY created_at DESC LIMIT 20"
```

---

## 🐛 Troubleshooting

### "PII encryption error"
```powershell
# Verify encryption key is set
npx wrangler secret list
```

### "Certificate not found"
```powershell
# Check certificate exists
npx wrangler d1 execute DB --command "SELECT * FROM lms_certificates WHERE verification_code = 'RTA-...'"
```

### "Payment processing failed"
```powershell
# Check Stripe configuration
npx wrangler secret list | grep STRIPE
```

---

## 📚 Documentation

- [Complete Implementation Guide](LMS-INTEGRATED-WORKFLOW-COMPLETE.md)
- [Deployment Guide](LMS-DEPLOYMENT-COMPLETE.md)
- [Production Status Report](LMS-PRODUCTION-STATUS-REPORT.md)
- [Implementation Summary](LMS-IMPLEMENTATION-SUMMARY.md)

---

## ✅ Production Checklist

- [ ] Database deployed
- [ ] Environment variables set
- [ ] Worker deployed
- [ ] Frontend deployed
- [ ] Stripe configured
- [ ] Email configured (MailChannels)
- [ ] Cloudflare security enabled
- [ ] Test enrollment completed
- [ ] Certificate verification tested
- [ ] Load testing completed

---

**Need Help?** See [LMS-PRODUCTION-STATUS-REPORT.md](LMS-PRODUCTION-STATUS-REPORT.md) for complete system overview.
