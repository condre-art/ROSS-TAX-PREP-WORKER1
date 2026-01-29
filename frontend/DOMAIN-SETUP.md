# Custom Domain Setup for Ross Tax & Bookkeeping

## 🎯 Recommended Domain Structure

### Main Website
**Domain:** `www.rosstaxprep.com` or `rosstaxprep.com`  
**Purpose:** Public-facing marketing site  
**Points to:** Cloudflare Pages (main frontend)

### Client Application Portal
**Domain:** `app.rosstaxprep.com`  
**Purpose:** Client dashboard, file management, refund tracking  
**Points to:** Cloudflare Pages (client portal build)

### Intake Form
**Domain:** `intake.rosstaxprep.com`  
**Purpose:** Client onboarding and intake submissions  
**Points to:** Main site with `/intake` path or dedicated form builder

### Client Portal (Login)
**Domain:** `portal.rosstaxprep.com`  
**Purpose:** Secure client login and document access  
**Points to:** Cloudflare Pages (authenticated portal)

### API Backend
**Domain:** `api.rosstaxprep.com`  
**Purpose:** REST API for all services  
**Points to:** Cloudflare Worker `ross-tax-prep-worker1`

---

## 📋 Cloudflare Pages Setup

### Step 1: Deploy to Cloudflare Pages

```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name=ross-tax-prep-frontend
```

### Step 2: Add Custom Domain in Cloudflare Dashboard

1. Go to **Cloudflare Pages** → Your project
2. Click **Custom domains**
3. Add domain: `www.rosstaxprep.com`
4. Cloudflare will automatically create DNS records

### Step 3: Configure DNS Records

Add these CNAME records in Cloudflare DNS:

```
Type    Name        Target                              Proxy
CNAME   www         ross-tax-prep-frontend.pages.dev   ✅ Proxied
CNAME   @           ross-tax-prep-frontend.pages.dev   ✅ Proxied
CNAME   app         ross-tax-prep-frontend.pages.dev   ✅ Proxied
CNAME   intake      ross-tax-prep-frontend.pages.dev   ✅ Proxied
CNAME   portal      ross-tax-prep-frontend.pages.dev   ✅ Proxied
CNAME   api         ross-tax-prep-worker1.condre.workers.dev  ✅ Proxied
```

---

## 🔗 Pretty URL Configuration

### Current Setup (pages.dev)
- Full URL: `https://ross-tax-prep-frontend.pages.dev/#intake`
- Pretty URL: `https://ross-tax-prep-frontend.pages.dev/intake`

### After Custom Domain
- Full URL: `https://www.rosstaxprep.com/#intake`
- Pretty URL: `https://www.rosstaxprep.com/intake`
- Subdomain: `https://intake.rosstaxprep.com`

### How It Works
The `_redirects` file handles URL rewriting:
- `/intake` → redirects to `/#intake` (anchor link)
- Maintains single-page app functionality
- No ugly hash in marketing URLs

---

## 🚀 Marketing URLs

Once domains are configured, share these clean URLs:

✅ **Website:** https://www.rosstaxprep.com  
✅ **Start Filing:** https://www.rosstaxprep.com/intake  
✅ **Client Login:** https://portal.rosstaxprep.com  
✅ **API Docs:** https://api.rosstaxprep.com/health

---

## 🛡️ SSL/TLS Configuration

Cloudflare provides **free automatic SSL** for all custom domains:
- Full (Strict) encryption mode
- Universal SSL certificate
- HTTP → HTTPS automatic redirect
- HSTS enabled

---

## 📧 Email Setup (Optional)

Configure email forwarding for professional addresses:

- **admin@rosstaxprep.com** → your-email@gmail.com
- **support@rosstaxprep.com** → your-email@gmail.com
- **intake@rosstaxprep.com** → your-email@gmail.com

Set up in **Cloudflare Email Routing** (free).

---

## 🎨 Branding Consistency

### Primary Domain
`rosstaxprep.com` (no "and bookkeeping" keeps it concise)

### Alternative Domains (301 Redirect)
- `rosstaxandbookkeeping.com` → `rosstaxprep.com`
- `rosstax.com` → `rosstaxprep.com`

### Social Media Handles
- Twitter/X: @RossTaxPrep
- Instagram: @RossTaxPrep
- Facebook: /RossTaxPrep
- LinkedIn: /company/ross-tax-prep

---

## 🔧 Deployment Commands

### Deploy Frontend
```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name=ross-tax-prep-frontend
```

### Deploy API Worker
```bash
cd ../  # back to root
npm run deploy
```

### Update DNS After Deployment
DNS records will automatically update when you connect custom domains in Cloudflare Pages dashboard.

---

## 📊 Monitoring & Analytics

### Cloudflare Web Analytics
Add to `frontend/index.html`:
```html
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
```

### Google Analytics (Optional)
Add GA4 tracking code to `index.html` for detailed user analytics.

---

## ✅ Launch Checklist

- [ ] Deploy frontend to Cloudflare Pages
- [ ] Deploy worker API to production
- [ ] Configure custom domains in Cloudflare
- [ ] Update DNS records
- [ ] Test all subdomain redirects
- [ ] Enable SSL/TLS (automatic)
- [ ] Set up email forwarding
- [ ] Add web analytics
- [ ] Update social media links
- [ ] Test intake form submission
- [ ] Verify API endpoints work on custom domain
- [ ] Set up monitoring alerts

---

## 🆘 Support Resources

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Custom Domains Guide:** https://developers.cloudflare.com/pages/platform/custom-domains/
- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
- **DNS Configuration:** https://developers.cloudflare.com/dns/

---

**Ready to go live?** Run `npm run deploy` from the frontend folder!
