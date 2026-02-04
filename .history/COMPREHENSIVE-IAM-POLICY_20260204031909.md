# Comprehensive Identity & Access Management (IAM) Policy
**Ross Tax Prep & Money Management Platform**

---

## 1. Executive Summary

This policy establishes the framework for managing digital identities, roles, and permissions across the Ross Tax Prep & Money Management Platform. The platform serves tax preparers, bookkeepers, and individual customers requiring secure access to financial services, tax preparation tools, and account management features.

**Policy Objective:**
- Protect customer financial data and PII
- Ensure regulatory compliance (FFIEC, SOC 2, NCUA, Regulation E/CC, BIPA, CCPA)
- Enforce least-privilege access across all environments
- Support audit trails and compliance reporting
- Prevent unauthorized transactions and data access

**Scope:** All employees, contractors, tax professionals, customers, and systems

---

## 2. Organizational Roles & Access Levels

### 2.1 Executive / System Owner
**Who:** C-suite, owners, board-level personnel

**Authority:**
- Policy approval and governance
- Regulatory compliance oversight
- System architecture decisions
- Budget and vendor management

**System Access:**
- No direct access to member financial data or transactional systems
- Read-only access to aggregate compliance reports
- Executive dashboards (high-level metrics only)

**Audit Trail:** ✅ All access logged; quarterly review

---

### 2.2 CISO / Head of Security
**Who:** Chief Information Security Officer or equivalent

**Authority:**
- Security policy development and enforcement
- Incident response leadership
- Third-party security assessment coordination
- MFA/SSO/PAM policy enforcement

**System Access:**
- Access to security logs and monitoring systems
- No access to customer PII or financial data
- Incident investigation authority

**Audit Trail:** ✅ Real-time access monitoring

---

### 2.3 Compliance & Risk Officer
**Who:** Chief Compliance Officer, Risk Manager

**Authority:**
- Regulatory requirement interpretation
- Internal audit oversight
- Suspicious activity reporting (SAR) coordination
- AML/KYC policy enforcement

**System Access:**
- Read-only access to all transaction data
- Real-time fraud/risk alerts
- SAR and CTR (Currency Transaction Report) generation authority

**Audit Trail:** ✅ Continuous access logging; monthly review

---

### 2.4 IAM / Identity Administrator
**Who:** Dedicated IAM team or IT security personnel

**Authority:**
- User account provisioning/deprovisioning
- Role assignment and modifications
- MFA and credential resets
- Access certification workflows
- No transactional authority

**System Access:**
- User lifecycle management system
- Role and permission repository
- MFA/SSO administration
- **NOT** customer financial data or transactional systems

**Audit Trail:** ✅ All user lifecycle events logged; daily review

---

### 2.5 Application Administrator
**Who:** System administrators, DevOps engineers

**Authority:**
- System configuration and deployment
- Feature flags and system settings
- Environment management (production, staging, dev)
- No access to customer data

**System Access:**
- Infrastructure monitoring
- Application configuration
- Non-financial logs and metrics
- **NOT** customer PII or financial records

**Audit Trail:** ✅ All configuration changes logged; change log maintained

---

### 2.6 Fraud & AML Analyst
**Who:** Dedicated fraud and compliance team

**Authority:**
- Real-time transaction monitoring
- Fraud case investigation
- Account restriction and temporary suspension
- SAR escalation
- Refund of fraudulent transactions

**System Access:**
- Customer profile (PII visible)
- Full transaction history
- Device fingerprint and geolocation data
- Fraud scoring systems
- Risk assessment tools

**Audit Trail:** ✅ All investigations logged; case-based audit trail

---

### 2.7 Customer Service Representative (CSR)
**Who:** Support staff, customer service team

**Authority:**
- Member account lookup
- General inquiries (balance, transaction history)
- Password resets and MFA enrollment
- Limited account updates (address, contact)
- **NO** authority over financial transactions

**System Access:**
- Customer profile (limited PII)
- Transaction history (view-only)
- Case management system
- Credential reset tools
- **NOT** payment or transfer authority

**Audit Trail:** ✅ All customer interactions logged; supervisor review

