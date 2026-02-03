# Cloudflare Production Deployment Setup

## Getting Your Cloudflare Zone ID

To deploy the Ross Tax Prep Worker to production, you need your Cloudflare Zone ID for `rosstaxprepandbookkeeping.com`.

### Method 1: Using Cloudflare Dashboard (Easiest)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Click on **rosstaxprepandbookkeeping.com** domain
4. On the right sidebar under **API**, you'll see:
   - **Zone ID** (looks like: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`)
5. Copy this Zone ID

### Method 2: Using Cloudflare API (Command Line)

Replace `YOUR_API_TOKEN` with your Cloudflare API Token:

```bash
# Linux/macOS
curl -s "https://api.cloudflare.com/client/v4/zones?name=rosstaxprepandbookkeeping.com" \
  -H "Authorization: Bearer YOUR_API_TOKEN" | jq '.result[0].id'

# PowerShell
$token = "YOUR_API_TOKEN"
$response = Invoke-WebRequest -Uri "https://api.cloudflare.com/client/v4/zones?name=rosstaxprepandbookkeeping.com" `
  -Headers @{"Authorization"="Bearer $token"}
($response.Content | ConvertFrom-Json).result[0].id
```

## Updating wrangler.toml

Once you have your Zone ID, update `wrangler.toml`:

```toml
[env.production]
name = "ross-tax-prep-worker-prod"
route = "api.rosstaxprepandbookkeeping.com/*"
zone_id = "YOUR_CLOUDFLARE_ZONE_ID_HERE"  # ← Replace with actual Zone ID
```

**Example:**
```toml
[env.production]
name = "ross-tax-prep-worker-prod"
route = "api.rosstaxprepandbookkeeping.com/*"
zone_id = "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p"
```

## Deploying to Production

Once you've updated the Zone ID in `wrangler.toml`, run:

```bash
# Deploy to production environment
npx wrangler deploy --env production

# Or with verbose output
npx wrangler deploy --env production --verbose
```

### Expected Output
```
⛅️ wrangler 4.61.1
─────────────────────────────────────────────
Total Upload: 428.44 KiB / gzip: 91.49 KiB
Uploaded ross-tax-prep-worker-prod (3.67 sec)
✨ Deployment complete!
```

## Verifying Production Deployment

Once deployed, your API will be available at:
- **Production API**: `https://api.rosstaxprepandbookkeeping.com`
- **All Endpoints**: `https://api.rosstaxprepandbookkeeping.com/api/*`

Test endpoints:

```bash
# Health check
curl https://api.rosstaxprepandbookkeeping.com/health

# LMS endpoints
curl https://api.rosstaxprepandbookkeeping.com/api/lms/roles
curl https://api.rosstaxprepandbookkeeping.com/api/lms/degree-programs
```

## Production Environment Variables

The `[env.production.vars]` section in `wrangler.toml` contains all production environment variables:
- `ENV = "production"`
- DocuSign credentials
- API keys for payment processing
- D1 database binding
- R2 bucket binding

**Note**: Sensitive secrets should be managed via `wrangler secret` for enhanced security:

```bash
# Set production secrets
wrangler secret put --env production ENCRYPTION_KEY
wrangler secret put --env production MEF_CLIENT_CERT
wrangler secret put --env production MEF_CLIENT_KEY
```

## Rollback Instructions

If deployment fails, rollback to the previous version:

```bash
# View deployment history
npx wrangler deployments

# Rollback to previous version
npx wrangler rollback --env production
```

## Troubleshooting

### Error: "zone_id or zone_name must be specified"
- **Solution**: Ensure `zone_id` is set in `[env.production]` section of `wrangler.toml`

### Error: "Authentication error [code: 10000]"
- **Solution**: Check your Cloudflare API credentials and token permissions

### Error: "ENOENT: no such file or directory"
- **Solution**: Ensure you're running the command from the project root directory

### Worker not responding
- **Solution**: Check `wrangler tail --env production` for logs

## Production Checklist

- [ ] Zone ID obtained from Cloudflare Dashboard
- [ ] `wrangler.toml` updated with Zone ID
- [ ] All environment variables configured
- [ ] Database migrations executed: `npx wrangler d1 execute DB --file=schema/lms-academy-rbac-workflows.sql --remote`
- [ ] Deployment successful: `npx wrangler deploy --env production`
- [ ] Health check passes: `curl https://api.rosstaxprepandbookkeeping.com/health`
- [ ] LMS endpoints responding
- [ ] Frontend deployment verified
- [ ] SSL certificate active (auto-provisioned by Cloudflare)

## Additional Resources

- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers Routes](https://developers.cloudflare.com/workers/routes/)
- [Cloudflare API Docs](https://developers.cloudflare.com/api/)

---

**Last Updated**: February 3, 2026
**Status**: Ready for production deployment after Zone ID configuration
