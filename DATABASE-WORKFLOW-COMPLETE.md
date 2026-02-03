# Complete Database Schema & Workflow Documentation

## 📊 Database Tables (23 Total)

### 1. STAFF - Internal Users
```sql
CREATE TABLE staff (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'manager', 'supervisor', 'lead', 'associate', 'ptin_holder', 'ero', 'staff')),
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  mfa_method TEXT, -- 'totp', 'email', 'sms'
  mfa_backup_codes TEXT, -- JSON array
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```
**Roles:**
- `admin` - Full system access, user management, compliance
- `ero` - Electronic Return Originator (PTIN holder)
- `ptin_holder` - Preparer Tax ID holder
- `staff` - Client servicing, return processing
- `manager` - Team supervision, quality assurance
- `supervisor` - Department leadership

### 2. CLIENTS - Customer Accounts
```sql
CREATE TABLE clients (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT,
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  mfa_method TEXT,
  mfa_backup_codes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 3. RETURNS - Tax Return Records
```sql
CREATE TABLE returns (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL,
  tax_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'draft', 'pending', 'filed', 'accepted', 'rejected', 'amended'
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

### 4. EFILE_TRANSMISSIONS - IRS E-File Submissions
```sql
CREATE TABLE efile_transmissions (
  id TEXT PRIMARY KEY,
  return_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  preparer_id INTEGER,
  method TEXT, -- 'DIY', 'ERO'
  status TEXT,
  irs_submission_id TEXT,
  ack_code TEXT,
  ack_message TEXT,
  dcn TEXT, -- Document Control Number
  efin TEXT,
  etin TEXT,
  environment TEXT, -- 'ATS', 'Production'
  bank_product_id TEXT,
  payment_method TEXT,
  payment_details_json TEXT,
  
  -- Refund Tracking
  irs_refund_status TEXT,
  refund_method TEXT,
  refund_amount REAL,
  refund_disbursed_at TEXT,
  refund_trace_id TEXT,
  refund_notes TEXT,
  
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (preparer_id) REFERENCES staff(id)
);
```

### 5. MEF_SUBMISSIONS - MeF A2A Submissions
```sql
CREATE TABLE mef_submissions (
  submission_id TEXT PRIMARY KEY,
  efin TEXT NOT NULL,
  etin TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  status TEXT NOT NULL,
  return_type TEXT,
  tax_year TEXT,
  environment TEXT,
  request_xml TEXT,
  response_xml TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 6. MEF_ACKNOWLEDGMENTS - IRS Acknowledgments
```sql
CREATE TABLE mef_acknowledgments (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  ack_id TEXT,
  status TEXT, -- 'Accepted', 'Rejected'
  dcn TEXT,
  tax_year TEXT,
  return_type TEXT,
  errors_json TEXT, -- JSON array
  received_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 7. IRS_MEMOS - IRS Notices & Memos
```sql
CREATE TABLE irs_memos (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  irs_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  full_text TEXT,
  published_at TEXT,
  url TEXT,
  tags_json TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 8. IRS_MEMO_LINKS - Client/Return Association
```sql
CREATE TABLE irs_memo_links (
  id TEXT PRIMARY KEY,
  memo_id TEXT NOT NULL,
  client_id INTEGER,
  return_id INTEGER,
  topic TEXT,
  note TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memo_id) REFERENCES irs_memos(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);
```

### 9. SIGNATURES - DocuSign Tracking
```sql
CREATE TABLE signatures (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL,
  envelope_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'delivered', 'completed', 'declined'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

### 10. PAYMENTS - Transaction History
```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT, -- 'stripe', 'zelle', 'ach', 'cash_app'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

### 11. TRAINING_COURSES - LMS Courses
```sql
CREATE TABLE training_courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  duration TEXT, -- "6 weeks", "Self-paced"
  delivery TEXT, -- 'self-paced', 'online', '1:1', 'hybrid'
  price_cents INTEGER,
  instructor TEXT,
  tags_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 12. TRAINING_ENROLLMENTS - Student Enrollments
```sql
CREATE TABLE training_enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES training_courses(id)
);
```

### 13. MESSAGES - Client-Staff Communication
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL,
  sender_role TEXT CHECK(sender_role IN ('client', 'staff', 'admin')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

### 14. DOCUMENTS - File Uploads
```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

### 15. CLIENT_CREDENTIALS - Encrypted PII
```sql
CREATE TABLE client_credentials (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  return_id INTEGER,
  credential_type TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);
```

### 16. AUDIT_LOG - Compliance Tracking
```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  user_id INTEGER,
  user_role TEXT,
  user_email TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 17. TASKS - Workflow Management
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'assigned', 'in_progress', 'completed', 'blocked'
  priority TEXT, -- 'low', 'medium', 'high', 'critical'
  assigned_to INTEGER,
  due_date TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES staff(id)
);
```

---

## 🔄 WORKFLOW PROCESSES

### DIY Tax Prep Workflow
```
1. CLIENT REGISTRATION
   ├─ Create account (email/password)
   ├─ Enable MFA (optional but recommended)
   └─ Complete profile

2. INTAKE PROCESS
   ├─ Fill intake form (basic info)
   ├─ Select return type (1040, 1040-SR, 1040-NR, 1040-X)
   ├─ Specify tax year
   ├─ Identify filing status
   └─ Select refund method

3. DOCUMENT UPLOAD
   ├─ Upload W-2 forms (encrypted)
   ├─ Upload 1099 forms (encrypted)
   ├─ Upload deduction receipts (encrypted)
   ├─ Upload prior year return (optional)
   └─ All files stored in R2 with encryption

4. PRE-POPULATION
   ├─ System extracts data from forms
   ├─ Auto-populates return fields
   ├─ Calculates standard deduction
   ├─ Runs validation checks
   └─ Flags potential issues

5. CLIENT REVIEW
   ├─ Client reviews pre-populated return
   ├─ Client enters additional income/deductions
   ├─ Client reviews calculated tax liability
   ├─ Client verifies refund method
   └─ Client certifies accuracy

6. PREPARATION
   ├─ System validates all fields
   ├─ Calculate tax liability
   ├─ Verify deductions are allowed
   ├─ Check for missing required fields
   └─ Generate XML in IRS format

7. TRANSMISSION
   ├─ System calls MeF A2A API
   ├─ Submits XML to IRS
   ├─ Receives submission confirmation
   ├─ Stores submission ID
   └─ Updates status to 'transmitted'

8. ACKNOWLEDGMENT
   ├─ Poll IRS for status
   ├─ Receive acknowledgment (A0000 = Accepted)
   ├─ Store DCN (Document Control Number)
   ├─ Update status to 'accepted' or 'rejected'
   └─ Notify client

9. REFUND TRACKING
   ├─ Client views refund status dashboard
   ├─ System queries IRS refund info
   ├─ Display estimated deposit date
   ├─ Show refund amount
   └─ Notify when deposited

10. COMPLETION
    ├─ Archive return and documents
    ├─ Generate tax summary report
    ├─ Send final confirmation email
    └─ Provide record for future reference
```

### ERO (Professional Preparer) Workflow
```
1. PREPARER LOGIN
   ├─ ERO/PTIN holder logs in
   ├─ MFA verification
   └─ Dashboard displays pending clients

2. CLIENT QUEUE
   ├─ View assigned clients
   ├─ Review intake forms
   ├─ Check uploaded documents
   ├─ Identify complex returns
   └─ Prioritize by deadline

3. RETURN PREPARATION
   ├─ Open client return
   ├─ Review all documents
   ├─ Verify income and deductions
   ├─ Apply tax strategies
   ├─ Calculate optimal filing method
   ├─ Run business rules validation
   ├─ Review for errors
   └─ Add preparer notes

4. QUALITY ASSURANCE
   ├─ Self-review for errors
   ├─ Check for IRS audit red flags
   ├─ Verify math
   ├─ Confirm all schedules included
   ├─ Review state requirements
   └─ Generate audit summary

5. CLIENT COMMUNICATION
   ├─ Call/email client for clarifications
   ├─ Discuss tax strategies
   ├─ Explain deductions
   ├─ Confirm refund method
   └─ Obtain signature via DocuSign

6. ELECTRONIC FILING
   ├─ Validate XML generation
   ├─ Submit via MeF A2A
   ├─ Receive transmission confirmation
   ├─ Track with submission ID
   └─ Document in audit trail

7. ACKNOWLEDGMENT HANDLING
   ├─ Check for IRS acknowledgment
   ├─ If Accepted (A0000):
   │  ├─ Record DCN
   │  ├─ Notify client
   │  └─ Mark as 'accepted'
   └─ If Rejected (R0000):
      ├─ Review error codes
      ├─ Correct issues
      ├─ Resubmit if appropriate
      └─ Contact client

8. REFUND MONITORING
   ├─ Track refund status
   ├─ Update client on timeline
   ├─ Confirm deposit when received
   └─ Provide proof of acceptance

9. AMENDED RETURNS
   ├─ If errors found after filing:
   │  ├─ Prepare Form 1040-X
   │  ├─ Document reasons for amendment
   │  ├─ Refile within statute limits
   │  └─ Track amended status
   └─ Client notified of amendments
```

### 1040-X (Amendment) Workflow
```
1. IDENTIFY AMENDMENT NEED
   ├─ Error in original return
   ├─ Missing income reported
   ├─ Incorrect deductions claimed
   ├─ Change in filing status (rare)
   └─ Additional tax liability/refund

2. ASSESS TIMELINE
   ├─ Check statute of limitations
   │  ├─ Generally 3 years for amendments
   │  ├─ 7 years for fraud
   │  └─ No limit if unreported income
   └─ Consider audit risk

3. GATHER DOCUMENTATION
   ├─ Collect original return copy
   ├─ Review changes needed
   ├─ Get supporting documents
   ├─ Calculate impact
   └─ Document reasoning

4. PREPARE FORM 1040-X
   ├─ Complete Form 1040-X header
   ├─ Explain reason for amendment
   ├─ List all corrections
   ├─ Show calculation impact
   ├─ Calculate amended tax
   └─ Determine refund/owed

5. VALIDATION
   ├─ Verify all required fields
   ├─ Check math
   ├─ Confirm statute of limitations
   ├─ Review for red flags
   └─ Quality assurance check

6. TRANSMISSION
   ├─ If eligible for e-file:
   │  ├─ Submit electronically
   │  ├─ Receive confirmation
   │  └─ Track with DCN
   └─ If paper filing:
      ├─ Print and sign
      ├─ Mail to correct IRS address
      └─ Track with receipt

7. ACKNOWLEDGMENT
   ├─ Poll for IRS status
   ├─ Receive acknowledgment
   ├─ Update client
   └─ Document result

8. FOLLOW-UP
   ├─ If refund issued:
   │  ├─ Track deposit
   │  ├─ Confirm amount
   │  └─ Notify client
   └─ If additional tax:
      ├─ Collection procedures
      └─ Payment arrangements
```

### Payment Processing Workflow
```
1. SERVICE SELECTION
   ├─ Client selects service
   ├─ System calculates fee
   └─ Present payment options

2. PAYMENT METHOD CHOICE
   ├─ Stripe (credit/debit card)
   ├─ Zelle (bank transfer)
   ├─ Cash App
   ├─ Chime
   ├─ ACH
   └─ Wire transfer

3. PAYMENT PROCESSING
   ├─ Client enters payment info
   ├─ Payment gateway processes
   ├─ System receives confirmation
   ├─ Payment recorded in database
   └─ Audit log created

4. VERIFICATION
   ├─ Confirm payment received
   ├─ Update client status
   ├─ Generate receipt
   └─ Send confirmation email

5. SERVICE INITIATION
   ├─ Mark service as 'paid'
   ├─ Queue for processing
   ├─ Assign to preparer
   └─ Begin work

6. ISSUE HANDLING
   ├─ If payment fails:
   │  ├─ Notify client
   │  ├─ Allow retry
   │  └─ Extend deadline
   └─ If chargeback:
      ├─ Investigate
      ├─ Provide documentation
      └─ Follow dispute process
```

### Refund Tracking Workflow
```
1. SETUP
   ├─ Client specifies refund method:
   │  ├─ ACH Direct Deposit (5-7 days)
   │  ├─ Chime Card (2-3 days, fastest)
   │  ├─ Zelle (3-5 days)
   │  └─ Check by Mail (7-14 days)
   └─ System records preference

2. RETURN ACCEPTED
   ├─ IRS acknowledges receipt
   ├─ System receives A0000 code
   ├─ Store DCN
   ├─ Update status
   └─ Notify client

3. PROCESSING
   ├─ IRS processes return
   ├─ Calculate refund amount
   ├─ Verify identity
   ├─ Check for offsets (student loans, child support, etc.)
   └─ Determine refund amount

4. TRACKING
   ├─ Client logs into portal
   ├─ System queries IRS
   ├─ Display refund status
   ├─ Show:
   │  ├─ Amount
   │  ├─ Expected deposit date
   │  ├─ Current status
   │  └─ Tracking updates
   └─ Notify of status changes

5. DEPOSIT
   ├─ IRS deposits to bank/card
   ├─ Client's account receives funds
   ├─ System records:
   │  ├─ Deposit date
   │  ├─ Confirmation/trace ID
   │  └─ Final status
   └─ Client notified

6. CONFIRMATION
   ├─ Client confirms receipt
   ├─ Generate refund statement
   ├─ Archive for records
   └─ Complete workflow

7. ISSUES
   ├─ If delayed:
   │  ├─ Check IRS status
   │  ├─ Verify account info
   │  ├─ Check for holds
   │  └─ Contact IRS if needed
   └─ If not received:
      ├─ File claim
      ├─ Check for IRS issues
      └─ Request replacement
```

---

## 📋 Role-Based Workflows

### Admin Role
```
✅ Full system access
✅ User management
✅ Staff administration
✅ Compliance oversight
✅ Audit log review
✅ System configuration
✅ Report generation
✅ Email routing management
```

### ERO/PTIN Holder Role
```
✅ Return preparation
✅ E-file submission
✅ MeF A2A access
✅ Client management
✅ Document review
✅ Signature management
✅ Refund tracking
✅ Amendment handling
```

### Staff Role
```
✅ Client support
✅ Document processing
✅ Intake management
✅ Message handling
✅ Task management
✅ Basic return review
✅ Refund tracking
✗ E-file submission (ERO only)
```

### Client Role
```
✅ Account management
✅ Return submission
✅ Document upload
✅ Status tracking
✅ Refund monitoring
✅ Message communication
✅ Payment processing
✗ System administration
✗ Other client data access
```

---

## 🔐 Data Encryption & Security

### Encrypted Fields
```
✅ Social Security Numbers (SSN)
✅ Phone Numbers
✅ Address Information
✅ Bank Account Details
✅ Tax Return Data
✅ Credential Uploads
✅ Email Addresses (hashed in auth)
✅ Password Hashes (bcrypt + salt)
```

### Encryption Method
```
Algorithm:   AES-256-GCM
Mode:        Galois/Counter Mode
IV:          12 bytes random
Key Size:    256 bits (32 bytes)
Auth Tag:    16 bytes
```

### Key Management
```
✅ Environment variables (secure)
✅ Never logged
✅ Rotated periodically
✅ Access restricted
✅ Backup keys maintained
```

---

## 📈 Compliance & Audit Trail

### Audited Actions
```
✅ Login attempts (success/failure)
✅ Data access (read/list/search)
✅ Data modifications (create/update/delete)
✅ File operations (upload/download/delete)
✅ Permission changes
✅ Payment transactions
✅ E-file submissions
✅ Refund tracking
✅ System changes
```

### Retention Policy
```
Audit Logs:          7 years (IRS requirement)
Tax Return Data:     10 years
Payment Records:     7 years
Training Records:    3 years
Temporary Files:     30 days max
```

