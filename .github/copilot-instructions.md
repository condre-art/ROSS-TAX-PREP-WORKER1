## Ross Tax Prep – Frontend Copilot Instructions

Repository: `ross-tax-prep-frontend` (Cloudflare Pages: React + Vite with Pages Functions)

### Architecture Snapshot
- **App shell**: `frontend/src/App.jsx`, entry `frontend/src/main.jsx` (Vite).
- **Pages (React)**: `frontend/src/pages/` (e.g., `Intake.jsx`, `CRM.jsx`, `Home.jsx`, `FAQ.jsx`, `Services.jsx`, `EFileWizard.jsx`, `Lms.jsx`, `Success.jsx`).
- **Shared UI**: `frontend/src/components/` (Button, Table, Navbar, Modal, ToastProvider, CertificateAPIStatus, etc.).
- **Utilities**: `frontend/src/utils/` (PDF generators, downloads).
- **Pages Functions API**: `frontend/functions/api/` for client-facing endpoints; `_middleware.js` applies Cloudflare Access to protected routes.
- **Build output**: `frontend/dist/` (Vite).

### Standard Scripts
```bash
npm install
npm run dev     # Vite dev server
npm run build   # Vite production build
npm run lint    # if present
npm test        # if present
```

### Form Pattern (Client-Side)
- Use `useState` for form data and `useMemo` for derived validity.
- Status state has `idle | loading | error`; set loading during submit.
- Disable submit when `!canSubmit` **or** `status.type === "loading"`.
- On success, navigate to `/success`.
- Reference: `frontend/src/pages/Intake.jsx`.

### Pages Functions Submission Flow (`/api/intake`)
- File: `frontend/functions/api/intake.js`
- Validate `Content-Type: application/json`; reject otherwise.
- Require `fullName` (min 2 chars) and valid `email`; optional `phone`, `service`, `notes`.
- Send notification via MailChannels.
- If `CRM_WEBHOOK_URL` is set, POST the payload there.
- Response: `{ success: true, id: <uuid> }` on success; include meaningful error on failure.

### Environment Variables (Pages)
- `MAILCHANNELS_AUTH` / MailChannels key for outbound email.
- `CRM_WEBHOOK_URL` optional webhook for CRM ingestion.
- `API_BASE_URL` when frontend needs to call worker APIs.

### Key Protected Routes
- Cloudflare Access enforced via `frontend/functions/_middleware.js` for `/crm/*`, `/api/crm/*`, `/api/docs/*`.
- Staff CRM UI at `/crm` calls Pages Functions (e.g., `crm/intakes.js`, `crm/update-status.js`, `docs/upload.js`).

### Workflow Integration Notes
- Client-facing workflow: Intake form (`/api/intake`) → MailChannels + optional CRM webhook → staff consumes via CRM dashboard.
- Ensure fetch calls use relative `/api/...` paths to leverage Pages Functions and configured env vars.

### Quick Links
- Intake page: `frontend/src/pages/Intake.jsx`
- CRM dashboard: `frontend/src/pages/CRM.jsx`
- Intake handler: `frontend/functions/api/intake.js`
- CRM intakes list: `frontend/functions/api/crm/intakes.js`
- Auth middleware: `frontend/functions/_middleware.js`
