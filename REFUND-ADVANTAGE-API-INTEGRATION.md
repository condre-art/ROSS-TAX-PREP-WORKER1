# Refund Advantage Partnership API Integration
## Complete Bank Products System with Refund Transfers, Advances & Loans

### 📋 Overview
This integration enables fully automated bank product transmissions to Refund Advantage Partnership, including:
- **Refund Transfers (RT)** - Electronic transfer of IRS refunds
- **Refund Advances (RA)** - Pre-refund advances with auto-approval
- **Instant Loans** - On-demand loans up to $35,000
- **Real-time Status Tracking** - Webhook callbacks and polling
- **Encrypted Bank Account Storage** - AES-256 encryption for PII

### 🏦 Refund Advantage Partnership Details
**Bank Partner**: Refund Advantage Partnership  
**Primary Bank**: MetaBank or Republic Bank (dependent on region)  
**FDIC Insured**: Yes (up to $250,000 per account)  
**Processing Times**:
- Refund Transfer: 1-7 business days
- Refund Advance: 24-48 hours
- Instant Loan: 24-48 hours
- Funds Deposit: 1-2 business days

### 💰 Pricing Structure

#### Refund Transfer (RT)
```
Product: Electronic refund deposit to client's bank account
Fee: $39.95 (deducted from refund)
Example: $3,000 refund = $2,960.05 net (client receives)
Status: Automatic transmission upon IRS acceptance
```

#### Refund Advance (RA)
```
Product: Pre-refund advance pending IRS acceptance
Fee: $49.95 (deducted from advance)
Max Amount: 90% of estimated refund
Approval: Auto-approved for amounts under $5,000
Example: $3,000 advance = $2,950.05 net
Repayment: Offset from actual IRS refund
```

#### Instant Loans
```
Product: Short-term loans (14-60 days)
Amount: $500 - $35,000
Fee: 3.5% - 7.5% APR (depends on creditworthiness)
Term: 14-60 days
Example: $5,000 loan @ 5% APR for 30 days = $208 interest
Repayment: Automatic bank draft or manual payment
```

---

## 🔌 API Implementation

### 1️⃣ Transmit Bank Product
**Endpoint**: `POST /api/bank-products/transmit`  
**Auth Required**: Yes (JWT Bearer token)

#### Request Body
```json
{
  "return_id": 42,
  "product_type": "RT",
  "routing_number": "091000019",
  "account_number": "123456789012",
  "account_type": "checking",
  "account_holder_name": "John Doe",
  "refund_amount": 3000,
  "fee": 39.95
}
```

#### Response
```json
{
  "success": true,
  "transmission": {
    "transmission_id": "trx_abc123def456",
    "client_id": "cli_xyz789",
    "return_id": 42,
    "product_type": "RT",
    "refund_amount": 3000,
    "fee": 39.95,
    "net_amount": 2960.05,
    "status": "pending",
    "created_at": "2026-02-03T20:15:00Z",
    "updated_at": "2026-02-03T20:15:00Z"
  }
}
```

#### Status Flow
```
pending → approved → transmitted → processed → [deposit completed]
                                 ↓
                              rejected → [client notified]
```

---

### 2️⃣ Get Transmission Status
**Endpoint**: `GET /api/bank-products/:transmissionId/status`  
**Auth Required**: Yes (JWT Bearer token)

#### Response
```json
{
  "success": true,
  "status": "transmitted",
  "details": {
    "transmission_date": "2026-02-03T22:30:00Z",
    "expected_deposit_date": "2026-02-10T00:00:00Z",
    "irs_refund_amount": 3000,
    "net_amount": 2960.05,
    "partner_status": "in_transit"
  }
}
```

---

### 3️⃣ Approve Refund Advance (Admin)
**Endpoint**: `POST /api/bank-products/:transmissionId/approve`  
**Auth Required**: Yes (Admin role required)  
**Rate Limit**: 100/minute per admin

