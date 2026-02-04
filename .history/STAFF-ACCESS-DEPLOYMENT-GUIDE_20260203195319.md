# STAFF ACCESS MANAGEMENT & SEAT LICENSING - DEPLOYMENT GUIDE

## 🎯 System Overview

Complete IRS Pub 4557 compliant staff access management system for ROSS Tax & Bookkeeping, covering:
- ✅ Firm Profile & EFIN Tracking
- ✅ Software Seat Licensing
- ✅ Staff Member Management
- ✅ Role Alignment (TaxSlayer ↔ CRM)
- ✅ Seasonal Staff Tracking
- ✅ Access Request Workflow
- ✅ Onboarding Checklists
- ✅ Compliance Auditing

---

## 📊 Database Tables Created

### Core Tables (10)
1. **`firm_profile`** - Single firm with EFIN tracking
2. **`software_seats`** - License management (available/assigned/expired)
3. **`staff_members`** - Employee records with compliance docs
4. **`staff_access_requests`** - Access approval workflow
5. **`role_alignment`** - TaxSlayer ↔ CRM role mappings
6. **`staff_access_audit`** - Complete audit trail
7. **`seasonal_access_tracking`** - Nov 1 - Apr 30 enforcement
8. **`staff_onboarding_checklist`** - Pre/active/offboarding phases
9. **`seat_purchases`** - Purchase tracking
10. **`compliance_violations`** - IRS reportable incidents

### Views (2)
- **`v_active_staff_summary`** - Dashboard view
- **`v_seat_utilization`** - License utilization metrics

---

## 🚀 Deployment Steps

### Step 1: Apply Database Schema

```powershell
# Local database (development)
cd c:\Users\condr\OneDrive\Documents\GitHub\ROSS-TAX-PREP-WORKER1
npx wrangler d1 execute DB --file="schema/staff-access-management.sql" --local

# Production database
npx wrangler d1 execute DB --file="schema/staff-access-management.sql" --remote
```

### Step 2: Verify Tables Created

```powershell
# Check tables exist
npx wrangler d1 execute DB --command="SELECT name FROM sqlite_master WHERE type='table'" --local
```

Expected output should include all 10 tables above.

### Step 3: Verify Default Data

```sql
-- Should return 1 firm record
SELECT * FROM firm_profile;

-- Should return 1 owner seat
SELECT * FROM software_seats;

-- Should return 5 role mappings
SELECT * FROM role_alignment;
```

---

## 👥 Role Hierarchy

| TaxSlayer Role | CRM Role | System Role | Level | Permissions |
|---------------|----------|-------------|-------|-------------|
| **Firm Administrator** | OWNER | owner | 5 | Full access, billing, contracts |
| **Office Administrator** | OPERATIONS | admin | 4 | Client workflow, reporting |
| **Reviewer** | QA-REVIEWER | ero | 3 | Read-only + transmission rights |
| **Preparer** | TAX-PREPARER | preparer | 2 | Assigned clients only |
| **Assistant** | INTAKE | client | 1 | Intake forms, no SSN access |

---

## 🔐 Compliance Requirements (IRS Pub 4557)

### ✅ Enforced by System
- **Unique Login Per User** - No shared credentials (table constraint)
- **Audit Trail** - All access logged to `staff_access_audit`
- **Least Privilege** - Role-based permissions enforced
- **Seasonal Boundaries** - Auto-expire Apr 30 (trigger)
- **Background Checks** - Tracked in `staff_members`
- **NDA/Agreement** - Required before access

### ⚠️ Absolute Prohibitions
- ❌ Shared logins (violates IRS security)
- ❌ Admin access for seasonal staff
- ❌ Bank product access without approval
- ❌ Transmission rights for assistants

---

## 📅 Seasonal Staff Workflow

### Onboarding Timeline
```
Nov 1 ────────→ Jan 15 ────────→ Apr 30
(Earliest)    (Latest Onboard)  (Auto-Expire)
```

### Required Before Access
1. ✅ Seat purchased
2. ✅ NDA signed
3. ✅ Engagement agreement signed
4. ✅ Background check (if required)
5. ✅ Role approved
6. ✅ No same-day access

### Automatic Actions
- **Apr 30**: Access auto-revoked (trigger)
- **Status**: Changed to 'inactive'
- **Audit**: Logged as 'seasonal_expiration'

---

## 🧾 Access Request Flow

### Step 1: Manager Submits Request
```sql
INSERT INTO staff_access_requests (
    request_number,
    requested_for_name,
    requested_for_email,
    requested_role,
    requested_access_level,
    business_justification,
    requested_by
) VALUES (
    'REQ-' || datetime('now'),
    'John Doe',
    'john@example.com',
    'preparer',
    'limited',
    'Need additional preparer for tax season',
    <manager_user_id>
);
```

### Step 2: Firm Admin Reviews
```sql
UPDATE staff_access_requests
SET request_status = 'under_review',
    reviewed_by = <admin_user_id>,
    reviewed_date = datetime('now')
WHERE request_id = <request_id>;
```

### Step 3: Check Seat Availability
```sql
SELECT * FROM v_seat_utilization WHERE seat_type = 'preparer';
```

### Step 4: Purchase Seat (if needed)
```sql
INSERT INTO seat_purchases (
    firm_id, purchase_order_number, purchase_date,
    quantity_purchased, seat_type, unit_price, total_cost,
    billing_cycle, payment_status, purchased_by
) VALUES (
    1, 'PO-2026-001', date('now'),
    1, 'preparer', 500.00, 500.00,
    'annual', 'paid', <admin_user_id>
);
```

