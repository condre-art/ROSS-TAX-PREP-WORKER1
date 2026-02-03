sanitizeString("<script>");           // XSS prevention

# Ross Tax Prep & Bookkeeping — AI Coding Agent Instructions

## Architecture Overview

- **Backend**: Cloudflare Worker (TypeScript, see [src/index.ts](../src/index.ts)), exposes 100+ REST endpoints for CRM, LMS, IRS e-file, and more. Route handlers live in [src/routes/](../src/routes/), with middleware in [src/middleware/](../src/middleware/).
- **Frontend**: Cloudflare Pages (React + Vite, see `frontend/`), with API endpoints in `frontend/functions/api/`.
- **Database**: D1 (see [schema.sql](../schema.sql)), all PII is encrypted before storage ([src/utils/encryption.ts](../src/utils/encryption.ts)).
- **IRS e-file**: Orchestrated in [src/efile.ts](../src/efile.ts), with MeF A2A logic in [src/mef.ts](../src/mef.ts).

## Key Conventions & Patterns

- **Form Handling**: React forms use `useState` for state, `useMemo` for validation, and a `status` object for UX feedback. See your project's frontend source for canonical examples.
- **Validation**: Always validate required fields and sanitize user input using the appropriate validation logic in your route handlers or middleware.
- **PII Encryption**: Encrypt all sensitive fields before DB insert, decrypt on read. Use `encryptPII`/`decryptPII` from [src/utils/encryption.ts](../src/utils/encryption.ts).
- **Audit Logging**: All sensitive actions must call `logAudit` ([src/utils/audit.ts](../src/utils/audit.ts)).
- **Authentication**: Use `requireAuth`, `requireStaff`, or `requireAdmin` middleware for protected endpoints (see authentication logic in [src/index.ts](../src/index.ts) or relevant route handlers).
- **IRS XML Validation**: Use [src/schemaValidator.ts](../src/schemaValidator.ts) for business rule validation of tax return XML.

## API & Data Flows

- **API Endpoints**: See [src/routes/](../src/routes/) for backend. Major resource groups: CRM, LMS, team, social, certificates, IRS, e-file.
- **Frontend → Backend**: Forms POST to `/api/crm/intakes` or similar, handled by Pages Functions, then backend for staff/PII workflows.
- **E-file**: IRS e-file transmission is orchestrated in [src/efile.ts](../src/efile.ts), with schema validation logic in [src/schemaValidator.ts](../src/schemaValidator.ts).

## Developer Workflows

- **Backend**: `npm run dev` (local), `npm run deploy` (Cloudflare Worker)
- **Frontend**: `cd frontend && npm run dev` (Vite), `npm run deploy` (Cloudflare Pages)
- **DB Migrations**: `npx wrangler d1 execute DB --file=schema.sql --local`
- **Testing**: Use your project's test scripts or refer to the README for current API smoke test instructions.

## Integration & External Services

- **MailChannels**: Used for intake notifications (see your project's frontend API functions for implementation details)
- **IRS MeF**: All e-file logic and schema validation in [src/mef.ts](../src/mef.ts) and [src/schemaValidator.ts](../src/schemaValidator.ts)

## Examples

- **Form Validation**: See [src/schemaValidator.ts](../src/schemaValidator.ts) for backend validation examples.
- **PII Encryption**: See [src/utils/encryption.ts](../src/utils/encryption.ts)
- **Audit Logging**: See [src/utils/audit.ts](../src/utils/audit.ts)

## Tips for AI Agents

- Always use project-provided validation, encryption, and logging utilities—do not roll your own.
- Reference the actual API endpoints and data flows in [src/routes/](../src/routes/) and `frontend/functions/api/`.
- When in doubt, check for conventions in the referenced files above before introducing new patterns.
