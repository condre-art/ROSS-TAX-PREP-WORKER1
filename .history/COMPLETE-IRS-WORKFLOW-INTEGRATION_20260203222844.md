# Complete System Integration Guide - IRS Tracking & Workflows

## ✅ Fixed Issues

### 1. Client ID Schema Mismatch - RESOLVED
**Problem:** `clients` table was using `INTEGER PRIMARY KEY AUTOINCREMENT` but UUID strings were being inserted.

**Solution:** Updated `schema.sql` to use `TEXT PRIMARY KEY` for `clients.id` and all foreign key references.

**Affected Tables:**
- `clients` - Primary key changed to TEXT
- `returns` - `client_id` foreign key changed to TEXT
- `messages` - `client_id` foreign key changed to TEXT
- `invoices` - `client_id` foreign key changed to TEXT
- `documents` - `client_id` foreign key changed to TEXT
- `signatures` - `client_id` foreign key changed to TEXT
- `efile_submissions` - `client_id` foreign key changed to TEXT
- `efile_transmissions` - `client_id` foreign key changed to TEXT
- `workflow_tasks` - `client_id` foreign key changed to TEXT

**Migration Required:**
```bash
# Apply updated schema
npx wrangler d1 execute DB --file=schema.sql --local

# For production (BACKUP FIRST):
npx wrangler d1 backup DB
npx wrangler d1 execute DB --file=schema.sql
```

---

## 🔗 IRS.gov Integration

### "Where's My Refund" (WMR)

**Official URL:** https://www.irs.gov/refunds

**API Endpoints:**
- `GET /api/irs/refund-status/:clientId/:taxYear` - Check internal refund status
- `GET /api/irs/wheres-my-refund?ssn=XXX&filingStatus=XXX&refundAmount=XXX&taxYear=XXX` - Redirect helper

**Database Fields** (`efile_transmissions` table):
- `irs_refund_status` - Status from IRS (sent to bank, disbursed, check mailed, pending, rejected)
- `refund_method` - ACH, EFT, Check, Direct Deposit
- `refund_amount` - Dollar amount
- `refund_disbursed_at` - Timestamp when disbursed
- `refund_trace_id` - Bank trace number
- `refund_notes` - Additional notes

**Client Portal Integration:**
```html
<!-- In client portal dashboard -->
<div class="refund-tracker">
  <h3>🔍 Where's My Refund?</h3>
  <button onclick="checkRefund(2024)">Check 2024 Refund Status</button>
  <a href="/api/irs/wheres-my-refund?..." target="_blank">Check on IRS.gov</a>
</div>

<script>
async function checkRefund(taxYear) {
  const response = await fetch(`/api/irs/refund-status/${clientId}/${taxYear}`);
  const data = await response.json();
  if (data.success) {
    alert(`Status: ${data.message}\nAmount: ${data.data.refundAmountFormatted}`);
  }
}
</script>
```

---

### "Where's My Amended Return" (WMAR)

**Official URL:** https://www.irs.gov/filing/wheres-my-amended-return

**API Endpoints:**
- `GET /api/irs/amended-status/:clientId/:taxYear` - Check amended return status
- `GET /api/irs/wheres-my-amended-return?ssn=XXX&dob=XXX&zipCode=XXX&taxYear=XXX` - Redirect helper

**Database Fields** (`returns` table):
- `is_amended` - 0 = original, 1 = amended (Form 1040-X)
- `original_return_id` - Links amended return to original
- `form_type` - '1040X' for amended individual returns

**Processing Timeline:**
- **3 weeks** after filing: Available in WMAR system
- **Up to 16 weeks**: Standard processing time
- **20+ weeks**: Complex returns or errors

**Client Portal Integration:**
```html
<div class="amended-tracker">
  <h3>📝 Where's My Amended Return?</h3>
  <p>Amended returns typically take 16 weeks to process.</p>
  <button onclick="checkAmended(2024)">Check Status</button>
  <a href="/api/irs/wheres-my-amended-return?..." target="_blank">Check on IRS.gov</a>
</div>
```

---

## 📋 Workflow & Task Assignment System

### Workflow Stages

**Automated progression through 13 stages:**

```
1. INTAKE → Client intake form received
2. DOCUMENTS_PENDING → Waiting for client uploads
3. DOCUMENTS_RECEIVED → All documents collected
4. ASSIGNED → Assigned to tax preparer
5. IN_PROGRESS → Preparer working on return
6. REVIEW_PENDING → Ready for quality review
7. IN_REVIEW → Under review by lead/ERO
8. REVISIONS_NEEDED → Corrections required
9. APPROVED → Approved for e-file
10. EFILE_PENDING → Queued for IRS submission
11. TRANSMITTED → Sent to IRS
12. ACCEPTED → IRS accepted return
13. COMPLETED → Fully completed
```