#### Request Body
```json
{
  "approved_amount": 2950.05
}
```

#### Response
```json
{
  "success": true,
  "message": "Refund advance approved",
  "notification_sent": {
    "type": "refund_advance_approved",
    "recipient": "cli_xyz789",
    "channels": ["email", "sms"]
  }
}
```

#### Admin Notification (Real-time)
```
[NOTIFICATION] Refund Advance Approved
Amount: $2,950.05 | Transmission: trx_abc123 | Client: John Doe
Status: SENT | Channels: Email, SMS
```

---

### 4️⃣ Process Refund Transfer (Admin)
**Endpoint**: `POST /api/bank-products/:transmissionId/process-transfer`  
**Auth Required**: Yes (Admin role required)

#### Request Body
```json
{
  "irs_refund_amount": 3000
}
```

#### Response
```json
{
  "success": true,
  "message": "Refund transfer processed",
  "transmission_date": "2026-02-03T22:35:00Z",
  "expected_deposit_date": "2026-02-10T00:00:00Z",
  "net_amount": 2960.05
}
```

#### Client Notification (Urgent)
```
🎉 Your Refund Has Been Sent!

Amount: $2,960.05 (after $39.95 fee)
Expected Deposit: 7 business days
Your bank: ****6789
```

---

### 5️⃣ Instant Loan Pre-Qualification
**Endpoint**: `GET /api/loans/prequalify?amount=5000`  
**Auth Required**: Yes (JWT Bearer token)  
**No Credit Check**: Uses tax return data only

#### Response
```json
{
  "success": true,
  "offer": {
    "eligible": true,
    "max_amount": 25000,
    "requested_amount": 5000,
    "apr": 5.2,
    "term_days": 30,
    "fee": 63.50,
    "total_payback": 5063.50
  }
}
```

#### Offer Validity
- Offers valid for **30 days**
- Based on estimated refund amount
- No credit check required
- Pre-qualified clients receive instant approval

---

### 6️⃣ Accept Instant Loan
**Endpoint**: `POST /api/loans/accept`  
**Auth Required**: Yes (JWT Bearer token)

#### Request Body
```json
{
  "loan_amount": 5000,
  "routing_number": "091000019",
  "account_number": "123456789012",
  "account_type": "checking"
}
```

#### Response
```json
{
  "success": true,
  "message": "Loan accepted",
  "transmission": {
    "transmission_id": "trx_loan_789xyz",
    "product_type": "LOAN",
    "advance_amount": 5000,
    "fee": 63.50,
    "net_amount": 4936.50,
    "status": "approved"
  }
}
```

#### Client Notification (Urgent)
```
💰 Your Instant Loan Approved!

Loan Amount: $4,936.50
Repayment: Due in 30 days ($5,000 + $63.50 fee)
Bank Account: ****6789

Funds will arrive within 24 hours.
```

---

### 7️⃣ Refund Advantage Webhook
**Endpoint**: `POST /api/webhooks/refund-advantage`  
**Auth Required**: Signature verification (no Bearer token)  
**Webhook Timeout**: 30 seconds

#### Webhook Events

**Event 1: Transmission Processed**
```json
{
  "event_type": "transmission_processed",
  "transmission_id": "trx_abc123def456",
  "status": "processed",
  "details": {
    "amount": 2960.05,
    "processing_date": "2026-02-04T10:00:00Z"
  }
}
```

**Event 2: Transmission Rejected**
```json
{
  "event_type": "transmission_rejected",
  "transmission_id": "trx_abc123def456",
  "status": "rejected",
  "details": {
    "reason": "Invalid routing number",
    "error_code": "INVALID_ROUTING"
  }
}
```

**Event 3: Deposit Completed**
```json
{
  "event_type": "deposit_completed",
  "transmission_id": "trx_abc123def456",
  "status": "deposit_completed",
  "details": {
    "amount": 2960.05,
    "deposit_date": "2026-02-10T15:30:00Z"
  }
}
```

