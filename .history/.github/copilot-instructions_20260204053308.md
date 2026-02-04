# Ross Tax Prep & Bookkeeping — AI Coding Agent Instructions

## Architecture Overview
This is a **Cloudflare-native tax preparation & LMS platform** with strict compliance requirements (IRS Pub 1075, TWC regulations).

### Service Boundaries
- **Worker** ([src/index.ts](src/index.ts)): Main API entrypoint at port 8787
  - Manual path routing with `verifyAuth` JWT checks before delegating to modular routers
  - All routers in [src/routes/](src/routes/) use itty-router; responses wrapped by `cors()` helper
  - Critical routers: `clientPortal`, `refundTransferCenter`, `iam`, `efile`, `lms`, `crm`
- **Frontend** ([frontend/](frontend/)): React + Vite SPA at port 5173 deployed to Cloudflare Pages
  - Pages Functions in [frontend/functions/api/](frontend/functions/api/) handle CDN-edge logic (MailChannels, etc.)
- **Database**: Cloudflare D1 (SQLite) - schema defined in [schema.sql](schema.sql)
  - **PII encryption mandatory**: Use `encryptPII`/`decryptPII` from [src/utils/encryption.ts](src/utils/encryption.ts) for SSN, addresses, IDs
  - New migrations go in `migration-*.sql` files; apply via `npx wrangler d1 execute ross_tax_prep_db --remote --file=migration-client-portal.sql`
- **Storage**: R2 bucket `DOCUMENTS_BUCKET` for client docs, IRS schemas, certificates

### Data Flow Patterns
1. **Client portal**: React POST → Pages Function → Worker `/api/portal/*` → D1 (encrypted) → audit log
2. **E-file transmission**: Worker orchestrates via [src/efile.ts](src/efile.ts) → IRS MeF A2A client in [src/mef.ts](src/mef.ts) → status polling → acknowledgments stored in D1
3. **LMS enrollment**: Form submission → `/api/lms/enroll` → validate acknowledgments → encrypt PII → D1 → email notification

## Security & Compliance Patterns
- **Audit logging required**: Call `logAudit` from [src/utils/audit.ts](src/utils/audit.ts) for ANY:
  - PII access/modification (client SSN, refund data)
  - Admin role actions (role assignment, permission changes)
  - Refund transfer submissions/approvals
  - E-file transmissions and IRS acknowledgments
- **Auth pattern**: 
  ```typescript
  const user = await verifyAuth(req, env);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden(); // explicit role check
  ```
- **IAM permission checks**: Use `hasPermission(db, userId, userType, permission)` from [src/utils/iam.ts](src/utils/iam.ts) for granular access (example: `client:view_dashboard`, `staff:approve_refund_transfer`)
- **Router pattern**: Routers export a factory function taking `db: D1Database`:
  ```typescript
  export function createClientPortalRouter(db: D1Database) {
    const router = Router({ base: '/api/portal' });
    router.get('/dashboard', async (req: any, env: any) => { /* ... */ });
    return router;
  }
  ```

## Developer Workflows
- **Local development**:
  - Worker: `npm run dev` (wrangler at localhost:8787)
  - Frontend: `cd frontend && npm run dev` (Vite at localhost:5173)
  - D1 local: `npx wrangler d1 execute DB --local --file=schema.sql` (apply schema)
  - Remote migration: `npx wrangler d1 execute ross_tax_prep_db --remote --file=migration-client-portal.sql`
- **Deploy**:
  - Worker: `npm run deploy` (pushes to Cloudflare)
  - Frontend: `cd frontend && npm run deploy` (builds + pushes to Pages)
  - Dry-run build: `npm run build` (outputs to `dist/`)
- **Testing**: `npm run test` runs vitest; add tests for new routers in `*.test.ts`