---

### 2.8 Money Operations / Back Office
**Who:** Payments team, settlement specialists

**Authority:**
- Initiate transfers, ACH, wire transfers
- Process refunds and adjustments
- Reconciliation and settlement
- **Dual-control approval required** for amounts >$10,000

**System Access:**
- Payment initiation system
- Settlement and clearing platform
- Transaction reconciliation reports
- **NOT** unilateral transaction authority for large amounts

**Audit Trail:** ✅ All transactions logged with dual approvals; real-time monitoring

---

### 2.9 Compliance & Audit
**Who:** Internal audit, external auditors, regulatory examiners

**Authority:**
- Evidence collection for compliance reviews
- Transaction sampling and testing
- Control effectiveness assessment
- Report generation for audits

**System Access:**
- Read-only across all systems
- Full transaction history
- User access logs
- Audit trail and evidence management system
- **NOT** system configuration or user management

**Audit Trail:** ✅ Audit access logged; separate immutable log for compliance

---

### 2.10 IT Support / Help Desk
**Who:** Level 1/Level 2 support technicians

**Authority:**
- Password resets (with identity verification)
- MFA troubleshooting
- General technical support
- No access to financial data

**System Access:**
- Credential management (resets only)
- Ticket management system
- Technical documentation
- **NOT** customer financial data or PII

**Audit Trail:** ✅ All support actions logged; supervised access

---

### 2.11 Tax Preparers / Bookkeepers (CUSTOMER-FACING)
**Who:** Tax professionals using the platform for client work

**Authority:**
- Access to assigned clients' tax documents
- Tax return preparation and filing
- Client communication
- Report generation
- **NOT** money management or payment features (unless authorized)

**System Access:**
- Client roster (assigned clients only)
- Tax preparation tools
- Document upload/download
- E-file integration
- Report builder
- **NOT** client bank accounts or payment systems

**Audit Trail:** ✅ All document access and modifications logged

---

### 2.12 Individual Customers / Retail Members
**Who:** Individual account holders

**Authority:**
- Account management (transfer between own accounts)
- Bill payments and external transfers
- Card management (freeze, controls)
- Personal profile settings

**System Access:**
- Own account balances and transactions
- Money management dashboard
- Card controls and settings
- P2P transfers to other members
- Mobile deposit
- **NOT** other customer accounts or administrative functions

**Audit Trail:** ✅ All actions logged; transaction history visible to customer

---

### 2.13 Joint Account Owner
**Who:** Secondary owner on money management account

**Authority:**
- Full access to shared account (same as primary owner)
- View and transfer funds
- Manage account settings
- **Must separately enroll** for online/mobile access

**System Access:**
- Own login credentials required
- Full access to shared account upon login
- **NOT** other accounts they don't own

**Audit Trail:** ✅ All access and actions logged individually by user

---

### 2.14 Authorized Card User
**Who:** Someone authorized on a credit/debit card only

**Authority:**
- View authorized card transactions
- Access limited (no full account management)
- **No** online banking or transfer authority

**System Access:**
- Card-specific transaction view
- **NOT** account settings, transfers, or other products

**Audit Trail:** ✅ Card transactions logged; cannot view other activity

---

### 2.15 Trusted User / Restricted Access
**Who:** Authorized to access specific account with limited permissions

**Authority:**
- View-only OR limited transfer authority
- Defined permission scope
- Time-based access windows (optional)

**System Access:**
- Restricted to permissioned features only
- Example: View transaction history + transfer up to $500/day

**Audit Trail:** ✅ All access logged; permission scope enforced in logs

---

## 3. Access Control Framework

### 3.1 Role-Based Access Control (RBAC)

**Principle:** Users are assigned roles; roles define permissions

```
User → Role → Permissions → System Access
```

**Example:**
- User: john.smith@firmname.com
- Role: Tax Preparer
- Permissions: View assigned clients, upload tax docs, run E-file
- Access: Tax prep tools, document management, E-file gateway

---

### 3.2 Least Privilege

**Rule:** Users receive minimum access necessary to perform their job