---

## 🔒 Security Implementation

### Encryption
```typescript
// Bank account details encrypted with AES-256
routing_number_encrypted: "U2FsdGVkX1...",  // AES-256-GCM
account_number_encrypted: "U2FsdGVkX1...",  // AES-256-GCM
account_holder_name: "John Doe"             // Stored in plaintext (required for transmission)
```

### PII Data Handling
```sql
-- Encrypted columns (AES-256-GCM)
routing_number_encrypted TEXT NOT NULL,
account_number_encrypted TEXT NOT NULL,

-- Decrypted on-demand (never logged)
-- Only visible to authenticated client and admins
```

### Audit Logging
```
[AUDIT] action=bank_product_transmitted | user_id=cli_xyz789 | resource=trx_abc123 | fee=39.95
[AUDIT] action=refund_advance_approved | user_id=adm_staff123 | amount=2950.05 | timestamp=2026-02-03T20:15:00Z
[AUDIT] action=bank_product_webhook | user_id=sys_refund_advantage | event=transmission_processed
```

---

## 📊 Real-Time Notifications

### Client Notifications
| Event | Channel | Urgency | Example |
|-------|---------|---------|---------|
| Transmission Submitted | Email | Low | "Your refund transfer has been submitted" |
| Refund Advance Approved | Email + SMS | **HIGH** | "🎉 Your refund advance of $2,950 has been approved!" |
| Transfer Processed | Email | Low | "Your refund is on its way" |
| Deposit Completed | Email + Push | **HIGH** | "💰 Your funds have been deposited!" |
| Transmission Rejected | Email + SMS | **URGENT** | "Your bank product was declined. Reason: Invalid routing" |

### Admin Notifications
| Event | Channel | Recipient | Example |
|-------|---------|-----------|---------|
| RA Approved | Dashboard | All Admins | "RA #2,950 approved for John Doe" |
| RT Transmitted | Dashboard | All Admins | "RT #3,000 transmitted to partner" |
| Webhook Event | Dashboard | Admin | "Transmission processed: trx_abc123" |
| Unusual Activity | Email + Alert | Supervisor | "⚠️ 10 RAs submitted in 5 minutes" |

---

## 🗄️ Database Schema

### bank_product_transmissions Table
```sql
CREATE TABLE bank_product_transmissions (
  transmission_id TEXT PRIMARY KEY,           -- UUID
  client_id TEXT NOT NULL,                    -- Foreign key: clients.id
  return_id INTEGER,                          -- Foreign key: returns.id (nullable for loans)
  product_type TEXT CHECK(...IN ('RT', 'RA', 'LOAN')),
  routing_number_encrypted TEXT NOT NULL,     -- AES-256-GCM
  account_number_encrypted TEXT NOT NULL,     -- AES-256-GCM
  account_type TEXT CHECK(...IN ('checking', 'savings')),
  account_holder_name TEXT NOT NULL,
  refund_amount REAL DEFAULT 0,               -- IRS refund amount
  advance_amount REAL DEFAULT 0,              -- Advance/loan amount
  fee REAL NOT NULL,                          -- Partnership fee
  net_amount REAL NOT NULL,                   -- After fee
  status TEXT DEFAULT 'pending',
  transmission_date TEXT,
  expected_deposit_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_bank_transmissions_client ON bank_product_transmissions(client_id);
CREATE INDEX idx_bank_transmissions_status ON bank_product_transmissions(status);
CREATE INDEX idx_bank_transmissions_type ON bank_product_transmissions(product_type);
```

---

## 🚀 Configuration & Environment Variables