## Critical Business Logic
- **Refund transfers** ([src/routes/refundTransferCenter.ts](src/routes/refundTransferCenter.ts)):
  - Separation of Duties (SoD): Submitter ≠ Approver (status: `pending_supervisor_approval` → `approved`)
  - Audit trail: Every state change logged to `transfer_timeline` table
  - Client consent: `client_consent = 1` required before approval
- **E-file transmission** ([src/efile.ts](src/efile.ts)):
  - Schema validation via [src/schemaValidator.ts](src/schemaValidator.ts) before transmission
  - IRS MeF client in [src/mef.ts](src/mef.ts) uses MEF cert env vars (`MEF_CERT`, `MEF_KEY`)
  - Test mode fallback: Check `isTransmissionEnabled()` from [src/efileProviders.ts](src/efileProviders.ts)
  - Lifecycle: `created` → `transmitting` → `accepted`/`rejected` → acknowledgment processing
- **LMS enrollments** ([src/routes/lms.ts](src/routes/lms.ts)):
  - 7 compliance acknowledgments required (policies, conduct, accreditation, etc.)
  - Tuition locked at enrollment time (`tuition_locked`, `total_price_locked`)
  - Refund eligibility tracked (`refund_eligible`, `refund_processed_at`)

## Common Pitfalls
- **Don't bypass audit logging** for sensitive actions; reviewers check `audit_log` table
- **Never log unencrypted PII**; encrypt before INSERT, decrypt on SELECT
- **Check binding names**: D1 is `DB`, R2 is `DOCUMENTS_BUCKET` (see [wrangler.toml](wrangler.toml))
- **CORS wrapper**: All Worker responses must use `cors(response)` for frontend access
- **Role checks**: `verifyAuth` returns user; always check `user.role` explicitly for protected routes
- **D1 migrations**: Use `--remote` for production, `--local` for dev; backup before altering tables

## External Integrations
- **DocuSign**: Webhook endpoint in [src/index.ts](src/index.ts) at `/api/docusign/webhook`; requires `DOCUSIGN_*` env vars
- **IRS MeF**: A2A client in [src/mef.ts](src/mef.ts); uses `MEF_EFIN`, `MEF_ETIN`, cert/key from env
- **MailChannels**: Email sending from Pages Functions; requires `TO_EMAIL`, `FROM_EMAIL`, `FROM_NAME` env vars

## Key Configuration
- **Worker bindings**: [wrangler.toml](wrangler.toml) defines D1 (`ross_tax_prep_db`) and R2 (`ross-tax-documents`)
- **Frontend bindings**: [frontend/wrangler.toml](frontend/wrangler.toml) has cron trigger `0 */6 * * *` for scheduled tasks
- **Dev container**: [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) forwards ports 8787, 5173, 3000, 4173
- **Secrets**: JWT_SECRET, ENCRYPTION_KEY, DOCUSIGN_*, MEF_* stored in Cloudflare dashboard (not in code)

## Documentation Index
- **Compliance**: [COMPLIANCE-INFRASTRUCTURE-COMPLETE.md](COMPLIANCE-INFRASTRUCTURE-COMPLETE.md), [ENCRYPTION.md](ENCRYPTION.md)
- **E-file workflows**: [COMPLETE-IRS-WORKFLOW-INTEGRATION.md](COMPLETE-IRS-WORKFLOW-INTEGRATION.md), [EFILE-2025-STATUS.md](EFILE-2025-STATUS.md)
- **Deployment**: [COMPLETE-DEPLOYMENT-GUIDE.md](COMPLETE-DEPLOYMENT-GUIDE.md), [CLOUDFLARE-PRODUCTION-SETUP.md](CLOUDFLARE-PRODUCTION-SETUP.md)
- **Architecture**: [SYSTEM-ARCHITECTURE-COMPLETE.md](SYSTEM-ARCHITECTURE-COMPLETE.md), [API-COMPLETE-SPECIFICATION.md](API-COMPLETE-SPECIFICATION.md)
