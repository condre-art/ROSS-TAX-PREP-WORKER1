## Ross Tax Prep – Copilot Instructions (Worker + Frontend)

Use these notes to get productive fast across the Cloudflare Worker API (`src/`) and the Pages frontend (`frontend/`).

### Architecture
- **Worker (API Gateway)**: `src/index.ts` registers routes for auth, CRM, e-file, payments, certificates, compliance, social, IRS realtime, and webhooks. Uses Hono-style handlers and JWT auth (`verifyAuth`).
- **Routes**: Located under `src/routes/*` (e.g., `auth.ts`, `crm.ts`, `certificates.ts`, `clientPortal.ts`). Helpers/utilities in `src/utils/*` (encryption, audit, schedulers). Note one camelCase file (`clientPortal.ts`) among otherwise kebab/lowercase names.
- **Data layer**: Cloudflare D1. Base schema in `schema.sql`; migrations under `migration-data/` and ad-hoc files like `migration-client-portal.sql`. D1 binding named `DB` is available to both the Worker and Pages functions.
- **Frontend**: React + Vite in `frontend/`. Pages in `frontend/src/pages/` (Intake, CRM, DIYEFileWizard/EFileWizard, LMS). Shared UI in `frontend/src/components/`. Pages Functions APIs in `frontend/functions/api/*` with Cloudflare Access middleware.
- **Dual business lines**: Tax prep (IRS e-file, refund transfers, CRM) and AI-instructed LMS programs (Bachelor’s degree track). Keep both contexts in mind when adding features.

### Build, Dev, Test
- **Worker** (root):
  - `npm install`
  - `npm run dev` (wrangler dev)
  - `npm run build` (dry-run bundle to `dist/`)
  - `npm test` (vitest)
- **Frontend** (`cd frontend`):
  - `npm install`
  - `npm run dev`
  - `npm run build` / `npm run deploy` (Cloudflare Pages)
Pages Functions share env with frontend; keep API calls relative (`/api/...`).

### Security & Compliance Patterns
- JWT auth via `Authorization: Bearer` and `verifyAuth` in `src/index.ts`; unauthorized→401, forbidden→403.
- PII handling: encryption helpers in `src/utils/encryption.ts`; audit logging in `src/utils/audit.ts`. Log access to PII and admin actions.
- Refund transfer SoD: approval flows and audit requirements enforced in refund-transfer routes/tables (see migrations).
- Cloudflare Access middleware guards staff/CRM routes in `frontend/functions/_middleware.js`.

### Common Workflows
- **Client intake** (frontend): `frontend/src/pages/Intake.jsx` posts JSON to `/api/intake`; server validates JSON, emails via MailChannels, optional CRM webhook (`CRM_WEBHOOK_URL`), responds `{success,id}`.
- **E-file**: `src/efile.ts` handles transmit/check status and acknowledgment processing; status helpers `getEFileStatusInfo`.
- **IRS realtime docs/memos**: handlers in `src/handlers/irs-realtime.ts` and `src/irs.ts`.
- **LMS**: Education pages in `frontend/src/pages/Lms.jsx` and LMS APIs under worker/routes; highlight AI-instructed Bachelor’s program context.

### Environment & Bindings
- Worker: configure `JWT_SECRET`, `DB` (D1), any provider secrets (bank products, payments), IRS endpoints.
- Pages/Functions: `MAILCHANNELS_AUTH`, `CRM_WEBHOOK_URL`, `API_BASE_URL` (when calling worker), plus shared `DB` binding for D1.

### Patterns to Follow
- Frontend forms: `useState` + `useMemo` for validity, status union `idle|loading|error`, disable submit when loading or invalid, navigate to `/success` on success (see Intake.jsx).
- API responses: JSON with clear `error` or `{success:true,...}`; set `Content-Type: application/json`.
- Keep fetch URLs relative and respect CORS config in `src/cors.ts`.

### Quick Links
- Worker entry: `src/index.ts`
- Key routes: `src/routes/auth.ts`, `src/routes/crm.ts`, `src/routes/certificates.ts`, `src/routes/clientPortal.ts`
- E-file: `src/efile.ts`
- Encryption/Audit: `src/utils/encryption.ts`, `src/utils/audit.ts`
- Frontend pages: `frontend/src/pages/Intake.jsx`, `frontend/src/pages/CRM.jsx`, `frontend/src/pages/DIYEFileWizard.jsx`, `frontend/src/pages/Lms.jsx`
- Pages Functions: `frontend/functions/api/intake.js`, `frontend/functions/_middleware.js`