### Required Environment Variables
```env
# Refund Advantage API
REFUND_ADVANTAGE_API_ENDPOINT=https://api.refundadvantage.com/v1
REFUND_ADVANTAGE_API_KEY=sk_live_xxxxxxxxxxxxx
REFUND_ADVANTAGE_API_SECRET=sk_secret_xxxxxxxxxxxxx
REFUND_ADVANTAGE_ORIGINATOR_ID=ROSSTAX123
REFUND_ADVANTAGE_ROUTING_NUMBER=091000019
ENVIRONMENT=production

# Encryption
ENCRYPTION_KEY=your_aes_256_key_here

# Notifications (for real-time updates)
MAILCHANNELS_API_TOKEN=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
```

### wrangler.toml Configuration
```toml
[[env.production.vars]]
REFUND_ADVANTAGE_API_ENDPOINT = "https://api.refundadvantage.com/v1"
REFUND_ADVANTAGE_ENVIRONMENT = "production"

[[env.sandbox.vars]]
REFUND_ADVANTAGE_API_ENDPOINT = "https://sandbox.refundadvantage.com/v1"
REFUND_ADVANTAGE_ENVIRONMENT = "sandbox"
```

---

## 🧪 Testing Guide

### 1. Test Refund Transfer (RT)
```bash
# Step 1: Submit RT
curl -X POST https://api.rosstaxprepandbookkeeping.com/api/bank-products/transmit \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "return_id": 42,
    "product_type": "RT",
    "routing_number": "091000019",
    "account_number": "123456789012",
    "account_type": "checking",
    "account_holder_name": "John Doe",
    "refund_amount": 3000,
    "fee": 39.95
  }'

# Step 2: Check status (polling)
curl -X GET https://api.rosstaxprepandbookkeeping.com/api/bank-products/trx_abc123/status \
  -H "Authorization: Bearer $JWT_TOKEN"

# Step 3: Simulate webhook
curl -X POST https://api.rosstaxprepandbookkeeping.com/api/webhooks/refund-advantage \
  -H "X-Webhook-Signature: sig_test123" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "deposit_completed",
    "transmission_id": "trx_abc123def456",
    "details": {"amount": 2960.05}
  }'
```

### 2. Test Refund Advance (RA)
```bash
# Step 1: Submit RA
curl -X POST https://api.rosstaxprepandbookkeeping.com/api/bank-products/transmit \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "return_id": 42,
    "product_type": "RA",
    "routing_number": "091000019",
    "account_number": "123456789012",
    "account_type": "checking",
    "account_holder_name": "John Doe",
    "advance_amount": 2500,
    "fee": 49.95
  }'

# Step 2: Admin approves
curl -X POST https://api.rosstaxprepandbookkeeping.com/api/bank-products/trx_xyz789/approve \
  -H "Authorization: Bearer $ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved_amount": 2450.05}'

# Step 3: Simulate approval notification
curl -X POST https://api.rosstaxprepandbookkeeping.com/api/webhooks/refund-advantage \
  -d '{
    "event_type": "transmission_processed",
    "transmission_id": "trx_xyz789",
    "details": {"amount": 2450.05}
  }'
```

### 3. Test Instant Loan
```bash
# Step 1: Get loan offer
curl -X GET "https://api.rosstaxprepandbookkeeping.com/api/loans/prequalify?amount=5000" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Step 2: Accept loan
curl -X POST https://api.rosstaxprepandbookkeeping.com/api/loans/accept \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_amount": 5000,
    "routing_number": "091000019",
    "account_number": "123456789012",
    "account_type": "checking"
  }'
```

---

## 📈 Monitoring & Metrics

### Key Metrics to Track
```sql
-- Daily transmission volume
SELECT product_type, COUNT(*) as count, SUM(fee) as total_fees
FROM bank_product_transmissions
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY product_type;

-- Status distribution
SELECT status, COUNT(*) as count
FROM bank_product_transmissions
WHERE created_at > datetime('now', '-30 days')
GROUP BY status;

-- Average processing time
SELECT product_type,
       AVG(CAST((julianday(transmission_date) - julianday(created_at)) * 24 AS FLOAT)) as avg_hours
FROM bank_product_transmissions
WHERE transmission_date IS NOT NULL
GROUP BY product_type;

-- Revenue by product type
SELECT product_type, SUM(fee) as total_revenue, COUNT(*) as transaction_count
FROM bank_product_transmissions
WHERE status IN ('transmitted', 'processed')
GROUP BY product_type;
```

