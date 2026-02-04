# Ross Tax & Bookkeeping Money Management Platform
## Comprehensive Compliance Documentation

**Platform**: Digital Banking & Money Management  
**Provider**: Ross Tax Prep & Bookkeeping LLC  
**EIN**: 33-4891499  
**State**: Arkansas  
**Effective Date**: 2025  

---

## Table of Contents

1. [Federal Compliance](#federal-compliance)
2. [State Compliance](#state-compliance)
3. [Biometric Privacy Laws](#biometric-privacy-laws)
4. [Payment Card Network Rules](#payment-card-network-rules)
5. [User Agreements](#user-agreements)
6. [Privacy Policy](#privacy-policy)
7. [Cardholder Agreement](#cardholder-agreement)
8. [Biometric Consent Agreement](#biometric-consent-agreement)

---

## 1. Federal Compliance

### 1.1 Regulation E (Electronic Funds Transfer Act)

**Applicability**: All electronic funds transfers including P2P transfers, card transactions, and mobile deposits.

**Requirements**:
- ✅ **Error Resolution**: Must investigate errors within 10 business days
- ✅ **Transaction Receipts**: Provide confirmation for all transactions
- ✅ **Periodic Statements**: Monthly statements for accounts with transactions
- ✅ **Unauthorized Transaction Liability**: Limit customer liability to $50 if reported within 2 days
- ✅ **Preauthorized Transfers**: Notice requirements for recurring transfers
- ✅ **Disclosure**: Clear disclosure of fees, terms, and customer rights

**Implementation**:
- Transaction confirmations sent via real-time notifications
- Monthly statements generated automatically
- 24/7 fraud reporting hotline (to be configured)
- Error dispute process documented in User Agreement

### 1.2 Regulation CC (Funds Availability)

**Applicability**: Mobile check deposits and check clearing.

**Requirements**:
- ✅ **Funds Availability Schedule**: Disclose when deposited funds will be available
- ✅ **Next-Day Availability**: For government checks, cashier's checks, and first $225 of other checks
- ✅ **Hold Notices**: Provide notice when placing extended holds
- ✅ **New Account Rules**: Stricter holds for accounts < 30 days old

**Implementation**:
```typescript
// Funds availability schedule by account tier:
- Basic: 5 business days (regular), 10 days (first deposit)
- Premium: 3 business days (regular), 7 days (first deposit)  
- Business: 2 business days (regular), 5 days (first deposit)
```

### 1.3 Bank Secrecy Act (BSA) / Anti-Money Laundering (AML)

**Applicability**: All money services businesses.

**Requirements**:
- ✅ **Customer Identification Program (CIP)**: Verify customer identity
- ✅ **Suspicious Activity Reports (SARs)**: File for transactions ≥ $5,000 that appear suspicious
- ✅ **Currency Transaction Reports (CTRs)**: File for cash transactions > $10,000
- ✅ **Record Keeping**: Retain records for 5 years
- ✅ **AML Compliance Program**: Written policies, designated officer, training

**Implementation**:
- Identity verification during account creation (SSN, DOB, ID scan)
- Fraud scoring on all P2P transfers (threshold: 70/100)
- Automatic SAR triggers for suspicious patterns
- Transaction monitoring system (to be configured)
- AML Compliance Officer: [To Be Designated]

### 1.4 USA PATRIOT Act

**Applicability**: Enhanced customer due diligence.

**Requirements**:
- ✅ **Enhanced CDD**: For high-risk customers
- ✅ **Beneficial Ownership**: For business accounts, identify owners with ≥25% ownership
- ✅ **OFAC Screening**: Screen against sanctioned individuals/entities

**Implementation**:
- Enhanced verification for transfers > $2,500
- Business account beneficial ownership forms
- OFAC screening integration (to be configured)

### 1.5 Regulation D (Reserve Requirements)

**Applicability**: Savings and money market accounts.

**Requirements**:
- ✅ **Transaction Limits**: Maximum 6 withdrawals/transfers per month from savings/money market
- ✅ **Reclassification**: Convert to checking if limit exceeded 3+ times in 12 months

**Implementation**:
- Transaction counter in database
- Warning notifications at 5 withdrawals
- Automatic reclassification logic

### 1.6 Truth in Savings Act (TISA) / Regulation DD

**Applicability**: Deposit accounts with interest.

**Requirements**:
- ✅ **APY Disclosure**: Annual Percentage Yield must be disclosed prominently
- ✅ **Fee Schedule**: All fees must be disclosed upfront
- ✅ **Account Opening Disclosures**: Provide at account opening
- ✅ **Periodic Statement Disclosures**: Include APY earned on statements

**Implementation**:
```
Savings Account: 1.50% APY
Money Market Account: 2.25% APY
Checking Account: 0.01% APY
```

### 1.7 Electronic Signatures in Global and National Commerce Act (E-SIGN Act)

**Applicability**: All electronic agreements and disclosures.

**Requirements**:
- ✅ **Consent**: Obtain affirmative consent to electronic delivery
- ✅ **Hardware/Software Requirements**: Disclose system requirements
- ✅ **Right to Paper**: Option to receive paper copies
- ✅ **Retention**: Demonstrate ability to retain electronic records

**Implementation**:
- Electronic consent checkboxes on all agreements
- PDF download links for all disclosures
- Email delivery with read receipts
- 7-year retention in R2 storage

### 1.8 Gramm-Leach-Bliley Act (GLBA)

**Applicability**: Financial institutions handling customer information.

**Requirements**:
- ✅ **Privacy Notice**: Initial and annual privacy notices
- ✅ **Opt-Out**: Right to opt out of information sharing
- ✅ **Safeguards Rule**: Implement information security program
- ✅ **Pretexting Provisions**: Prevent unauthorized access to customer info

**Implementation**:
- Privacy notice provided at account opening
- Opt-out mechanism in account settings
- AES-256 encryption for all PII
- Multi-factor authentication required

---

## 2. State Compliance

### 2.1 Arkansas Money Transmitter License

**Requirement**: Arkansas Code § 23-55-101 et seq.

**Status**: ⚠️ **LICENSE REQUIRED BEFORE LAUNCH**

**Process**:
1. File application with Arkansas Securities Department
2. Submit audited financial statements
3. Provide surety bond ($25,000 - $500,000 based on volume)
4. Background checks on owners/officers
5. Pay licensing fee ($1,000)

**Exemptions**: May qualify for "Agent of Payee" exemption if only facilitating refund deposits.

### 2.2 Arkansas Uniform Commercial Code (UCC)

**Article 3**: Negotiable Instruments (Checks)  
**Article 4**: Bank Deposits and Collections  
**Article 4A**: Funds Transfers

**Compliance**: Follow UCC rules for check deposits, endorsements, and electronic fund transfers.

---

## 3. Biometric Privacy Laws

### 3.1 Illinois Biometric Information Privacy Act (BIPA) - 740 ILCS 14/

**Applicability**: Collection/storage of facial biometrics from Illinois residents.

**Requirements**:
- ✅ **Written Policy**: Publish biometric data retention policy
- ✅ **Informed Consent**: Obtain written consent before collection
- ✅ **Purpose Disclosure**: Disclose purpose and duration of storage
- ✅ **No Sale/Profit**: Cannot sell/profit from biometric data
- ✅ **Disclosure Limitations**: Only share with service providers
- ✅ **Security Standards**: Use reasonable security measures
- ✅ **Retention Limits**: Delete within 3 years or when purpose fulfilled
- ✅ **Private Right of Action**: Individuals can sue for violations ($1,000 - $5,000 per violation)

**Implementation**:
```typescript
// BIPA-compliant consent agreement (see src/services/biometricAuthService.ts)
- Explicit consent checkbox before enrollment
- Retention period: 3 years from last login
- Automatic deletion job runs monthly
- Audit log of all consent/revocation events
```

### 3.2 California Consumer Privacy Act (CCPA) / California Privacy Rights Act (CPRA)

**Applicability**: Biometric data from California residents.

**Requirements**:
- ✅ **Right to Know**: Disclose what biometric data is collected
- ✅ **Right to Delete**: Delete biometric data upon request
- ✅ **Right to Opt-Out**: Opt out of sale (we don't sell)
- ✅ **Privacy Policy**: Detailed privacy policy with biometric disclosures
- ✅ **Notice at Collection**: Notice at point of collection

**Implementation**:
- Privacy policy includes biometric data section
- "Delete My Biometric Data" button in settings
- No sale of biometric data (never)
- California-specific notices for CA residents

### 3.3 Texas Capture or Use of Biometric Identifier (TX Bus. & Com. Code § 503.001)

**Requirements**:
- ✅ **Notice**: Inform before capturing biometric identifier
- ✅ **Consent**: Obtain consent before capturing
- ✅ **Destruction**: Destroy within reasonable time after purpose fulfilled

**Implementation**:
- Texas-specific consent notice
- Biometric data retention: same 3-year policy as BIPA

### 3.4 Washington Biometric Privacy Law (RCW 19.375)

**Requirements**:
- ✅ **Consent**: Obtain consent before enrollment
- ✅ **Notice**: Provide notice of biometric collection
- ✅ **Purpose**: Disclose purpose of collection

**Implementation**: Covered by comprehensive biometric consent agreement.

---

## 4. Payment Card Network Rules

### 4.1 Visa Core Rules and Visa Product and Service Rules

**Applicability**: Visa debit card issuing.

**Requirements**:
- ✅ **Issuer License**: Partner with licensed Visa issuer (e.g., Marqeta, Stripe)
- ✅ **PCI DSS Compliance**: Level 1 certification required for card issuers
- ✅ **Card Design**: Follow Visa brand guidelines
- ✅ **Fraud Monitoring**: Real-time transaction monitoring
- ✅ **Dispute Resolution**: Follow Visa dispute procedures
- ✅ **Zero Liability**: Protect cardholders from unauthorized transactions

**Implementation**:
- Partner with **Marqeta** (licensed Visa issuer)
- PCI DSS Level 1 compliance via Marqeta infrastructure
- Encrypted card storage (AES-256)
- Real-time authorization hooks
- 24/7 fraud monitoring
- Zero liability policy in Cardholder Agreement

### 4.2 PCI DSS (Payment Card Industry Data Security Standard)

**Level**: Level 1 (processing > 6 million transactions/year, or any card issuer)

**Requirements**:
- ✅ **Firewall**: Install and maintain firewall configuration
- ✅ **Encryption**: Encrypt transmission of cardholder data
- ✅ **Anti-Virus**: Use and regularly update anti-virus software
- ✅ **Access Control**: Restrict access to cardholder data
- ✅ **Unique IDs**: Assign unique ID to each person with access
- ✅ **Physical Security**: Restrict physical access to cardholder data
- ✅ **Monitoring**: Track and monitor all access
- ✅ **Testing**: Regularly test security systems
- ✅ **Policies**: Maintain information security policy
- ✅ **SAQ**: Complete Self-Assessment Questionnaire annually
- ✅ **External Audit**: Quarterly Approved Scanning Vendor (ASV) scans
- ✅ **On-Site Audit**: Annual on-site audit by Qualified Security Assessor (QSA)

**Implementation**:
- Marqeta handles card data storage (they are PCI Level 1 certified)
- We tokenize card numbers (never store raw PANs)
- Cloudflare WAF protects API endpoints
- TLS 1.3 for all data in transit
- AES-256 for data at rest
- Quarterly ASV scans (to be scheduled)
- Annual QSA audit (to be scheduled)

---

## 5. User Agreements

### 5.1 Terms of Service

```markdown
# Ross Tax & Bookkeeping Digital Banking Terms of Service

Effective Date: [INSERT DATE]

## 1. Agreement to Terms

By opening a Ross Tax & Bookkeeping money management account ("Account"), you agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, and all applicable laws and regulations.

## 2. Eligibility

To open an Account, you must:
- Be at least 18 years old
- Be a U.S. citizen or permanent resident
- Provide a valid Social Security Number or Tax Identification Number
- Provide a valid government-issued ID
- Have a valid U.S. residential address

## 3. Account Types

### 3.1 Checking Account
- 0.01% APY
- No minimum balance
- Unlimited transactions
- Overdraft protection available (Premium/Business tiers)

### 3.2 Savings Account
- 1.50% APY
- No minimum balance
- 6 withdrawals per month (Regulation D)
- FDIC insured up to $250,000

### 3.3 Money Market Account
- 2.25% APY
- $1,000 minimum balance
- 6 withdrawals per month (Regulation D)
- FDIC insured up to $250,000

## 4. Account Tiers

### 4.1 Basic Tier (Free)
- $1,000 daily transaction limit
- $5,000 monthly transaction limit
- $500 per-transaction limit
- No monthly fee

### 4.2 Premium Tier ($9.95/month)
- $5,000 daily transaction limit
- $25,000 monthly transaction limit
- $2,500 per-transaction limit
- $500 overdraft protection
- ATM fee reimbursement (up to $20/month)
- Early direct deposit (2 days early)

### 4.3 Business Tier ($24.95/month)
- $25,000 daily transaction limit
- $150,000 monthly transaction limit
- $10,000 per-transaction limit
- $2,500 overdraft protection
- Business bookkeeping integration
- Dedicated account manager
- Bulk payment processing

## 5. Fees

### 5.1 Monthly Fees
- Basic: $0
- Premium: $9.95
- Business: $24.95

### 5.2 Transaction Fees
- P2P Transfer: FREE
- Mobile Check Deposit: FREE
- Domestic Wire: $15
- International Wire: $45
- Stop Payment: $30
- Overdraft (NSF): $35
- Paper Statement: $5/month

### 5.3 Card Fees
- Virtual Card: FREE
- Physical Card Issuance: $5
- Card Replacement: $10
- International Transaction: 3% of amount
- ATM Withdrawal (out-of-network): $2.50

## 6. FDIC Insurance

Your deposits are insured up to $250,000 per depositor, per account ownership category, by the Federal Deposit Insurance Corporation (FDIC) through our partner bank, [PARTNER BANK NAME].

## 7. Electronic Funds Transfers

### 7.1 Your Liability for Unauthorized Transfers

Tell us AT ONCE if you believe your card or PIN has been lost or stolen, or if you believe an electronic fund transfer has been made without your permission. You could lose all the money in your Account.

If you tell us within 2 business days after you learn of the loss or theft, you can lose no more than $50 if someone used your card or PIN without your permission.

If you do NOT tell us within 2 business days, and we can prove we could have stopped someone from using your card or PIN without your permission if you had told us, you could lose as much as $500.

### 7.2 Our Liability for Failure to Complete Transfers

If we do not complete a transfer to or from your Account on time or in the correct amount according to our agreement with you, we will be liable for your losses or damages. However, we will NOT be liable if:

- Your Account does not have enough money to make the transfer
- Circumstances beyond our control prevent the transfer
- Your funds are subject to legal process or other claim
- We have reason to believe the transaction is unauthorized

## 8. Dispute Resolution

### 8.1 Arbitration Agreement

You and Ross Tax & Bookkeeping agree to arbitrate all disputes and claims between us. This includes claims arising out of or relating to any aspect of the relationship between us, whether based in contract, tort, statute, fraud, misrepresentation, or any other legal theory.

### 8.2 Class Action Waiver

You and Ross Tax & Bookkeeping agree that any arbitration will be conducted in individual capacities only and not as a class action.

## 9. Amendments

We may amend these Terms at any time by posting the revised Terms on our website. Your continued use of the Account after the effective date of the revised Terms constitutes your acceptance of the Terms as modified.

## 10. Termination

We may terminate your Account at any time for any reason with 30 days' notice. You may close your Account at any time by withdrawing all funds and notifying us in writing.

## 11. Governing Law

These Terms are governed by the laws of the State of Arkansas and applicable federal law.

## 12. Contact Us

Ross Tax Prep & Bookkeeping LLC  
[ADDRESS]  
Conway, AR 72034  
Phone: [PHONE]  
Email: support@rosstaxprepandbookkeeping.com
```

---

## 6. Privacy Policy

(See separate PRIVACY-POLICY.md document - to be created)

Key Points:
- Information we collect (name, SSN, address, transaction history, biometric data)
- How we use information (identity verification, fraud prevention, service improvement)
- Information sharing (service providers, legal requirements, never sold)
- Security measures (AES-256 encryption, TLS 1.3, facial recognition 2FA)
- Your rights (access, deletion, opt-out, data portability)
- California/Illinois/Texas-specific disclosures

---

## 7. Cardholder Agreement

(See separate CARDHOLDER-AGREEMENT.md document - to be created)

Key Points:
- Card activation and use
- Transaction authorization
- Fees (foreign transaction, ATM, replacement)
- Lost/stolen card liability
- Dispute procedures
- Zero liability policy
- Card controls and limits
- International use restrictions

---

## 8. Biometric Consent Agreement

(Implemented in src/services/biometricAuthService.ts - BIOMETRIC_CONSENT_TEXT constant)

Key Points:
- Purpose: identity verification for login and sensitive transactions
- Collection: facial photographs during enrollment and verification
- Storage: encrypted, 3-year retention
- Disclosure: only to authorized service providers (AWS/Azure/Face++)
- Security: AES-256 encryption, access controls
- Rights: deletion, revocation, complaint filing
- Alternative authentication: password-based option available
- BIPA compliance for Illinois residents

---

## Implementation Checklist

### Pre-Launch Requirements

- [ ] **Arkansas Money Transmitter License**: File application with Arkansas Securities Department
- [ ] **FDIC Insurance Partnership**: Partner with FDIC-insured bank
- [ ] **Card Issuing Partnership**: Integrate with Marqeta or Stripe Issuing
- [ ] **Biometric Provider**: Contract with AWS Rekognition, Azure Face API, or Face++
- [ ] **PCI DSS Certification**: Complete SAQ, schedule ASV scans and QSA audit
- [ ] **BSA/AML Program**: Designate compliance officer, implement monitoring
- [ ] **OFAC Screening**: Integrate OFAC sanctions screening
- [ ] **Legal Review**: Have all agreements reviewed by licensed attorney
- [ ] **Privacy Policy**: Publish comprehensive privacy policy
- [ ] **Terms of Service**: Publish terms of service
- [ ] **Cardholder Agreement**: Publish cardholder agreement
- [ ] **Fee Disclosure**: Post fee schedule prominently
- [ ] **E-SIGN Disclosures**: Implement electronic consent flow
- [ ] **Reg E Disclosures**: Provide error resolution procedures
- [ ] **Reg CC Disclosures**: Publish funds availability schedule
- [ ] **TISA Disclosures**: Display APY and fee disclosures

### Ongoing Compliance

- [ ] **Monthly**: Biometric data retention review and deletion
- [ ] **Quarterly**: PCI ASV scans, transaction monitoring review
- [ ] **Semi-Annual**: BSA/AML risk assessment
- [ ] **Annual**: Privacy policy update, PCI QSA audit, staff training
- [ ] **As Needed**: SAR filing (within 30 days), CTR filing (within 15 days)

---

**Disclaimer**: This compliance documentation is for informational purposes only and does not constitute legal advice. Consult with licensed attorneys specializing in banking law, privacy law, and payment card regulations before launching any money services business.
