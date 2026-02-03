# Phase 5 Remaining Features - Implementation Roadmap

## Overview

This document outlines the 4 remaining features for Phase 5 (Client Registration, ERO Onboarding, Backend API Routes, and Logo/UI Polish) with detailed requirements, implementation steps, and integration points.

---

## 1. CLIENT PORTAL REGISTRATION ⏳

### Overview
Separate registration flow for clients to create accounts and access the client portal with secure password recovery.

### Files to Create
- `frontend/src/components/client/ClientRegistration.tsx` (400+ lines)
- `frontend/src/pages/ClientSignup.tsx` (optional landing page)
- Backend route: `/register/client` (already exists - update for enhancements)

### User Flow
```
Start → Enter Email → Verify Email (OTP) → Create Password → 
Personal Info (Name, Phone) → Review & Create Account → 
Email Confirmation → Redirect to Client Portal
```

### Component Structure

**ClientRegistration.tsx**:
```typescript
interface ClientSignupState {
  step: 'email' | 'otp-verify' | 'password' | 'info' | 'complete';
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  passwordStrength: 'weak' | 'good' | 'strong';
  emailVerified: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Steps**:
1. **Email Input** - Enter email, send OTP via MailChannels
2. **OTP Verification** - Enter 6-digit code from email, validate
3. **Password Setup** - Create password (12+ chars, strength meter), confirm
4. **Personal Info** - Name, phone, agree to terms
5. **Confirmation** - Show account created message, send welcome email

**Features**:
- Real-time password strength calculation
- Email OTP validation (5-minute expiry)
- Password confirmation matching
- Terms of Service acceptance checkbox
- "Back" button between steps (except email)
- Loading states during API calls
- Error handling with retry options
- Success state with "Go to Portal" button

### Backend Updates

**New Endpoint**: `POST /api/client/register-verify-email`
- Input: `{ email: string }`
- Generate 6-digit OTP, send via MailChannels
- Store OTP in `client_otp_verification` table (new table)
- Response: `{ success: true, otp_sent_to: email }`

**New Endpoint**: `POST /api/client/verify-otp`
- Input: `{ email: string, otp: string }`
- Check OTP validity (max 5 minutes old)
- Response: `{ success: true, token: temporary_token }`

**Update Endpoint**: `POST /register/client`
- Accept `temporary_token` in header for OTP-verified flow
- Create client record with verified flag set to true
- Send welcome email via MailChannels
- Redirect to client dashboard

### Database Changes
```sql
-- New table for OTP verification
CREATE TABLE IF NOT EXISTS client_otp_verification (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  token TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  verified INTEGER DEFAULT 0
);

-- Add verified flag to clients table
ALTER TABLE clients ADD COLUMN email_verified INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN phone_verified INTEGER DEFAULT 0;
```

### Password Recovery Flow (Bonus)
- New page: `/client/forgot-password`
- Endpoint: `POST /api/client/password-reset-request`
- Sends password reset link via email (valid 24 hours)
- Endpoint: `POST /api/client/password-reset` (with reset token)
- Allows users to reset password without current password

### Integration Points
- MailChannels API for OTP emails
- D1 database for OTP storage and client records
- JWT token generation for authenticated sessions
- Redirect to client portal dashboard post-signup

### Estimated Effort: 2-3 hours

---

## 2. ERO/PTIN ONBOARDING FLOW ⏳

### Overview
Multi-step professional tax preparer onboarding with credential verification, EFIN registration, software package purchase, and LMS certificate validation.

### Files to Create
- `frontend/src/components/ero/EROOnboarding.tsx` (700+ lines)
- `frontend/src/pages/EROSignup.tsx` (landing page)
- Backend routes: `src/routes/eroOnboarding.ts` (300+ lines)

### User Flow
```
Start → Personal Info → Credentials (PTIN/License) → 
EFIN Registration → Ross Tax Academy (Upload Cert) → 
Software Selection → Payment → Create Account → 
Tax Associate Role Assignment → Welcome Email
```

### Component Structure

**EROOnboarding.tsx**:
```typescript
interface EROSignupState {
  step: 'welcome' | 'personal' | 'credentials' | 'efin' | 'lms' | 'software' | 'payment' | 'complete';
  
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: 'sole_proprietor' | 'partnership' | 'corporation';
  
  // Credentials
  ptin: string;
  ptinVerified: boolean;
  licenseType: 'enrolled_agent' | 'cpa' | 'attorney' | 'tax_professional';
  licenseState: string;
  licenseNumber: string;
  licenseExpiration: string;
  
