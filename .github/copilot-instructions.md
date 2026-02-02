## API Actions & Endpoints

Below is a comprehensive list of RESTful API actions and endpoints for CRM, LMS, team, social, certificates, IRS, and general export/import. Use these as a reference for implementation, documentation, and testing.

### CRM Endpoints
- `GET /api/crm/intakes` — List all client intakes
- `GET /api/crm/intakes/:id` — Get a single intake
- `POST /api/crm/intakes` — Create a new intake
- `PUT /api/crm/intakes/:id` — Update intake details
- `DELETE /api/crm/intakes/:id` — Delete an intake
- `GET /api/crm/clients` — List all clients
- `GET /api/crm/clients/:id` — Get client profile
- `POST /api/crm/clients` — Create new client
- `PATCH /api/crm/clients/:id` — Update client info
- `DELETE /api/crm/clients/:id` — Delete client
- `GET /api/crm/staff` — List all staff
- `GET /api/crm/staff/:id` — Get staff profile
- `POST /api/crm/staff` — Create staff
- `PATCH /api/crm/staff/:id` — Update staff info
- `DELETE /api/crm/staff/:id` — Delete staff

### Team Endpoints
- `GET /api/team` — List all active team members
- `GET /api/team/:id` — Get a specific team member
- `GET /api/team/regions` — List all regions with team members

### Social/Review Endpoints
- `GET /api/social/google-reviews` — List Google reviews
- `POST /api/social/google-reply` — Reply to a Google review
- `GET /api/social/metrics` — Social metrics dashboard
- `POST /api/social/post` — Create a social post
- `GET /api/social/feed` — List social feed
- `POST /api/social/schedule` — Schedule a post

### LMS Endpoints
- `GET /api/lms/courses` — List all courses
- `GET /api/lms/courses/:id` — Get course details
- `POST /api/lms/courses` — Create a new course
- `PUT /api/lms/courses/:id` — Update course
- `DELETE /api/lms/courses/:id` — Delete course
- `GET /api/lms/students` — List all students
- `GET /api/lms/students/:id` — Get student profile
- `POST /api/lms/students` — Create new student
- `PATCH /api/lms/students/:id` — Update student info
- `DELETE /api/lms/students/:id` — Delete student
- `POST /api/lms/enroll` — Enroll student in course
- `GET /api/lms/enrollments` — List all enrollments
- `GET /api/lms/enrollments/:id` — Get enrollment details

### Certificates/Compliance/IRS/E-File
- `GET /api/certificates` — List all certificates
- `POST /api/certificates` — Issue new certificate
- `GET /api/certificates/:id` — Get certificate details
- `DELETE /api/certificates/:id` — Revoke certificate
- `GET /api/efile/status` — Get e-file status
- `POST /api/efile/transmit` — Transmit e-file
- `GET /api/irs/memos` — List IRS memos
- `GET /api/irs/schema` — Get IRS schema fields

### General/Export/Import
- `GET /api/export` — Export data (CSV, etc.)
- `POST /api/import` — Import data
# Ross Tax Prep & Bookkeeping - AI Coding Instructions

## Project Overview

Tax preparation and CRM platform built on **Cloudflare Workers** with a separate **Cloudflare Pages** frontend. The system handles IRS e-file transmission (MeF A2A), client intake, document management, and staff workflows.

## Architecture

```
├── src/                    # Cloudflare Worker API (TypeScript)
│   ├── index.ts            # Main router with 100+ endpoints
│   ├── routes/             # Route handlers (crm, auth, certificates, team, etc.)
│   ├── middleware/         # Auth, RBAC, rate limiting, validation
│   ├── handlers/           # Webhook handlers (IRS, payments, credentials)
│   ├── utils/              # Audit logging, encryption, data retention
│   ├── efile.ts            # E-file transmission orchestration
│   ├── mef.ts              # IRS MeF A2A Web Services client (~1200 lines)
│   └── efileProviders.ts   # EFIN/ETIN profiles, kill switches
├── frontend/               # Cloudflare Pages (React + Vite)
│   ├── src/pages/          # React page components (Intake.jsx, CRM.jsx, etc.)
│   └── functions/api/      # Pages Functions (intake form, CRM endpoints)
└── schema.sql              # D1 database schema
```

## Form Handling & Validation

### Client-Side Form Pattern (React)
Forms in [../frontend/src/pages/Intake.jsx](../frontend/src/pages/Intake.jsx) follow this pattern:

