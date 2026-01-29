# 🚀 Complete CRM Deployment Guide

## Phase 1: Deploy to Cloudflare Pages

### Command
```bash
cd frontend
npm run deploy
```

This will:
- Build Vite (creates dist/)
- Deploy functions/ to Pages
- Deploy dist/ to CDN
- Return your Pages URL (e.g., `ross-tax-prep-frontend.pages.dev`)

---

## Phase 2: Set Up Cloudflare Access

### Step 1: Create Access Application
1. Go to **Cloudflare Dashboard**
2. Select your account
3. Go to **Zero Trust** → **Access** → **Applications**
4. Click **+ Add an application**

### Step 2: Configure Application
Fill in these fields:
- **Application name:** `Ross Tax CRM`
- **Application type:** Self-hosted
- **Session duration:** 24 hours (default)
- **Subdomain:** `crm` (or your choice)
- **Domain:** `yourdomain.com`

Click **Next**

### Step 3: Set Authentication Policy
- **Action:** Allow
- **Identity provider:** Email
- **Emails:** Enter your email(s)
  - Example: `accounting@rosstaxprep.com`
  - Can add multiple with comma separation

Click **Next**

### Step 4: Protect Routes
In **Policies**, add protected routes:

**Route 1:**
- Path: `/crm*`

**Route 2:**
- Path: `/api/crm*`

**Route 3:**
- Path: `/api/docs*`

Each should have the same policy (Allow → Your email(s))

Click **Save**

### After Saving
Cloudflare will generate:
- A **CF-Access-Application-UUID**
- A **CF-Access-Auth-Domain**
- You can access via: `https://crm.yourdomain.com`

---

## Phase 3: Set Environment Variables

### In Cloudflare Pages Dashboard

1. Go to **Pages** → **ross-tax-prep-frontend** (your project)
2. Click **Settings** → **Environment variables**
3. Click **+ Add environment variable**

### Add These 3 Variables

#### Variable 1: TO_EMAIL
```
Variable name: TO_EMAIL
Value: accounting@rosstaxprep.com
```
(receives new intake submissions)

#### Variable 2: FROM_EMAIL
```
Variable name: FROM_EMAIL
Value: no-reply@rosstaxprep.com
```
(sender email for MailChannels)

#### Variable 3: FROM_NAME
```
Variable name: FROM_NAME
Value: Ross Tax & Bookkeeping
```
(sender display name)

### Optional: CRM_WEBHOOK_URL
```
Variable name: CRM_WEBHOOK_URL
Value: https://your-crm-webhook-url.com/api/intake
```
(only if you have external CRM integration)

Click **Save** after each variable.

---

## Verification Checklist

After completing all 3 phases, verify:

### ✅ Pages Deployment
- [ ] Visit `https://ross-tax-prep-frontend.pages.dev`
- [ ] Homepage loads
- [ ] Navigate to `/intake` → form loads
- [ ] Submit test intake → success page shows

### ✅ Cloudflare Access
- [ ] Visit `/crm` route
- [ ] Access login prompt appears
- [ ] Login with your email
- [ ] One-time code email arrives
- [ ] CRM dashboard loads after auth

### ✅ API Endpoints
- [ ] `GET /api/crm/intakes` (should return intakes JSON)
- [ ] `POST /api/crm/update-status` (change status, client email sent)
- [ ] `POST /api/docs/upload` (upload document)
- [ ] `GET /api/crm/export.csv` (download CSV)

---

## Your CRM URLs

After deployment:

| Page | URL |
|------|-----|
| Public Home | `https://ross-tax-prep-frontend.pages.dev/` |
| Public Services | `https://ross-tax-prep-frontend.pages.dev/services` |
| Public Form | `https://ross-tax-prep-frontend.pages.dev/intake` |
| **CRM (Protected)** | `https://crm.yourdomain.com` |
| **CRM Alt (Protected)** | `https://ross-tax-prep-frontend.pages.dev/crm` |

---

## Troubleshooting

### Pages Deploy Issues
- **"Unauthorized"**: Check Wrangler auth: `npx wrangler login`
- **"Account not found"**: Verify account selected in Wrangler config
- **Build errors**: Check `npm run build` locally first

### Access Login Issues
- **"Not authenticated"**: Check email is added to Access policy
- **"Application not found"**: Verify Access app created
- **Redirect loop**: Clear browser cookies, try incognito mode

### Environment Variables Not Working
- **Status emails not sent**: Verify TO_EMAIL, FROM_EMAIL set
- **CRM returns 500**: Check env vars in Pages Settings (not local .env)
- **Variables not updating**: May need to redeploy after setting variables
  ```bash
  npm run deploy
  ```

---

## Security Notes

✅ **Cloudflare Access** provides email-based SSO  
✅ **Middleware** validates JWT on all CRM routes  
✅ **R2 Storage** encrypts documents at rest  
✅ **D1 Database** has automatic backups  
✅ **MailChannels** encrypts emails in transit  

---

## Support

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Cloudflare Access:** https://developers.cloudflare.com/cloudflare-one/access/
- **D1 Database:** https://developers.cloudflare.com/d1/

---

**You're all set!** Your production CRM system is ready. 🎉