  // EFIN Registration
  firmName: string;
  firmEin: string;
  preparedReturnsCount: number;
  softwarePackage: 'lacerte' | 'proseries' | 'ultra';
  
  // LMS Certificate
  rossAcademyCert: File | null;
  certificationLevel: 'tax_associate' | 'tax_pro' | 'ea';
  
  // Payment
  softwarePrice: number;
  certificationFee: number;
  total: number;
  paymentMethod: 'credit_card' | 'bank_transfer';
  
  // Status
  isLoading: boolean;
  error: string | null;
  ptinVerifying: boolean;
}
```

**Steps**:

### Step 1: Welcome
- "Become a Tax Professional" headline
- Requirements checklist:
  - ✓ Valid PTIN or Enrolled Agent/CPA/Attorney credential
  - ✓ Ross Tax Academy certification
  - ✓ Minimum 5 prepared returns (if applicable)
  - ✓ Professional liability insurance (recommended)
- "Start" button → Personal Info

### Step 2: Personal Information
- First/Last Name (required)
- Email (required, must match PTIN if verifying)
- Phone (required)
- Business Name (optional for sole proprietor)
- Business Type (radio: Sole Proprietor, Partnership, Corporation)
- Next → Credentials

### Step 3: Credentials & License
- PTIN (required) with "Verify with IRS" button
  - Real-time validation against IRS PTIN database (mock API)
  - Shows: Name, Status (Active/Inactive), Expiration
- License Type (dropdown: Enrolled Agent, CPA, Attorney, Tax Professional)
- License State (50-state dropdown)
- License Number (required)
- License Expiration Date (date picker)
- Upload license document (PDF/image)
- Next → EFIN Registration

### Step 4: EFIN Registration
- Firm Name (required)
- Firm EIN (required, 9 digits)
- Number of Prior Returns Prepared (required)
- Software Package Selection:
  - ☐ Lacerte Pro ($499/year)
  - ☐ ProSeries Premium ($399/year)
  - ☐ UltraTax ($449/year)
- Confirm ERO compliance training
- Next → LMS Certificate

### Step 5: Ross Tax Academy Certificate
- Certificate Upload (PDF, max 10MB)
- Certification Level:
  - ○ Tax Associate (entry level)
  - ○ Tax Professional (intermediate)
  - ○ Enrolled Agent (advanced)
- Expiration Date (date picker)
- Transcript/Verification Code (optional)
- "Upload Certificate" button with progress bar
- Next → Software & Payment

### Step 6: Software & Payment
- Selected Software: Shows name, price, annual renewal
- Total Amount Due:
  - Software Package: $XXX
  - ERO Registration Fee: $99
  - Tax Professional Certification: $0 (covered by academy)
  - **Total: $XXX**
- Payment Method:
  - ○ Credit Card (Stripe integration)
  - ○ Bank Transfer
- Show success state with order number
- Next → Account Creation

### Step 7: Account Creation & Completion
- Show summary of registered information
- Create account button (auto-generates username: first.last@rosstaxprep)
- Send welcome email with:
  - EFIN details
  - Software activation link
  - ERO training materials
  - Tax Associate role confirmation
- Success page with:
  - "Welcome to Ross Tax Academy" message
  - Dashboard link
  - Software download links
  - Next steps (set up EFIN in software, complete ERO training)

### Backend Routes

**`src/routes/eroOnboarding.ts`**:

1. `POST /api/ero/onboarding/verify-ptin`
   - Input: `{ ptin: string }`
   - Call IRS PTIN verification API (mock for now)
   - Response: `{ valid: boolean, name: string, status: string, expiration: string }`

2. `POST /api/ero/onboarding/verify-credentials`
   - Input: `{ license_type, license_state, license_number }`
   - Validate against state bar/licensing databases
   - Response: `{ valid: boolean, license_holder_name: string, status: string }`

3. `POST /api/ero/onboarding/check-efin-availability`
   - Input: `{ firm_name: string, firm_ein: string }`
   - Check if EFIN already registered
   - Response: `{ available: boolean, message: string }`

4. `POST /api/ero/onboarding/upload-lms-certificate`
   - Input: Multipart form with PDF file
   - Store in R2 bucket: `/certificates/{user_id}/{timestamp}.pdf`
   - Verify PDF contains certification info
   - Response: `{ success: boolean, file_key: string }`

5. `POST /api/ero/onboarding/initiate-payment`
   - Input: `{ software_package: string, total_amount: number, payment_method: string }`
   - Create payment intent with Stripe
   - Response: `{ payment_intent_id: string, client_secret: string }`

6. `POST /api/ero/onboarding/complete`
   - Input: Complete ERO registration data
   - Create staff record with role='ptin_holder'
   - Create tax_associate record linking to LMS cert
   - Assign TAX_ASSOCIATE role with expiration date
   - Send welcome email via MailChannels
   - Return: `{ success: boolean, efin: string, access_key: string }`

7. `GET /api/ero/onboarding/software-packages`
   - Response: List of available software with prices, features, requirements

### Database Changes

```sql
-- Tax Professional/PTIN Holder Profile
CREATE TABLE IF NOT EXISTS tax_professionals (
  id TEXT PRIMARY KEY,
  staff_id INTEGER NOT NULL UNIQUE,
  ptin TEXT UNIQUE NOT NULL,
  ptin_verified INTEGER DEFAULT 0,
  license_type TEXT NOT NULL,
  license_state TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_expiration TEXT NOT NULL,
  license_document_key TEXT,
  firm_name TEXT,
  firm_ein TEXT,
  efin TEXT UNIQUE,
  efin_registration_date TEXT,
  prior_returns_count INTEGER,
  software_package TEXT,
  software_license_key TEXT,
  professional_liability_insurance INTEGER DEFAULT 0,
  insurance_expiration TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

-- LMS Certificate Tracking
CREATE TABLE IF NOT EXISTS lms_certificates (
  id TEXT PRIMARY KEY,
  staff_id INTEGER NOT NULL,
  certification_type TEXT NOT NULL, -- 'tax_associate', 'tax_professional', 'enrolled_agent'
  certificate_file_key TEXT NOT NULL,
  issued_date TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  transcript_code TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

-- Tax Associate Role Assignment
ALTER TABLE staff ADD COLUMN tax_associate_role_assigned_at TEXT;
ALTER TABLE staff ADD COLUMN tax_associate_cert_expires_at TEXT;
ALTER TABLE staff ADD COLUMN tax_associate_status TEXT DEFAULT 'inactive'; -- 'active', 'inactive', 'expired'

-- Software License Tracking
CREATE TABLE IF NOT EXISTS software_licenses (
  id TEXT PRIMARY KEY,
  staff_id INTEGER NOT NULL,
  software_name TEXT NOT NULL, -- 'lacerte', 'proseries', 'ultra'
  license_key TEXT NOT NULL UNIQUE,
  activation_date TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  seats_available INTEGER,
  purchase_date TEXT,
  purchase_price REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);
```

### Integration Points
- IRS PTIN verification API (or mock)
- State licensing database APIs
- R2 bucket for certificate storage
- Stripe for payment processing
- MailChannels for email notifications
- JWT token generation for ERO authentication

### Estimated Effort: 4-5 hours

---

## 3. BACKEND API ROUTES (Remaining) ⏳

### Routes Needed

**Refund Calculator**:
- `POST /api/refund-calculate` - Calculate estimated refund
  - Input: Income, filing status, dependents, withholding, deductions
  - Output: Estimated refund/amount owed, effective tax rate, optimization suggestions

**Services Catalog**:
- `GET /api/services` - List all 89 services with filtering
- `GET /api/services/:id` - Get service details
- `POST /api/services/:id/purchase` - Add service to cart

**ERO/PTIN Management** (separate from onboarding):
- `GET /api/ero/profile` - Get ERO profile
- `PATCH /api/ero/profile` - Update ERO profile
- `GET /api/ero/ptin-status` - Check PTIN status/expiration
- `POST /api/ero/cert-renewal` - Request PTIN renewal

**LMS Integration**:
- `GET /api/lms/courses` - List available courses
- `POST /api/lms/enroll` - Enroll in course
- `GET /api/lms/progress/:user_id` - Get course completion status
- `POST /api/lms/certificate-verify` - Verify certificate authenticity

**Role Management**:
- `POST /api/admin/assign-role/:user_id` - Assign role to user
- `DELETE /api/admin/role/:user_id/:role_id` - Remove role
- `GET /api/admin/role-assignments` - List all role assignments
- `PUT /api/admin/role/:role_id/permissions` - Update role permissions

**File Upload**:
- `POST /api/upload/certificate` - Upload tax cert/license
- `POST /api/upload/document` - Upload generic document
- `GET /api/document/:doc_id` - Download document (with presigned R2 URL)

### Implementation Priority
1. Refund Calculator API (needed by frontend)
2. Services Catalog API (query existing list)
3. LMS Certificate Verification (needed by ERO onboarding)
4. Role Management (security critical)
5. File Upload (storage)
6. ERO Status Routes (monitoring)

### Estimated Effort: 3-4 hours

---

## 4. LOGO PLACEMENT & UI POLISH ⏳

### Logo Requirements
- **Location**: Left corner of header/navigation
- **Design**: ROSS Tax & Bookkeeping logo (provided)
  - Colors: Rainbow, book, graduation cap
  - Text: "ROSS TAX & BOOKKEEPING"
  - Tagline: "EST. 2021 | LGBTQ OWNED"
- **No changes** to design or colors
- **Consistency**: Same logo across all pages

### Files to Update
1. `frontend/src/components/layout/Header.tsx` - Add logo
2. `frontend/src/components/layout/Navigation.tsx` - Add logo
3. `frontend/src/components/admin/AdminDashboard.tsx` - Add logo
4. `frontend/src/components/ero/ERODashboard.tsx` - Add logo
5. `frontend/src/components/client/ClientDashboard.tsx` - Add logo
6. `frontend/src/components/admin/AdminInvoicing.tsx` - Add logo
7. `frontend/src/components/tools/MaximumRefundCalculator.tsx` - Add logo
8. `frontend/src/components/services/ServicesCatalog.tsx` - Add logo

### Logo Component
```typescript
// frontend/src/components/common/RossLogo.tsx
export const RossLogo: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ size = 'medium' }) => {
  const sizes = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };
  
  return (
    <div className="flex items-center gap-2">
      <img 
        src="/logo.svg" 
        alt="Ross Tax & Bookkeeping" 
        className={sizes[size]}
      />
      <div className="text-sm font-bold">
        <div>ROSS TAX & BOOKKEEPING</div>
        <div className="text-xs text-gray-600">EST. 2021 | LGBTQ OWNED</div>
      </div>
    </div>
  );
};
```

### Styling Checklist
- [ ] Logo appears in left corner of all headers
- [ ] Consistent sizing across all pages
- [ ] Logo clickable to return home on all pages
- [ ] Professional spacing (12-16px margin)
- [ ] Responsive on mobile (adjust size)
- [ ] Color scheme matches ROSS branding
- [ ] No compression or distortion
- [ ] Accessibility: alt text, proper ARIA labels

### UI Polish Tasks
1. **AdminInvoicing.tsx**
   - Add logo to header
   - Adjust spacing and sizing
   - Verify responsive layout
   - Test on mobile
   - Check color contrast for accessibility

2. **MaximumRefundCalculator.tsx**
   - Add logo to header
   - Verify gradients match ROSS theme
   - Ensure result cards are readable
   - Test calculation accuracy with sample inputs
   - Mobile responsiveness

3. **ServicesCatalog.tsx**
   - Add logo to header
   - Check grid responsiveness
   - Verify search/filter functionality
   - Test list view layout
   - Confirm pricing display accuracy

4. **Header/Navigation Updates**
   - Add logo to all main navigation
   - Create consistent layout component
   - Ensure responsive menu on mobile
   - Verify dropdown menus work on all pages

5. **Cross-page Polish**
   - Consistent spacing and padding
   - Unified color palette
   - Typography hierarchy
   - Button consistency
   - Loading states and error messages
   - Mobile responsiveness test (375px, 768px, 1024px)

### Estimated Effort: 1-2 hours

---

## Overall Timeline

```
Current: Phase 5 at 37.5% (3/8 complete)

Recommended Order:
1. Client Portal Registration (2-3h) → 50% complete
2. ERO/PTIN Onboarding (4-5h) → 75% complete
3. Backend API Routes (3-4h) → 87.5% complete
4. Logo & UI Polish (1-2h) → 100% complete

Total Remaining: 10-14 hours
Estimated Completion: 1-2 work days
```

---

## Success Criteria

### Phase 5 Complete When:
✅ All 89 services listed and searchable
✅ Admin can create, send, track invoices
✅ Refund calculator calculates accurate estimates
✅ Clients can self-register with email verification
✅ ERO/PTIN holders can complete onboarding
✅ LMS certificates automatically verify PTIN eligibility
✅ TAX ASSOCIATE role assigned post-cert verification
✅ All operations audit logged
✅ ROSS logo appears consistently across all pages
✅ Mobile responsive on all devices
✅ All API endpoints authenticated and authorized
✅ Backend 100% integrated with frontend
✅ Zero security vulnerabilities
✅ Production deployment ready

---

**Next Session Focus**: Implement Client Portal Registration (highest priority for user acquisition)
