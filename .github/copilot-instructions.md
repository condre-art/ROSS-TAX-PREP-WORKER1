sanitizeString("<script>");           // XSS prevention

# Ross Tax Prep & Bookkeeping — AI Coding Agent Instructions

## Architecture (big picture)
- **Backend**: Cloudflare Worker entrypoint is [src/index.ts](src/index.ts); it does manual path gating, `verifyAuth` role checks, and delegates to routers under [src/routes/](src/routes/) (itty-router/Hono). Responses are wrapped by `cors`.
- **Frontend**: Cloudflare Pages app in [frontend/](frontend/) (React + Vite) with Pages Functions under [frontend/functions/api/](frontend/functions/api/).
- **Database**: D1 schema in [schema.sql](schema.sql). PII is encrypted before storage via `encryptPII`/`decryptPII` in [src/utils/encryption.ts](src/utils/encryption.ts).
- **E-file**: Orchestration in [src/efile.ts](src/efile.ts) with IRS MeF A2A client in [src/mef.ts](src/mef.ts) and business-rule validation in [src/schemaValidator.ts](src/schemaValidator.ts).

## Project-specific conventions
- **Sensitive actions**: Log via `logAudit` from [src/utils/audit.ts](src/utils/audit.ts); don’t bypass audit logging for PII or admin actions.
- **Auth/roles**: Use `verifyAuth` and explicit role checks in [src/index.ts](src/index.ts) for protected routes; some feature routers live under [src/routes/](src/routes/).
- **Frontend forms**: Use `useState` for state, `useMemo` for validation, and a `status` object for UX feedback (see frontend source under [frontend/src](frontend/src)).
- **Scheduled jobs**: Worker `scheduled()` runs IRS sync + audit log processing (see [src/index.ts](src/index.ts)).

## Key data flows
- **Frontend → backend**: Pages Functions POST to worker endpoints (e.g., CRM intakes to `/api/crm/intakes` in [src/index.ts](src/index.ts)).
- **E-file lifecycle**: Transmission → status polling → acknowledgments (see [src/efile.ts](src/efile.ts) and [src/mef.ts](src/mef.ts)).

## Developer workflows
- **Worker dev**: `npm run dev` (wrangler local) in repo root.
- **Worker deploy/build**: `npm run deploy` / `npm run build` (dry-run to dist).
- **Frontend dev**: `cd frontend && npm run dev` (Vite).
- **Frontend deploy**: `cd frontend && npm run deploy`.
- **D1 local migration**: `npx wrangler d1 execute DB --file=schema.sql --local`.
- **Tests**: `npm run test` (vitest).

## Runtime bindings & config
- **D1 + R2 bindings**: Worker expects `DB` (D1) and `DOCUMENTS_BUCKET` (R2); see [wrangler.toml](wrangler.toml).
- **Frontend worker**: Pages config and cron trigger live in [frontend/wrangler.toml](frontend/wrangler.toml).
- **Dev Container**: .devcontainer forwards 8787 (worker) and 5173 (Vite) among others in [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json).

## External integrations
- **DocuSign**: Envelope create + webhook handling in [src/index.ts](src/index.ts) (requires DocuSign secrets).
- **IRS MeF**: Uses MEF cert env vars and test-mode fallback; see [src/mef.ts](src/mef.ts).
- **MailChannels**: Intake notifications wired in frontend Pages Functions.
