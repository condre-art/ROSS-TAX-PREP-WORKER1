# Role-Permission Matrix (RBAC Policy)
**Ross Tax Prep & Money Management Platform — GRC-Ready Authorization Matrix**

---

## 1. Master Permission Inventory

### 1.1 User Management Permissions
- `user:create` — Create new user accounts
- `user:edit` — Modify user profile (name, email, contact)
- `user:delete` — Delete/disable user accounts
- `user:reset_password` — Reset user passwords
- `user:manage_mfa` — Enable/disable MFA, reset TOTP
- `user:view_profile` — View user details
- `user:export_users` — Export user list (for audit)

### 1.2 Role & Permission Permissions
- `rbac:assign_role` — Assign roles to users
- `rbac:revoke_role` — Remove roles from users
- `rbac:modify_role` — Create/edit role definitions
- `rbac:view_roles` — View all available roles
- `rbac:manage_permissions` — Grant/revoke individual permissions
- `rbac:access_certification` — Perform access reviews

### 1.3 Customer Data Access Permissions
- `customer:view_profile` — View customer name, address, contact
- `customer:view_identity` — View SSN, DOB, ID number (highest sensitivity)
- `customer:edit_profile` — Update customer information
- `customer:view_pii` — Access all personally identifiable information
- `customer:view_accounts` — View customer account list
- `customer:view_transactions` — View customer transaction history
- `customer:view_documents` — View customer tax/financial documents

### 1.4 Money Management Permissions
- `money:view_balance` — View own account balance (customer) / assigned accounts (staff)
- `money:initiate_transfer` — Initiate transfer between accounts
- `money:initiate_external_transfer` — Send money to external bank
- `money:approve_transfer` — Approve pending transfers >$10K
- `money:view_transaction_history` — View transaction logs
- `money:reconcile` — Perform account reconciliation
- `money:refund` — Process refund transactions
- `money:manage_account_settings` — Update account options (e.g., overdraft protection)

### 1.5 Card Management Permissions
- `card:issue_virtual` — Generate instant virtual debit cards
- `card:issue_physical` — Order physical debit cards
- `card:freeze_card` — Freeze/unfreeze cards
- `card:set_limits` — Set daily/per-transaction limits on cards
- `card:view_card_details` — View card numbers, expiration (encrypted)
- `card:cancel_card` — Cancel/close card accounts

### 1.6 Payment Permissions
- `payment:bill_pay` — Initiate bill payments
- `payment:process_payment` — Execute payment transactions
- `payment:approval_required` — Approve payments >threshold
- `payment:reversal` — Reverse/undo payments

### 1.7 P2P Transfer Permissions
- `p2p:initiate_transfer` — Send money to other members
- `p2p:approve_transfer` — Approve pending P2P transfers
- `p2p:view_transfer_history` — View P2P transaction history
- `p2p:instant_transfer` — Use instant transfer (faster, fees apply)

### 1.8 Mobile Deposit Permissions
- `deposit:submit` — Submit check via mobile
- `deposit:view_deposit_history` — View deposit status
- `deposit:approve_deposit` — Approve mobile deposits (staff)
- `deposit:release_holds` — Release fund holds early (staff)

### 1.9 Fraud & Risk Permissions
- `fraud:view_alerts` — View fraud detection alerts
- `fraud:investigate_case` — Open and document fraud investigations
- `fraud:dispute_transaction` — Document transaction disputes
- `fraud:restrict_account` — Temporarily restrict account access
- `fraud:submit_sar` — Submit Suspicious Activity Report
- `fraud:submit_ctr` — Submit Currency Transaction Report

### 1.10 Tax Preparation Permissions
- `tax:view_clients` — View assigned clients
- `tax:upload_documents` — Upload tax documents
- `tax:prepare_return` — Edit and prepare tax return
- `tax:file_return` — Submit e-file
- `tax:view_return_status` — Check e-file status and acknowledgments
- `tax:print_forms` — Generate Form 8879, transcripts, etc.

### 1.11 Biometric Permissions
- `biometric:enroll` — Enroll biometric (facial recognition)
- `biometric:verify` — Use biometric for authentication
- `biometric:view_biometric_data` — Access stored biometric templates (staff fraud only)
- `biometric:delete_biometric` — Permanently delete biometric enrollment