### Task Types

**8 automated task types:**
- `DOCUMENT_REQUEST` - Request W-2, 1099, receipts
- `PREPARE_RETURN` - Prepare tax return
- `REVIEW_RETURN` - Quality review
- `CLIENT_FOLLOW_UP` - Follow up with client
- `SIGNATURE_REQUEST` - DocuSign 8879
- `EFILE_SUBMISSION` - Submit to IRS
- `REFUND_TRACKING` - Monitor refund
- `QUALITY_REVIEW` - Final compliance check

### Priority Levels

- **URGENT** - Due within 24 hours
- **HIGH** - Due within 3 days
- **MEDIUM** - Due within 7 days
- **LOW** - Due within 14+ days

### Database Schema

**`workflow_tasks` table:**
```sql
CREATE TABLE workflow_tasks (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  client_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  assigned_to INTEGER, -- staff.id
  assigned_by INTEGER, -- staff.id
  due_date TEXT,
  completed_at TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

### API Endpoints

**Task Management:**
```
POST /api/workflow/tasks/create       - Create new task
PUT  /api/workflow/tasks/:id/assign   - Assign task to staff
PUT  /api/workflow/tasks/:id/status   - Update task status
GET  /api/workflow/tasks/my-tasks     - Get my assigned tasks
GET  /api/workflow/tasks/return/:id   - Get tasks for return
GET  /api/workflow/summary            - Dashboard summary
```

**Workflow Management:**
```
POST /api/workflow/advance            - Advance workflow stage
GET  /api/workflow/stages             - Get workflow stage counts
GET  /api/workflow/overdue            - Get overdue tasks count
```

### Usage Examples

**Create workflow when return is created:**
```typescript
import { createWorkflowForReturn } from './workflowManager';

// After creating return
const returnId = 12345;
const clientId = 'client-uuid-xxx';
const taxYear = 2024;

await createWorkflowForReturn(env, returnId, clientId, taxYear);
// Auto-creates initial tasks: Document Request
```

**Assign task to preparer:**
```typescript
import { assignTask } from './workflowManager';

const taskId = 'task-uuid-xxx';
const preparerId = 42; // staff.id
const managerId = 10; // who is assigning

await assignTask(env, taskId, preparerId, managerId);
// Sends notification to preparer
```

**Advance workflow:**
```typescript
import { advanceWorkflowStage, WorkflowStage } from './workflowManager';

await advanceWorkflowStage(
  env,
  returnId,
  WorkflowStage.IN_PROGRESS,
  WorkflowStage.REVIEW_PENDING,
  userId
);
// Auto-creates "Review Return" task
```

---

## 🎯 Staff Portal Integration

### Dashboard Widgets

**Workflow Summary:**
```html
<div class="workflow-summary">
  <h3>Workflow Overview</h3>
  <div class="stages">
    <div class="stage">
      <span class="count">24</span>
      <span class="label">In Progress</span>
    </div>
    <div class="stage urgent">
      <span class="count">8</span>
      <span class="label">Review Pending</span>
    </div>
    <div class="stage">
      <span class="count">12</span>
      <span class="label">E-file Pending</span>
    </div>
  </div>
</div>
```

**My Tasks Widget:**
```html
<div class="my-tasks">
  <h3>My Tasks (6)</h3>
  <ul>
    <li class="urgent">
      <span class="icon">🔴</span>
      <span class="title">Review Return - Client Smith (Due: Today)</span>
      <button onclick="startTask('task-uuid')">Start</button>
    </li>
    <li class="high">
      <span class="icon">🟡</span>
      <span class="title">Prepare Return - Client Doe (Due: Mar 5)</span>
      <button onclick="startTask('task-uuid')">Start</button>
    </li>
  </ul>
</div>
```

### Task Actions

```javascript
// Mark task in progress
async function startTask(taskId) {
  await fetch(`/api/workflow/tasks/${taskId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'in_progress' })
  });
}

// Complete task
async function completeTask(taskId, notes) {
  await fetch(`/api/workflow/tasks/${taskId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed', notes })
  });
}
```

---

## 📊 Client Portal Features

### Refund Tracking

**Client Dashboard:**
```html
<div class="refund-section">
  <h2>Tax Return Status</h2>
  
  <!-- 2024 Return -->
  <div class="return-card">
    <h3>2024 Tax Year</h3>
    <div class="status">
      <span class="badge accepted">✅ Accepted by IRS</span>
    </div>
    
    <div class="refund-info">
      <p><strong>Refund Amount:</strong> $3,245.00</p>
      <p><strong>Status:</strong> Disbursed to Bank</p>
      <p><strong>Disbursed:</strong> February 28, 2025</p>
    </div>
    
    <div class="actions">
      <button onclick="checkRefund(2024)">Check Status</button>
      <a href="/api/irs/wheres-my-refund?..." target="_blank">
        Check on IRS.gov →
      </a>
    </div>
  </div>
  
  <!-- 2023 Amended Return -->
  <div class="return-card">
    <h3>2023 Tax Year (Amended)</h3>
    <div class="status">
      <span class="badge processing">⏳ Processing</span>
    </div>
    
    <div class="amended-info">
      <p><strong>Filed:</strong> December 15, 2025</p>
      <p><strong>Estimated Completion:</strong> April 2026 (16 weeks)</p>
    </div>
    
    <div class="actions">
      <button onclick="checkAmended(2023)">Check Status</button>
      <a href="/api/irs/wheres-my-amended-return?..." target="_blank">
        Check on IRS.gov →
      </a>
    </div>
  </div>