### Dashboard Metrics
- **RT Success Rate**: % of successful refund transfers
- **RA Approval Rate**: % of auto-approved advances
- **Loan Default Rate**: % of loans repaid on time
- **Average Processing Time**: Hours from submission to deposit
- **Client Satisfaction**: NPS score from post-transaction surveys

---

## ✅ Compliance & Regulations

### Regulations
- **FDIC Insurance**: Accounts insured up to $250,000
- **ACH Compliance**: Follows NACHA rules for electronic transfers
- **OFAC**: All transmissions checked against OFAC sanctions list
- **PII Protection**: All bank details encrypted AES-256
- **FCRA**: Credit checks comply with Fair Credit Reporting Act
- **TRUTH in LENDING**: Clear disclosure of fees and terms

### Audit Trail
All bank product transactions logged with:
- User ID and action type
- Timestamp and result
- IP address and device fingerprint
- Any modifications or reversals
- Admin approvals with username

---

## 🔗 Integration with Existing Systems

### Workflow Integration
```
Client Portal (React)
    ↓ [Select bank product]
    ↓
Workflow Manager (task assignment)
    ↓ [Assign validation task to staff]
    ↓
Staff Dashboard (review & approve)
    ↓ [Approve in /admin/transmissions]
    ↓
Refund Advantage API (transmit)
    ↓ [Real-time webhook callback]
    ↓
Notifications System (email, SMS, push)
    ↓ [Client notified of status change]
    ↓
Client Portal (dashboard updated)
```

### Return Lifecycle
```
1. Return accepted by IRS
   → Auto-create bank product selection task
   
2. Client selects bank product (RT/RA/LOAN)
   → Transmission created, fee calculated
   
3. Transmission submitted to Refund Advantage
   → Real-time notification to client & admin
   
4. Webhook callback received
   → Status updated, client notified
   
5. Funds deposited to client's account
   → Final notification, task marked complete
```

---

## 🚨 Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_ROUTING` | Bad routing number | Verify routing number matches bank |
| `ACCOUNT_CLOSED` | Account no longer active | Ask client to provide active account |
| `DUPLICATE_TRANSMISSION` | Same transmission sent twice | Check transmission_id uniqueness |
| `INSUFFICIENT_FUNDS` | Client account overdrawn | Advise client to bring balance positive |
| `OFAC_MATCH` | Name matches sanctions list | Manual review required by compliance |
| `NETWORK_ERROR` | API connection failed | Retry with exponential backoff |

### Retry Logic
```typescript
// Automatic retry with exponential backoff
async function callRefundAdvantageAPI(config, method, endpoint, body) {
  let attempt = 0;
  const maxAttempts = 3;
  
  while (attempt < maxAttempts) {
    try {
      return await fetch(url, options);
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) throw error;
      
      // Wait: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}
```

---

## 📞 Support & Escalation

### Support Channels
- **Email**: support@rosstaxprepandbookkeeping.com
- **Phone**: (512) 489-6749
- **Portal**: https://www.rosstaxprepandbookkeeping.com/support

### Escalation Matrix
1. **Tier 1** (Support Team) - Client questions, status checks
2. **Tier 2** (Admin) - Transmission issues, approvals
3. **Tier 3** (Management) - Refund Advantage partnership issues
4. **Tier 4** (Executive) - Compliance violations, legal issues

---

## 📝 Summary

**Status**: ✅ **FULLY IMPLEMENTED**  
**Date**: February 3, 2026  
**Version**: 1.0.0  
**Maintenance**: Active support and monitoring

This integration provides a complete, production-ready bank products system with real-time processing, encryption, audit logging, and comprehensive client notifications.