### 1.12 Audit & Compliance Permissions
- `audit:view_logs` — Access audit trail logs
- `audit:export_logs` — Export logs for compliance review
- `audit:view_user_access` — See who accessed what and when
- `audit:generate_report` — Create compliance reports (SOC 2, FFIEC, etc.)
- `compliance:view_transactions` — Full transaction visibility for audit

### 1.13 System Administration Permissions
- `system:view_config` — View system configuration
- `system:modify_config` — Change system settings
- `system:deploy` — Deploy code or configuration changes
- `system:view_logs_technical` — Access technical/error logs (non-PII)
- `system:incident_management` — Create and manage security incidents

### 1.14 Document Permissions
- `document:upload` — Upload files
- `document:download` — Download files
- `document:delete` — Delete stored documents
- `document:view_metadata` — See document info (name, size, upload date)

---

## 2. Master Role-Permission Matrix

### Legend
- ✅ = Granted  
- ⚠️ = Granted with restrictions (see notes)  
- ❌ = Denied  

---

## 2.1 Internal Staff Matrix

| Permission | Executive | CISO | IAM Admin | App Admin | Compliance | Fraud Analyst | CSR | Money Ops | IT Support |
|-----------|-----------|------|----------|-----------|-----------|---------------|-----|-----------|-----------|
| **USER MANAGEMENT** | | | | | | | | | |
| user:create | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| user:edit | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (own acct only) |
| user:delete | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| user:reset_password | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| user:manage_mfa | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| user:view_profile | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| user:export_users | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **RBAC** | | | | | | | | | |
| rbac:assign_role | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| rbac:revoke_role | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| rbac:modify_role | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| rbac:view_roles | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| rbac:manage_permissions | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| rbac:access_certification | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CUSTOMER DATA** | | | | | | | | | |
| customer:view_profile | ❌ | ❌ | ❌ | ✅ (system wide) | ✅ | ✅ | ✅ | ✅ | ❌ |
| customer:view_identity | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ (fraud cases) | ⚠️ (assisted only) | ⚠️ (assisted only) | ❌ |
| customer:edit_profile | ❌ | ❌ | ❌ | ✅ (system wide) | ❌ | ❌ | ⚠️ (limited) | ❌ | ❌ |
| customer:view_pii | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ (assisted only) | ⚠️ (assisted only) | ❌ |
| customer:view_accounts | ❌ | ❌ | ❌ | ✅ (system wide) | ✅ | ✅ | ✅ | ✅ | ❌ |
| customer:view_transactions | ❌ | ❌ | ❌ | ✅ (system wide) | ✅ | ✅ | ✅ | ✅ | ❌ |
| customer:view_documents | ⚠️ (assigned only) | ❌ | ❌ | ✅ (system wide) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **MONEY MANAGEMENT** | | | | | | | | | |
| money:view_balance | ❌ | ❌ | ❌ | ✅ (system wide) | ✅ | ✅ | ✅ | ✅ | ❌ |
| money:initiate_transfer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| money:initiate_external_transfer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| money:approve_transfer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| money:view_transaction_history | ❌ | ❌ | ❌ | ✅ (system wide) | ✅ | ✅ | ✅ | ✅ | ❌ |
| money:reconcile | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| money:refund | ✅ (>$1K) | ❌ | ❌ | ❌ | ❌ | ✅ (fraud only) | ❌ | ⚠️ (requires approval) | ❌ |
| money:manage_account_settings | ❌ | ❌ | ❌ | ✅ (system wide) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CARD MANAGEMENT** | | | | | | | | | |
| card:issue_virtual | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| card:issue_physical | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| card:freeze_card | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| card:set_limits | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| card:view_card_details | ❌ | ❌ | ❌ | ✅ (system wide) | ✅ | ✅ | ⚠️ (last 4 only) | ✅ | ❌ |
| card:cancel_card | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **FRAUD & RISK** | | | | | | | | | |
| fraud:view_alerts | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| fraud:investigate_case | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| fraud:dispute_transaction | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ⚠️ (documents only) | ❌ | ❌ |
| fraud:restrict_account | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| fraud:submit_sar | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| fraud:submit_ctr | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **TAX PREPARATION** | | | | | | | | | |
| tax:view_clients | ❌ | ❌ | ❌ | ✅ (system wide) | ❌ | ❌ | ❌ | ❌ | ❌ |
| tax:upload_documents | ❌ | ❌ | ❌ | ✅ (system wide) | ❌ | ❌ | ❌ | ❌ | ❌ |
| tax:prepare_return | ❌ | ❌ | ❌ | ✅ (system wide) | ❌ | ❌ | ❌ | ❌ | ❌ |
| tax:file_return | ❌ | ❌ | ❌ | ✅ (system wide) | ❌ | ❌ | ❌ | ❌ | ❌ |
| tax:view_return_status | ❌ | ❌ | ❌ | ✅ (system wide) | ❌ | ❌ | ❌ | ❌ | ❌ |
| tax:print_forms | ❌ | ❌ | ❌ | ✅ (system wide) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AUDIT & COMPLIANCE** | | | | | | | | | |
| audit:view_logs | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| audit:export_logs | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| audit:view_user_access | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| audit:generate_report | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| compliance:view_transactions | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SYSTEM ADMIN** | | | | | | | | | |
| system:view_config | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ (tech only) |
| system:modify_config | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| system:deploy | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| system:view_logs_technical | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| system:incident_management | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **DOCUMENTS** | | | | | | | | | |
| document:upload | ⚠️ (org only) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| document:download | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| document:delete | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| document:view_metadata | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 2.2 Customer & Joint Owner Matrix