</div>
```

---

## 🔐 Security & Access Control

### Role-Based Task Assignment

**Admin/Manager:**
- Create tasks
- Assign to anyone
- View all tasks
- Override priorities
- Cancel/modify any task

**Preparer:**
- View own assigned tasks
- Update task status (in_progress, completed)
- Add notes to tasks
- Cannot assign tasks

**Client:**
- View return status
- View refund tracking
- Cannot access workflow/tasks

### Task Assignment Rules

```typescript
// Only managers/admins can assign tasks
if (user.role !== 'admin' && user.role !== 'manager') {
  return new Response('Forbidden', { status: 403 });
}

// Preparers can only update their own tasks
if (user.role === 'preparer' && task.assigned_to !== user.id) {
  return new Response('Forbidden', { status: 403 });
}
```

---

## 🚀 Deployment Checklist

### Database Migration

```bash
# 1. Apply schema updates (includes workflow_tasks table)
npx wrangler d1 execute DB --file=schema.sql --local

# 2. Test locally
npm run dev

# 3. Apply to production (BACKUP FIRST!)
npx wrangler d1 backup DB
npx wrangler d1 execute DB --file=schema.sql
```

### Worker Deployment

```bash
# 1. Build worker with new routes
npm run build

# 2. Deploy to Cloudflare
npm run deploy

# 3. Verify new routes
curl https://api.rosstaxprep.com/api/irs/refund-status/client-123/2024
curl https://api.rosstaxprep.com/api/workflow/summary
```

### Environment Variables

```bash
# IRS integration (already set)
# - ENCRYPTION_KEY
# - JWT_SECRET
# - IRS_MEF_CERT / IRS_MEF_KEY

# Payment gateways (production keys)
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put SQUARE_ACCESS_TOKEN
npx wrangler secret put PAYPAL_CLIENT_ID

# Email notifications
npx wrangler secret put MAILCHANNELS_API_KEY
```

---

## 📝 Next Steps

1. ✅ **Client ID fixed** - Schema updated to TEXT PRIMARY KEY
2. ✅ **IRS tracking integrated** - WMR and WMAR redirect helpers
3. ✅ **Workflow system created** - 13 stages, 8 task types
4. ✅ **Task assignment implemented** - Priority-based queue

### Remaining Tasks:

- [ ] **Frontend UI** - Build React components for:
  - Task dashboard (staff portal)
  - Refund tracker (client portal)
  - Workflow progress visualization
  
- [ ] **Email Notifications** - Send alerts when:
  - Task assigned
  - Task overdue
  - Refund status changes
  - Workflow advances
  
- [ ] **IRS API Sync** (if available) - Auto-update refund statuses from IRS
  - Currently manual update via `/api/irs/update-refund-status`
  
- [ ] **Mobile App** - Mobile notifications for tasks and refunds

---

## 📚 Documentation Files

- **[SERVICES-WORKFLOW-ROLES-PERMISSIONS.md](SERVICES-WORKFLOW-ROLES-PERMISSIONS.md)** - Complete system architecture
- **[LOGO-BRANDING-COMPLETE.md](LOGO-BRANDING-COMPLETE.md)** - Logo and branding guide
- **[LMS-DEPLOYMENT-COMPLETE.md](LMS-DEPLOYMENT-COMPLETE.md)** - Academy deployment (updated with production keys)
- **[schema.sql](schema.sql)** - Database schema (client_id fixed, workflow_tasks added)
- **[src/irsRefundTracking.ts](src/irsRefundTracking.ts)** - IRS WMR/WMAR integration
- **[src/routes/irsTracking.ts](src/routes/irsTracking.ts)** - IRS API routes
- **[src/workflowManager.ts](src/workflowManager.ts)** - Workflow and task management

---

**Last Updated:** February 3, 2026  
**Status:** ✅ Fully Integrated - Ready for Testing  
**Next Deploy:** After frontend UI complete
