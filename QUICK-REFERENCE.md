# QUICK REFERENCE CARD
**Worker API:** https://ross-tax-prep-worker1.condre.workers.dev

---

## 🔑 YOUR TOKENS

```
OWNER_TOKEN:
82vz7cfHKH89Gd5i4IuitfeA9REnE8D1NubdL9QMAkUDLEbydxrFjFOjB8QsGi39

STAFF_TOKEN:
TMeCG8qXmMB1njvPZCFYzfTas4Zc3B7mN4Bx0pX4c3ZLmREjVZZTRNkYSdGriOns

CLIENT_REF_PEPPER:
yUbnmvETJRqMF8ysiGhdAroGbYJAJh8iAF6fjFqgA4rIvNGRi2HoicT7gWTwKekR
```

**⚠️ Save these securely - they're only shown once!**

---

## 📡 QUICK API TESTS

### Test 1: Health Check (No Auth)
```
https://ross-tax-prep-worker1.condre.workers.dev/health
```
Expected: `{"status":"ok"}`

### Test 2: Staff Endpoint (PowerShell)
```powershell
$headers = @{ Authorization = "Bearer TMeCG8qXmMB1njvPZCFYzfTas4Zc3B7mN4Bx0pX4c3ZLmREjVZZTRNkYSdGriOns" }
Invoke-RestMethod -Uri "https://ross-tax-prep-worker1.condre.workers.dev/api/alerts?open=1" -Headers $headers
```

### Test 3: Owner Endpoint (PowerShell)
```powershell
$headers = @{ Authorization = "Bearer 82vz7cfHKH89Gd5i4IuitfeA9REnE8D1NubdL9QMAkUDLEbydxrFjFOjB8QsGi39" }
Invoke-RestMethod -Uri "https://ross-tax-prep-worker1.condre.workers.dev/api/kpis" -Headers $headers
```

---

## ⏰ CRON TRIGGER

**Schedule:** `0 11 * * *`  
**Runs:** Daily at 11 AM UTC (6 AM EST / 5 AM CST)  
**Does:** Checks consents, generates alerts

---

## 🗄️ D1 BINDING

**Variable Name:** `DB`  
**Database:** `ross_tax_prep_db`

---

## 📊 RETOOL SETUP

### Staff Resource
- Base URL: `https://ross-tax-prep-worker1.condre.workers.dev`
- Header: `Authorization: Bearer TMeCG8qXmMB1njvPZCFYzfTas4Zc3B7mN4Bx0pX4c3ZLmREjVZZTRNkYSdGriOns`

### Owner Resource
- Base URL: `https://ross-tax-prep-worker1.condre.workers.dev`
- Header: `Authorization: Bearer 82vz7cfHKH89Gd5i4IuitfeA9REnE8D1NubdL9QMAkUDLEbydxrFjFOjB8QsGi39`

---

## 🎯 STAFF ENDPOINTS

```
GET  /api/alerts?open=1
GET  /api/queue?queue=FED_NO_STATE
PATCH /api/queue/{id}              Body: {"status":"DONE"}
POST /api/alerts/{id}/resolve      Body: {"resolved_by":"Condre"}
POST /api/consents                 Body: {"last_name":"Smith","l4ssn":"1234","consent_type":"PATHWARD_CONSENT","signed_by":"Condre"}
```

---

## 📈 OWNER ENDPOINTS

```
GET  /api/kpis
GET  /api/analytics/product-mix
GET  /api/analytics/zero-efile
```

---

## ✅ SETUP CHECKLIST

- [ ] Add 3 secrets to Worker (OWNER_TOKEN, STAFF_TOKEN, CLIENT_REF_PEPPER)
- [ ] Add Cron trigger (0 11 * * *)
- [ ] Verify D1 binding (DB → ross_tax_prep_db)
- [ ] Test health endpoint
- [ ] Test auth (should fail without token)
- [ ] Test staff endpoint with token
- [ ] Test owner endpoint with token
- [ ] Configure Retool resources
- [ ] Save tokens in password manager
- [ ] Delete this file (has tokens!)

---

**📚 Full Docs:**
- [COMPLETE-SETUP-CHECKLIST.md](COMPLETE-SETUP-CHECKLIST.md) - Step-by-step guide
- [API-ENDPOINTS.md](API-ENDPOINTS.md) - Complete API reference
- [CLOUDFLARE-WORKER-SETUP.md](CLOUDFLARE-WORKER-SETUP.md) - Detailed setup

**🧪 Test:** `.\test-api-endpoints.ps1`

---

**⚠️ DELETE THIS FILE AFTER SAVING TOKENS!**