### Step 5: Approve & Assign
```sql
-- Approve request
UPDATE staff_access_requests
SET request_status = 'approved',
    approved_by = <admin_user_id>,
    approved_date = datetime('now'),
    seat_purchased = 1
WHERE request_id = <request_id>;

-- Create staff member
INSERT INTO staff_members (
    user_id, firm_id, employment_type, hire_date,
    taxslayer_role, access_level,
    created_by, approved_by
) VALUES (
    <user_id>, 1, 'full_time', date('now'),
    'preparer', 'limited',
    <admin_user_id>, <admin_user_id>
);

-- Assign seat
UPDATE software_seats
SET seat_status = 'assigned',
    assigned_user_id = <user_id>,
    assigned_date = datetime('now')
WHERE seat_id = <available_seat_id>;
```

---

## 📊 Reporting Queries

### Active Staff Report
```sql
SELECT * FROM v_active_staff_summary;
```

### Seat Utilization
```sql
SELECT * FROM v_seat_utilization;
```

### Pending Access Requests
```sql
SELECT 
    request_number,
    requested_for_name,
    requested_role,
    business_justification,
    request_status,
    requested_date
FROM staff_access_requests
WHERE request_status IN ('pending', 'under_review')
ORDER BY requested_date;
```

### Seasonal Staff Expiring Soon
```sql
SELECT 
    sm.employee_id,
    u.email,
    sat.access_expires_date,
    julianday(sat.access_expires_date) - julianday('now') AS days_until_expiration
FROM seasonal_access_tracking sat
JOIN staff_members sm ON sat.staff_id = sm.staff_id
JOIN users u ON sm.user_id = u.user_id
WHERE sat.offseason_access_revoked = 0
  AND sat.access_expires_date <= date('now', '+30 days')
ORDER BY sat.access_expires_date;
```

### Compliance Violations
```sql
SELECT 
    violation_type,
    violation_severity,
    violation_description,
    detected_date,
    resolved
FROM compliance_violations
WHERE resolved = 0
ORDER BY violation_severity DESC, detected_date DESC;
```

---

## 🛡️ Audit Defense Checklist

During IRS or software audits, you must produce:

### ✅ User List
```sql
SELECT 
    employee_id,
    work_email,
    taxslayer_role,
    employment_status,
    hire_date,
    termination_date
FROM staff_members;
```

### ✅ Role Assignments
```sql
SELECT 
    sm.employee_id,
    ra.taxslayer_role,
    ra.crm_role,
    ra.description,
    sm.assigned_seat_id
FROM staff_members sm
JOIN role_alignment ra ON sm.taxslayer_role = ra.taxslayer_role;
```

### ✅ Access Dates
```sql
SELECT 
    user_id,
    audit_event_type,
    event_details,
    timestamp
FROM staff_access_audit
WHERE audit_event_type IN ('access_granted', 'seat_assigned')
ORDER BY timestamp;
```

### ✅ Termination Dates
```sql
SELECT 
    employee_id,
    termination_date,
    employment_status
FROM staff_members
WHERE employment_status IN ('inactive', 'terminated');
```

---

## 🔄 Maintenance Tasks

### Daily
- [ ] Check pending access requests
- [ ] Review compliance violations
- [ ] Monitor seat utilization

### Weekly
- [ ] Audit seasonal staff expiration dates
- [ ] Review access audit logs
- [ ] Verify onboarding checklist completion

### Monthly
- [ ] Generate staff access report
- [ ] Review seat license renewals
- [ ] Audit background check expirations

### Quarterly
- [ ] IRS Pub 4557 compliance review
- [ ] Staff permission audit
- [ ] Seat purchase planning

---

## 🚨 Emergency Procedures

### Revoke Access Immediately
```sql
-- Mark staff as terminated
UPDATE staff_members
SET employment_status = 'terminated',
    termination_date = datetime('now')
WHERE user_id = <user_id>;

-- Unassign seat
UPDATE software_seats
SET seat_status = 'available',
    assigned_user_id = NULL
WHERE assigned_user_id = <user_id>;

-- Log audit event
INSERT INTO staff_access_audit (
    staff_id, user_id, audit_event_type,
    event_details, performed_by
) VALUES (
    <staff_id>, <user_id>, 'access_revoked',
    json_object('reason', 'emergency_termination'),
    <admin_user_id>
);
```

### Report Compliance Violation
```sql
INSERT INTO compliance_violations (
    staff_id, user_id, violation_type,
    violation_severity, violation_description,
    detected_by, irs_reportable
) VALUES (
    <staff_id>, <user_id>, 'unauthorized_access',
    'critical', 'Description of violation',
    'system', 1
);
```

---

## 📞 Support & Documentation

- **Schema File**: `schema/staff-access-management.sql`
- **IRS Pub 4557**: https://www.irs.gov/pub/irs-pdf/p4557.pdf
- **TaxSlayer Pro**: https://taxslayerpro.com

---

## ✅ Deployment Complete Checklist

- [ ] Schema applied to local database
- [ ] Schema applied to production database
- [ ] Default firm profile created
- [ ] Owner seat created
- [ ] Role alignment mappings verified
- [ ] Triggers active (seat assignment, seasonal expiration)
- [ ] Views created (active staff, seat utilization)
- [ ] Access request workflow tested
- [ ] Audit logging verified
- [ ] Documentation reviewed

---

**Last Updated**: February 3, 2026  
**Version**: 1.0.0  
**Compliance**: IRS Pub 4557 ✅