**Implementation:**
- No default admin access
- Roles are specific and narrowly defined
- Permissions are additive (start with nothing, grant what's needed)
- Quarterly access reviews to revoke unused access

---

### 3.3 Segregation of Duties (SoD)

**Rule:** No single person can initiate and approve a transaction

**Critical SoD Pairs:**
| Initiate | Approve | Threshold |
|----------|---------|-----------|
| Money transfer | Payment approval | >$10,000 |
| User account creation | Role assignment | All accounts |
| Refund request | Refund disbursement | >$500 |
| SAR submission | Compliance review | All SARs |

---

### 3.4 Authentication Requirements

#### Multi-Factor Authentication (MFA)
**Mandatory for:** All privileged users (IAM, Compliance, Fraud, Ops)

**Methods:**
1. TOTP (Time-based One-Time Password) - Google Authenticator, Authy
2. SMS/Email OTP (fallback only)
3. Hardware security keys (for highest-privilege users)

**Policy:**
- MFA enrollment required within 7 days of account creation
- SMS OTP phased out by [date], TOTP/hardware keys only
- Failed MFA attempts: Lock after 5 failures (30-min cooldown)

---

#### Step-Up Authentication

**Trigger Events:** (requires re-authentication even if already logged in)
1. Initiate transfer >$1,000
2. Add/remove user accounts
3. Change security settings
4. Access member PII (CSRs)
5. Approve transactions >$10,000

**Method:**
- TOTP OTP or re-enter password + MFA
- Session expires after sensitive action

---

### 3.5 Session Management

**Default Session Timeout:**
- **Customers:** 15 minutes (mobile), 30 minutes (web)
- **Tax Preparers:** 1 hour
- **Employees (privileged):** 30 minutes
- **Compliance/Audit:** No automatic timeout (audit-only access)

**Logout:**
- All sessions terminated upon logout
- "Log out from all devices" option available

---

### 3.6 Password Policy

**Minimum Requirements:**
- Minimum 12 characters
- Upper + lowercase + numbers + symbols
- No dictionary words or personal information
- Password history: Last 5 passwords cannot be reused
- Expiration: 90 days (employees), annual reset (customers)
- Failed login: Lockout after 5 attempts (30-min duration)

---

## 4. User Lifecycle Management

### 4.1 Joiner (Onboarding)

**Step 1: HR Initiation**
- Manager submits onboarding request
- Role and department specified
- Background check completed (if applicable)

**Step 2: IAM Provisioning**
- User account created
- Temporary password generated (must change on first login)
- Appropriate role assigned
- MFA enrollment prompted
- System access enabled

**Step 3: Confirmation**
- Manager confirms user can log in
- Role appropriateness validated
- Training completed

**Timeline:** 1 business day

**Audit Trail:** Account creation logged; onboarding checklist signed

---

### 4.2 Mover (Role Change)

**Step 1: Manager Request**
- Manager submits role change request
- New role specified
- Reason documented

**Step 2: Access Review**
- IAM reviews current permissions
- Incompatible permissions identified (SoD conflicts)
- Old permissions revoked **before** new permissions granted

**Step 3: Activation**
- New role activated
- Email confirmation sent
- Old systems access removed

**Timeline:** Same business day (for urgent); next business day (standard)

**Audit Trail:** Role change logged with justification; audit trail maintained

---

### 4.3 Leaver (Offboarding)

**Step 1: HR Notification**
- HR notifies IAM of departure
- Last day specified
- Role documented

**Step 2: Access Revocation**
- All system access disabled **on last day**
- Credentials deactivated
- MFA credentials removed
- Physical access disabled

**Step 3: Cleanup**
- Account flagged as terminated
- Data retention policy applied
- Audit trail archived

**Timeline:** Same day as departure

**Audit Trail:** All access removals logged with timestamp

---

### 4.4 Periodic Access Reviews

**Frequency:** Quarterly

**Process:**
1. Each manager receives list of direct reports + assigned roles
2. Manager verifies each role is still appropriate
3. Managers certify access or request revocation
4. IAM acts on requests
5. Executive sign-off on completion

**Escalation:** Any unexplained access → manager + IAM investigation

---

## 5. Monitoring & Audit Logging

### 5.1 Audit Log Requirements

**What is logged:**
- User login/logout (timestamp, IP, device)
- Role assignments and changes
- Permission grants and revocations
- Transaction initiation and approval
- Access to customer PII
- Configuration changes
- Failed authentication attempts
- Administrative actions

**Retention:**
- **Hot storage (queryable):** 1 year
- **Archive storage:** 7 years (regulatory requirement)
- **Immutable:** Logs cannot be deleted, only archived

**Encryption:** All logs encrypted at rest (AES-256)

---

### 5.2 Real-Time Monitoring

**Alerts Triggered:**
- Brute force attempts (5+ failed logins in 10 min)
- Privileged access outside business hours
- Mass access to customer records
- Failed MFA attempts
- Configuration changes by non-admins
- Dual-control violations (unapproved transactions)

**Escalation:**
1. Automatic alert to CISO
2. Investigation required within 24 hours
3. Incident documented
4. Corrective action if warranted

---

### 5.3 Compliance Reporting

**Monthly Reports:**
- User access summary (new, removed, changed)
- Failed authentication attempts
- Privileged access activity
- Access review completion status

**Quarterly Reports:**
- Access certification results
- SoD violations detected and remediated
- Incident summary and root causes
- Access policy changes

**Annual Reports:**
- User access trends
- Control effectiveness assessment
- Regulatory alignment validation
- Policy updates for next year

---

## 6. Regulatory Alignment

### 6.1 FFIEC Guidance (Federal Financial Institutions Examination Council)

**Control:** Information System Access (IT Examination Handbook, 7.1)

| Control | Implementation |
|---------|-----------------|
| User identification | Username + SSO |
| Authentication | MFA for privileged users |
| Access privileges | RBAC with least privilege |
| Logging & monitoring | Comprehensive audit trail |
| Review procedures | Quarterly access certification |

**Compliance Mapping:** ✅ All FFIEC requirements met

---

### 6.2 SOC 2 Type II (System and Organization Controls)

**Trust Services Criteria:**

**CC6: Logical and Physical Access Controls**
- **CC6.1:** Restrict logical access → RBAC + MFA
- **CC6.2:** Monitor logical access → Real-time alerts
- **CC6.3:** Restrict privileged access → Dual control on sensitive operations

**CC7: System Monitoring**
- **CC7.2:** Detect unauthorized access → Continuous monitoring

**CC8: Change Management**
- **CC8.1:** Control changes to systems → App Admin role only

**Compliance Mapping:** ✅ All CC requirements implemented

---

### 6.3 ISO 27001 (Information Security Management)

**Relevant Controls:**

| Annex A | Control | Implementation |
|---------|---------|-----------------|
| A.5 | Information Security Policies | This document |
| A.6 | Organization of Information Security | IAM roles defined |
| A.8 | Asset Management | Users = assets; access tracked |
| A.9 | Access Control | RBAC + MFA + least privilege |
| A.12 | Logging & Monitoring | Comprehensive audit trail |

**Certification Status:** Target SOC 2 Type II + ISO 27001; audit in progress

---

### 6.4 NCUA Regulations (National Credit Union Administration)
**Relevant for Credit Union Partnerships:**

| Regulation | Requirement | Implementation |
|-----------|------------|-----------------|
| 12 CFR 748 | Information Security Program | This policy + Security Plan |
| 12 CFR 748.0 | Access Controls | RBAC, MFA, least privilege |
| 12 CFR 748.1 | User Identification | Username + authentication |

**Compliance Mapping:** ✅ NCUA-ready if partnership established

---

### 6.5 Regulation E & CC (Electronic Funds Transfer & Funds Availability)

**Access Control Implications:**
- Customer must authenticate before transfers
- Error resolution requires identity verification
- Disputes must be documented and auditable
- Access logs prove customer initiated transaction

**Implementation:** ✅ Covered by MFA + audit logs

---

### 6.6 BIPA (Biometric Information Privacy Act - Illinois)

**Access Control for Biometric Data:**
- Only authorized personnel access facial/biometric data
- Access limited to fraud investigation + verification
- No sale or transfer of biometric data
- Customer can delete biometric data

**Role Restrictions:**
- Only Fraud Analysts + Customer authenticated devices can access biometric data
- Audit log required for all biometric access
- Annual report to customer on biometric access

**Compliance Mapping:** ✅ Biometric access controlled; logs maintained

---

### 6.7 CCPA / CPRA (California Consumer Privacy Act)

**Access Control for PII:**
- Only authorized roles can access customer PII
- Customer has right to know who accessed their data
- Access log must be provided upon request
- Purpose limiting (access only for stated purpose)

**Implementation:**
- Access to PII restricted to CSR, Fraud, Compliance roles
- Monthly access report generated
- Customer can request "data access" (includes access log)

**Compliance Mapping:** ✅ PII access restricted and logged

---

## 7. Role Exceptions & Temporary Access

### 7.1 Emergency Access

**Scenario:** Critical system down; employee needs elevated access to restore service

**Approval:**
1. Manager + CISO must approve
2. Documented in incident ticket
3. Time-limited (max 8 hours)
4. Temporary role assigned

**Post-Incident:**
- Access immediately revoked
- Incident review within 24 hours
- Policy improvement assessed

---

### 7.2 Contractor / Temporary Staff

**Policy:**
- Contractors assigned **minimum** temporary role
- **Auto-expiry** on contract end date (mandatory)
- No privileged access unless escalated
- Separate audit trail

**Example:** Technical contractor needs app system access for 3 months
- Role: "Developer (Temporary)"
- Access: Dev/staging environments only
- Expires: [contract end date]
- MFA: Mandatory

---

### 7.3 Third-Party / Vendor Access

**Scenario:** Payment processor, card network, cloud provider needs platform access

**Framework:**
1. Legal agreement includes access terms
2. Limited to stated purpose
3. Separate user accounts (identifiable)
4. Read-only access unless transfer required
5. Quarterly audit of vendor access

**Example:** Marqeta (card processor) needs access to card auth logs
- Role: "Vendor - Marqeta (View-Only)"
- Access: Card authorization logs only
- Restrictions: Cannot modify, approve, or transfer
- Audit: Monthly reconciliation

---

## 8. Enforcement & Consequences

### 8.1 Access Policy Violations

**Type 1: Unauthorized Access Attempt**
- Failed MFA multiple times
- **Action:** Account locked; manager notified; password reset required
- **Severity:** Low

**Type 2: Privilege Escalation**
- User attempts to access data outside their role
- **Action:** Immediate access revocation; security investigation; potential termination
- **Severity:** High

**Type 3: SoD Violation**
- Employee initiates and approves their own transaction (should have been dual control)
- **Action:** Transaction reversed; audit trail reviewed; policy training required
- **Severity:** High

**Type 4: Credential Sharing**
- User shares credentials with another person
- **Action:** Both accounts suspended; investigation; potential termination
- **Severity:** Critical

**Type 5: After-Hours Privileged Access Without Justification**
- Privileged user accesses system outside business hours without documented reason
- **Action:** Manager notification; incident investigation
- **Severity:** Medium

---

### 8.2 Policy Acknowledgment

**All users must:**
1. Acknowledge this policy upon hire
2. Re-acknowledge annually
3. Understand consequences of violations
4. Complete security training (role-specific)

**Documentation:** Signed policy acknowledgment retained in personnel file

---

## 9. Policy Governance

### 9.1 Policy Owner
- **Owner:** Chief Information Security Officer (CISO)
- **Approver:** Chief Executive Officer (CEO) + General Counsel
- **Review Frequency:** Annually or upon major system change
- **Last Updated:** [Date]

### 9.2 Related Policies
- Information Security Policy
- Data Classification & Handling
- Incident Response Plan
- Business Continuity Plan
- Change Management Policy
- Third-Party Risk Management

### 9.3 Questions or Exceptions

Contact: **[security@rosstaxprep.com](mailto:security@rosstaxprep.com)**

---

**[END OF POLICY]**
