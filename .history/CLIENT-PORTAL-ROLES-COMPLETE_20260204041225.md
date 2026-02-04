# Enhanced Role & Permission Matrix
## Ross Tax & Bookkeeping - Digital Money Management Center

**CRITICAL DISCLAIMERS:**
- Ross Tax & Bookkeeping is not a bank
- Refund transfers and advances are offered through third-party financial institutions
- Funds are not held by Ross Tax & Bookkeeping
- All terminology reflects facilitation, not custody

---

## 7 Role Definitions

### 1. Client / Taxpayer
**Role Type:** External user  
**Access Level:** Self-service only

**Permissions:**
- `client:view_dashboard` - View own dashboard overview
- `client:view_documents` - View own documents
- `client:upload_documents` - Upload documents (W-2s, receipts, etc.)
- `client:view_messages` - View message threads
- `client:send_messages` - Send secure messages to staff
- `client:view_refund_status` - View refund transfer status (read-only)
- `client:view_activity` - View own activity history
- `client:update_profile` - Update contact info and preferences
- `client:view_tasks` - View pending tasks
- `client:e_sign` - E-sign disclosures and consents

**Restrictions:**
- ❌ Cannot see other clients' data
- ❌ Cannot initiate money movement
- ❌ Cannot change financial terms
- ❌ No stored balances or "account numbers"
- ❌ Cannot modify tax return after submission

**Workflow:**
1. Client logs in (MFA recommended)
2. Uploads documents / reviews status
3. System updates progress automatically
4. Notifications triggered by staff/system events
5. E-signs required disclosures

---

### 2. Preparer / Tax Specialist
**Role Type:** Internal - operational  
**Access Level:** Client-specific (assigned clients only)

**Permissions:**
- `preparer:view_assigned_clients` - View assigned client profiles
- `preparer:upload_tax_returns` - Upload completed tax returns
- `preparer:update_return_status` - Update return status
- `preparer:submit_refund_transfer` - Submit refund transfer request
- `preparer:send_messages` - Send secure messages to clients
- `preparer:flag_issues` - Flag issues for supervisor review
- `preparer:view_documents` - View client documents
- `preparer:request_documents` - Request missing documents from clients
- `preparer:create_tasks` - Create tasks for clients

**Restrictions:**
- ❌ Cannot approve advances
- ❌ Cannot modify fees after lock
- ❌ Cannot manage users or settings
- ❌ Cannot self-approve refund transfers (SoD)
- ❌ Cannot access unassigned clients

---

### 3. Bookkeeping Specialist
**Role Type:** Internal - service-specific  
**Access Level:** Limited financial view (bookkeeping clients only)

**Permissions:**
- `bookkeeper:view_assigned_clients` - View bookkeeping clients only
- `bookkeeper:upload_financial_summaries` - Upload monthly financial summaries
- `bookkeeper:categorize_expenses` - Categorize expense uploads
- `bookkeeper:generate_reports` - Generate PDF/CSV reports
- `bookkeeper:send_messages` - Communicate with bookkeeping clients

**Restrictions:**
- ❌ No tax filing access
- ❌ No refund/advance access
- ❌ No client onboarding authority

---

### 4. Office Manager / Supervisor
**Role Type:** Internal - oversight  
**Access Level:** High (non-financial)

**Permissions:**
- `supervisor:assign_clients` - Assign clients to staff
- `supervisor:review_submissions` - Review preparer submissions
- `supervisor:approve_refund_transfer` - Approve refund transfer submissions (SoD enforced)
- `supervisor:lock_fee_schedules` - Lock fee schedules
- `supervisor:escalate_issues` - Escalate issues to Admin
- `supervisor:view_operational_reports` - View operational dashboards

**Key SoD Control:** Supervisor approves; Preparer cannot self-approve.

---

### 5. Compliance / Quality Review
**Role Type:** Internal - read-only + case actions  
**Access Level:** Restricted (audit trail focus)

**Permissions:**
- `compliance:view_all_records` - View all client records (read-only)
- `compliance:review_disclosures` - Review disclosures & consents
- `compliance:audit_workflows` - Audit refund/advance workflows
- `compliance:flag_issues` - Flag compliance issues
- `compliance:freeze_workflow` - Freeze client workflow temporarily
- `compliance:view_audit_logs` - View complete audit trail
- `compliance:generate_reports` - Generate compliance reports

**Restrictions:**
- ❌ No edits to financial data
- ❌ No client communication unless escalated

---

### 6. System Administrator (Platform Admin)
**Role Type:** Internal - technical  
**Access Level:** Privileged (non-financial)

**Permissions:**
- `admin:create_users` - Create/manage user accounts
- `admin:assign_roles` - Assign roles & permissions
- `admin:configure_portal` - Configure portal settings
- `admin:manage_mfa` - Manage MFA / security controls
- `admin:view_system_logs` - View system logs

**Restrictions:**
- ❌ No tax data editing
- ❌ No refund or advance approvals
- 🔒 **Admin ≠ Operator** (critical control)

---

### 7. Owner / Principal
**Role Type:** Executive  
**Access Level:** Full visibility, limited action

**Permissions:**
- `owner:view_all_dashboards` - View all dashboards & reports
- `owner:approve_exceptions` - Approve policy exceptions
- `owner:override_workflow_locks` - Override workflow locks (logged)
- `owner:access_audit_logs` - Access complete audit logs

**Restrictions:**
- ❌ No day-to-day processing (recommended)
- ❌ All overrides logged and audited

---

## Implementation Status

✅ **IAM Infrastructure** - RBAC middleware, permission checking, audit logging  
✅ **Client Portal Routes** - Dashboard, documents, messaging, activity  
✅ **Refund Transfer Center Routes** - Status tracking, submission, approval  
✅ **Database Schema** - 13 new tables (tax_returns, client_documents, refund_transfers, etc.)  
✅ **SoD Enforcement** - Automated checks in approval workflow  
✅ **Audit Trail** - Complete logging in access_audit_log and transfer_timeline  

**Ready to Use:**
- POST /api/portal/dashboard
- POST /api/portal/documents/upload
- POST /api/refund-transfer/request (Preparer)
- POST /api/refund-transfer/approve/:transferId (Supervisor with SoD check)
- GET /api/refund-transfer/fee-disclosure (Public)
