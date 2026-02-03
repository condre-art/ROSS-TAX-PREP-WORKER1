## Sub-issue: Repository Copilot instructions for `ross-tax-prep-frontend`

Parent issue: https://github.com/condre-art/ross-tax-prep-frontend/issues/24

### Goal
Add repo-scoped Copilot instructions so the coding agent understands the Cloudflare Pages (React + Vite) frontend, Pages Functions API glue code, and the standard build/test workflow.

### Required changes
1) Create `.github/copilot-instructions.md` in the `ross-tax-prep-frontend` repo with:
   - Architecture snapshot (Pages app, `frontend/src/pages`, `frontend/functions/api`, Vite build output).
   - Standard scripts: `npm install`, `npm run dev`, `npm run build`, `npm run lint` (if present), `npm test` (if present).
   - Form pattern guidance (useState/useMemo validation, loading/error states, submit button disable rules).
   - Pages Functions submission flow for `/api/intake` (validate JSON, required fields, MailChannels send, optional CRM webhook).
   - Env var notes for Pages (mail channels auth, CRM webhook URL, API base).
2) Ensure the instructions are concise, actionable, and link to any key files (e.g., `src/pages/Intake.jsx`, `functions/api/intake.js`) so agents can jump directly to references.

### Acceptance criteria
- `.github/copilot-instructions.md` exists in `ross-tax-prep-frontend` with the above sections.
- Content is specific to the frontend repo (not worker/backend), under ~200 lines, and references actual file paths that exist in that repo.
- No other files are modified.