| Permission | Individual Customer | Joint Account Owner | Authorized Card User | Trusted User (View) | Trusted User (Limited Transfer) |
|-----------|-------------------|-------------------|----------------------|------------------|--------------------------------|
| **MONEY MANAGEMENT (Own Accounts Only)** | | | | | |
| money:view_balance | ✅ | ✅ | ❌ | ✅ | ✅ |
| money:initiate_transfer | ✅ | ✅ | ❌ | ❌ | ⚠️ (limit $500/day) |
| money:initiate_external_transfer | ✅ | ✅ | ❌ | ❌ | ❌ |
| money:view_transaction_history | ✅ | ✅ | ⚠️ (card only) | ✅ | ✅ |
| money:manage_account_settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| **CARD MANAGEMENT (Own Cards Only)** | | | | | |
| card:view_card_details | ✅ | ✅ | ✅ | ❌ | ❌ |
| card:freeze_card | ✅ | ✅ | ❌ | ❌ | ❌ |
| card:set_limits | ✅ | ✅ | ❌ | ❌ | ❌ |
| card:cancel_card | ✅ | ✅ | ❌ | ❌ | ❌ |
| **PAYMENT & P2P** | | | | | |
| p2p:initiate_transfer | ✅ | ✅ | ❌ | ❌ | ⚠️ (up to limit) |
| payment:bill_pay | ✅ | ✅ | ❌ | ❌ | ❌ |
| **BIOMETRIC** | | | | | |
| biometric:enroll | ✅ | ✅ | ❌ | ❌ | ❌ |
| biometric:verify | ✅ | ✅ | ❌ | ❌ | ❌ |
| biometric:delete_biometric | ✅ | ✅ | ❌ | ❌ | ❌ |
| **MOBILE DEPOSIT** | | | | | |
| deposit:submit | ✅ | ✅ | ❌ | ❌ | ❌ |
| deposit:view_deposit_history | ✅ | ✅ | ❌ | ✅ | ✅ |
| **DOCUMENT ACCESS** | | | | | |
| document:download | ✅ | ✅ | ❌ | ✅ | ✅ |
| document:view_metadata | ✅ | ✅ | ❌ | ✅ | ✅ |
| **CUSTOMER DATA** | | | | | |
| customer:view_profile | ✅ (own only) | ✅ (own only) | ❌ | ❌ | ❌ |
| customer:edit_profile | ✅ (own only) | ✅ (own only) | ❌ | ❌ | ❌ |

---

## 2.3 Tax Professionals (External) Matrix