```jsx
const [form, setForm] = useState({ fullName: "", email: "", phone: "", service: "", notes: "" });
const [status, setStatus] = useState({ type: "idle", message: "" });

const canSubmit = useMemo(() => {
  return form.fullName.trim().length >= 2 && isValidEmail(form.email);
}, [form.fullName, form.email]);

// Submit handler with loading state
async function onSubmit(e) {
  e.preventDefault();
  if (!canSubmit) return;
  setStatus({ type: "loading", message: "Submitting…" });
  // ... fetch logic
}
```

**Key conventions:**
- Use `useState` for form state, `useMemo` for computed validation
- Three status types: `idle`, `loading`, `error`
- Disable submit button when `!canSubmit || status.type === "loading"`
- Navigate to `/success` on successful submission

### Server-Side Validation Utilities
Use validators from [../src/middleware/validation.ts](../src/middleware/validation.ts):

```typescript
import { isValidEmail, isValidPhone, isValidSSN, isStrongPassword, sanitizeString, validateRequiredFields } from "../middleware/validation";

// Validate required fields
const { valid, errors } = validateRequiredFields(body, ["name", "email", "password"]);

// Individual validators
isValidEmail("test@example.com");     // Email regex
isValidPhone("5124896749");           // 10-11 digit US phone
isValidSSN("123-45-6789");            // 9 digits with optional dashes
isStrongPassword("Test123!");         // Returns { valid, errors[] }
sanitizeString("<script>");           // XSS prevention
```

### Form Submission Flow (Intake Example)
1. **Frontend** (`frontend/src/pages/Intake.jsx`) → POST `/api/intake`
2. **Pages Function** (`frontend/functions/api/intake.js`) handles request:
   - Validates JSON content-type
   - Validates required fields (fullName ≥2 chars, valid email)
   - Sends email via MailChannels
   - Optionally posts to CRM webhook
   - Returns `{ success: true, id: uuid }`

3. **CRM Backend** (`src/routes/crm.ts`) for staff access:
   - `handleCrmIntakeCreate` encrypts PII before storage
   - `handleCrmIntakes` decrypts PII for display
   - All operations are audit logged

### PII Encryption in Forms
All sensitive form data must be encrypted before database storage:

```typescript
import { encryptPII, decryptPII } from "../utils/encryption";

// On create - encrypt before INSERT
const encFullName = await encryptPII(full_name, env);
const encEmail = await encryptPII(email, env);
const encPhone = phone ? await encryptPII(phone, env) : null;

// On read - decrypt for display
const decrypted = {
  ...row,
  full_name: row.full_name ? await decryptPII(row.full_name, env) : row.full_name,
  email: row.email ? await decryptPII(row.email, env) : row.email,
};
```

### IRS Schema Validation
Tax return XML validation uses [../src/schemaValidator.ts](../src/schemaValidator.ts):

```typescript
import { createSchemaValidator, ReturnType } from './schemaValidator';

const validator = createSchemaValidator();
const result = validator.validate(xmlContent, {
  taxYear: "2025",
  returnType: "1040" as ReturnType,
  isAmended: false,
  environment: "ATS"
});
// Returns: { valid, errors[], warnings[], ruleChecks[], summary }
```

## Authentication Pattern

```typescript
import { requireAuth, requireStaff, requireAdmin } from "../middleware/auth";

const authResult = await requireStaff(req, env);
if (authResult instanceof Response) return authResult; // 401/403
const user = authResult; // AuthenticatedUser
```

## Audit Logging
All sensitive operations must be logged:

```typescript
import { logAudit } from "../utils/audit";

await logAudit(env, {
  action: "crm_intake_create",
  entity: "intakes",
  entity_id: id,
  user_id: user.id,
  user_email: user.email,
  details: JSON.stringify({ service }),
});
```

## Developer Workflows

```powershell
# Backend (Worker)
npm run dev      # Local dev server
npm run deploy   # Deploy to Cloudflare Workers

# Frontend (Pages)
cd frontend
npm run dev      # Vite at localhost:5173
npm run deploy   # Build + deploy to Pages
```

## Environment Variables

**Worker secrets** (via `wrangler secret put`):

**Pages env vars** (Cloudflare dashboard):

## Key Files Reference

**Pages env vars** (Cloudflare dashboard):