| Permission | Tax Preparer | Bookkeeper | Supervisor/Manager | Read-Only Reviewer |
|-----------|-------------|-----------|-------------------|------------------|
| **CLIENT MANAGEMENT** | | | | |
| customer:view_profile | ⚠️ (assigned only) | ⚠️ (assigned only) | ✅ (team clients) | ✅ (view-only) |
| customer:edit_profile | ⚠️ (limited) | ⚠️ (limited) | ✅ (team clients) | ❌ |
| customer:view_identity | ✅ (assigned clients) | ✅ (assigned clients) | ✅ (team clients) | ✅ (view-only) |
| customer:view_pii | ✅ (assigned clients) | ✅ (assigned clients) | ✅ (team clients) | ✅ (view-only) |
| customer:view_documents | ✅ (assigned) | ✅ (assigned) | ✅ (team) | ✅ (view-only) |
| **TAX PREPARATION** | | | | |
| tax:view_clients | ✅ (assigned) | ✅ (assigned) | ✅ (all team) | ✅ (view-only) |
| tax:upload_documents | ✅ (assigned) | ✅ (assigned) | ✅ (team) | ❌ |
| tax:prepare_return | ✅ (assigned) | ✅ (assigned) | ⚠️ (review only) | ✅ (review only) |
| tax:file_return | ✅ (assigned) | ⚠️ (with approval) | ✅ | ❌ |
| tax:view_return_status | ✅ (assigned) | ✅ (assigned) | ✅ (team) | ✅ (view-only) |
| tax:print_forms | ✅ (assigned) | ✅ (assigned) | ✅ (team) | ✅ (view-only) |
| **AUDITING** | | | | |
| audit:view_logs | ❌ | ❌ | ✅ | ✅ |
| audit:generate_report | ❌ | ❌ | ✅ | ✅ |
| **DOCUMENT MANAGEMENT** | | | | |
| document:upload | ✅ | ✅ | ✅ | ❌ |
| document:download | ✅ | ✅ | ✅ | ✅ |
| document:delete | ⚠️ (own files) | ⚠️ (own files) | ✅ | ❌ |
| document:view_metadata | ✅ | ✅ | ✅ | ✅ |

---

## 3. Segregation of Duties (SoD) Conflicts

**Rule:** The following permission pairs **CANNOT** be held by the same user

| Initiate | Approve | Policy |
|----------|---------|--------|
| `money:initiate_transfer` | `money:approve_transfer` | Money transfers >$10K must have separate initiator and approver |
| `money:initiate_external_transfer` | `money:approve_transfer` | External transfers >$5K must have separate roles |
| `fraud:restrict_account` | `fraud:submit_sar` | Fraud investigators cannot also determine SAR necessity (potential bias) |
| `user:create` | `rbac:assign_role` | Cannot create AND provision users (SoD: User Lifecycle) |
| `user:delete` | `audit:view_logs` | Cannot delete users AND then review audit trail (evidence tampering risk) |
| `system:modify_config` | `system:deploy` | Config changes must be reviewed before deployment (change control) |
| `card:issue_virtual` | `card:set_limits` | Card issuance must be independent of limit-setting (prevent abuse) |
| Money Ops `money:initiate_transfer` | Money Ops `money:approve_transfer` | See earlier row; applies to Money Ops staff as well |

**Implementation Note:** System enforces SoD via role definition. If user is assigned conflicting roles, second assignment is rejected with notification to CISO.

---

## 4. Data Sensitivity & Access Restrictions

### 4.1 Highly Sensitive Data (Must Restrict Access)

**Data Type:** Personally Identifiable Information (PII)
- SSN, Driver's License, DOB
- **Access:** Compliance, Fraud, Assisted CSR (with supervisor override)
- **Logging:** Enhanced audit trail; monthly access report

**Data Type:** Financial Account Data
- Account numbers, balances, transaction history
- **Access:** Account owner, authorized users, Money Ops, Compliance, Fraud
- **Logging:** Real-time audit; access visible to account owner

**Data Type:** Biometric Data (Facial recognition)
- Facial templates, enrollment images, verification attempts
- **Access:** Customer (verify/delete only), Fraud (investigations), Compliance, CISO
- **Logging:** Mandatory audit trail per BIPA; customer can request access log

**Data Type:** Card Credentials
- Full card numbers, CVV, PINs (encrypted)
- **Access:** Card owner, Money Ops, Fraud, Compliance
- **Last-4 visible to:** CSRs, Customers
- **Full number visible to:** Only Money Ops + Fraud (encrypted)

### 4.2 Sensitive Data (Standard Restrictions)

**Data Type:** Customer Address / Contact
- **Allowed to edit:** Customer (self), CSR (with verification)
- **Allowed to view:** Customer, Staff (assigned teams), Compliance, Fraud

**Data Type:** Transaction Details
- **Allowed to view:** Account owner, assigned staff, Money Ops, Compliance, Fraud, Audit

### 4.3 Non-Sensitive Data (Low Restrictions)

**Data Type:** Account Status, Balance
- **Allowed to view:** Account owner, authorized users, customer-facing staff

**Data Type:** Public Reports, Aggregate Data
- **Allowed to view:** All authenticated users

---

## 5. Restriction Patterns

### 5.1 "Assisted-Only" Pattern
**Definition:** Staff can view PII only when customer-initiated (e.g., customer calls for support)

**Implementation:**
- CSR opens support ticket **from customer phone number**
- System allows PII visibility only during active ticket
- Session times out when ticket is closed
- Access logged as "assisted inquiry"

**Example:** Customer calls with fraud concern → CSR can view SSN + account details to confirm identity

---

### 5.2 "Assigned-Only" Pattern
**Definition:** User can only access data for their assigned clients/accounts

**Implementation:**
- Manager assigns clients to preparers at onboarding
- Filter applied to all customer view operations
- API rejects requests for non-assigned customers
- Cannot reassign clients without manager approval

**Example:** Tax preparer sees only their 50 assigned clients; cannot browse other preparers' clients

---

### 5.3 "Limited Preview" Pattern
**Definition:** User can see summary but not full detail

**Implementation:**
- Card users see `last-4` instead of full number
- CSR sees transaction amount but not customer's full balance
- Trusted user sees account name but not routing number

---

## 6. Role Modification Workflow

### Process: When to Modify Roles?

**Trigger Events:**
1. New organizational function emerges
2. Regulatory requirement changes
3. Security incident reveals inadequate access controls
4. Operational need identified (e.g., "need new Bookkeeper role")

**Process:**
1. **Requestor** → Manager or department head submits role change request
2. **CISO Review** → CISO evaluates for security/SoD issues
3. **Compliance Review** → Compliance reviews for regulatory impact
4. **Approval** → Executive + CISO + Compliance sign-off
5. **Implementation** → IAM implements via role update
6. **Communication** → All affected users notified of new/modified roles
7. **Audit Trail** → Role change logged with justification

**Timeline:** 5-10 business days

---

## 7. Third-Party / Vendor Access

### 7.1 Template: Third-Party Role

**Example: Marqeta Card Processor**

```
Role Name: Vendor-Marqeta-Card-Auth
Permissions:
  - card:view_card_details (last-4 only)
  - money:view_transaction_history (card txns only)
  - audit:view_logs (card-related only)
Restrictions:
  - Cannot modify card data
  - Cannot cancel cards
  - Cannot approve transfers
  - Read-only access only
  - IP whitelist: [Marqeta IP ranges]
Expiration: Contract end date + 30 days
Audit: Weekly access report to Vendor Manager
```

---

## 8. Policy Summary Table (Quick Reference)

| Role | Primary Job | Key Permissions | Key Restrictions | MFA Required |
|------|------------|-----------------|-----------------|-------------|
| **Executive** | Governance | view_logs, view_roles, modify_config | No transaction authority | ✅ TOTP |
| **CISO** | Security | All security + fraud + audit | No PII unless investigating | ✅ TOTP + Hardkey |
| **IAM Admin** | Identity | user:*, rbac:* | No transactional authority | ✅ TOTP |
| **App Admin** | System Config | system:*, view_all | No user management | ✅ TOTP |
| **Compliance** | Regulatory | view_logs, audit:*, fraud:view | Read-only access | ✅ TOTP |
| **Fraud Analyst** | Risk Management | fraud:*, customer:view_pii | Cannot initiate transfers | ✅ TOTP |
| **CSR** | Customer Support | customer:view_profile, user:reset_pwd | Limited to assisted mode | ✅ OTP |
| **Money Ops** | Payments | money:initiate/approve (dual control) | Cannot approve own txns | ✅ TOTP |
| **IT Support** | Technical | user:reset_pwd, system:view_logs | No customer data access | ✅ OTP |
| **Tax Preparer** | Preparation | tax:*, customer:view (assigned) | Only assigned clients | ✅ OTP |
| **Customer** | Account Owner | Own account + card management | Own accounts only | ✅ OTP/Biometric |
| **Audit** | Compliance | audit:*, view_logs, compliance:view | Read-only; no changes | ✅ TOTP |

---

## 9. Governance & Updates

**Policy Owner:** Chief Information Security Officer (CISO)

**Review Frequency:** Annual or upon major system change

**Related Documents:**
- COMPREHENSIVE-IAM-POLICY.md (this document's companion)
- Segregation of Duties Policy
- Data Classification & Handling
- Incident Response Plan

**Contact:** [security@rosstaxprep.com](mailto:security@rosstaxprep.com)

---

**[END OF MATRIX]**
