# Website Design Specifications
**Ross Tax Prep & Money Management Platform — Public + Authenticated Website**

---

## 1. Website Information Architecture

### 1.1 Public Site (No Login Required)

**URL Structure:**
```
/                              → Homepage
/products                      → Products overview (tax prep, money management)
/pricing                       → Pricing & fees
/how-it-works                  → Feature walkthrough
/security                      → Security & compliance
/support                       → Help center, FAQ
/contact                       → Contact form
/sign-up                       → Registration flow
/sign-in                       → Login page
/terms                         → Terms of Service
/privacy                       → Privacy Policy
```

### 1.2 Authenticated Site (Login Required)

**URL Structure:**
```
/dashboard                     → Overview, quick stats
/dashboard/accounts            → Account list & management
/dashboard/accounts/:id        → Single account details
/dashboard/accounts/:id/transactions → Transaction history
/dashboard/send-money          → P2P transfers, payments, bill pay
/dashboard/cards               → Card management
/dashboard/cards/virtual       → Issue virtual cards
/dashboard/cards/:id           → Card details & controls
/dashboard/mobile-deposit      → Check deposit interface
/dashboard/documents           → Tax documents, statements
/dashboard/documents/tax       → Tax returns (for preparers)
/dashboard/settings            → Account settings
/dashboard/settings/profile    → Personal profile
/dashboard/settings/security   → Password, MFA, devices
/dashboard/settings/contact    → Email, phone, address
/dashboard/support             → Help center, support tickets
/dashboard/support/chat        → Live chat
```

---

## 2. Homepage (Public)

### 2.1 Hero Section

**Visual Design:**
- Full-width navy background (#002B5C)
- Gradient overlay: Navy → transparent (bottom)
- Centered content
- Optional hero image (background)

**Content Structure:**
```
┌─────────────────────────────────────────────┐
│  Logo & Navigation                          │
│  ────────────────────────────────────────   │
│                                             │
│           HERO HEADLINE                     │
│    "Tax Prep & Money Management             │
│       Built on Trust"                       │
│                                             │
│         Subheading (descriptive)            │
│      Complete financial control,            │
│      from tax returns to daily spending      │
│                                             │
│  [Sign Up Free]  [See Demo]                 │
│                                             │
└─────────────────────────────────────────────┘
```

**Copy:**
- **Headline:** Clear value prop (not clever wordplay)
- **Subheading:** Benefit-focused, benefit statement
- **CTA 1:** Primary action (Sign Up) in gold
- **CTA 2:** Secondary action (Demo/Learn More) in navy outline

### 2.2 Trust Indicators Section

**Visual Layout:** 3 columns on desktop, 1 column on mobile

```
┌──────────┬──────────┬──────────┐
│ 🔒       │ 📊       │ ✅       │
│ SECURE   │ CLEAR    │ TRUSTED  │
│          │          │          │
│ Bank-    │ Plain    │ Trusted  │
│ grade    │ language,│ by tax   │
│ security │ no       │ pros     │
│          │ jargon   │          │
└──────────┴──────────┴──────────┘
```

**Design:**
- Icon (24px) centered above title
- Title: H4 (20px bold) in navy
- Description: Body small (14px) in dark gray
- Card container: White background, subtle border, no shadow

### 2.3 Features Section

**Layout:** Alternating left-right with image + text

**Section 1: Tax Preparation**
```
┌─────────────────┬─────────────────┐
│  Image/Video    │  Features Text  │
│  (2/3 width)    │  (1/3 width)    │
│                 │                 │
│                 │ ✓ E-file        │
│                 │ ✓ Form 8879     │
│                 │ ✓ Client mgmt   │
└─────────────────┴─────────────────┘
```

**Section 2: Money Management**
```
┌─────────────────┬─────────────────┐
│  Features Text  │  Image/Video    │
│  (1/3 width)    │  (2/3 width)    │
│                 │                 │
│ ✓ Accounts      │                 │
│ ✓ P2P transfers │                 │
│ ✓ Card limits   │                 │
└─────────────────┴─────────────────┘
```

**Design Rules:**
- Alternating left-right for visual rhythm
- Images max 600x400px
- Bullet points: 14px, with check icons (#28A745)
- Background: White OR light gray, never navy (need readability)

### 2.4 Pricing Section

**Layout:** 3-column card grid

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ BASIC       │  │ PROFESSIONAL│  │ BUSINESS    │
│ (Free tier) │  │ (Popular)   │  │ (Premium)   │
│             │  │             │  │             │
│ Tax prep    │  │ Tax prep    │  │ Tax prep    │
│ + Money mgmt│  │ + Money mgmt│  │ + Money mgmt│
│             │  │ + Priority  │  │ + Dedicated │
│             │  │   support   │  │   support   │
│             │  │             │  │             │
│ Free        │  │ $9.95/mo    │  │ $24.95/mo   │
│ [Sign Up]   │  │ [Sign Up]   │  │ [Sign Up]   │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Design:**
- Base card: White background, 1px border
- Popular card: Gold border (3px), background highlight
- Price: H3 (28px bold) in navy
- CTA button: Gold (primary tier), Navy outline (others)

### 2.5 Testimonials / Social Proof

**Layout:** Carousel or grid (3 visible on desktop)

```
┌────────────────────────────────┐
│  ⭐⭐⭐⭐⭐                        │
│  "Trusted by 50,000+ tax pros" │
│  John Smith, CPA               │
│  Smith Tax & Accounting        │
└────────────────────────────────┘
```

**Design:**
- Quote card: Light gray background, left border (navy)
- Stars: 5 gold stars
- Name: Medium weight, navy
- Title/company: Small, dark gray

### 2.6 FAQ Section

**Layout:** Expandable accordion

```
Question 1 (Expanded)
├─ Answer content (visible)
│
Question 2 (Collapsed)
│
Question 3 (Collapsed)
```

**Design:**
- Question: H4 (20px semi-bold), navy, with chevron icon
- Answer: Body text (16px), dark gray
- Expanded state: Gold top border, light background
- Collapsed state: Normal border
- Interaction: Smooth height animation

### 2.7 CTA Section (Bottom)

```
┌────────────────────────────────────┐
│  Ready to Get Started?             │
│                                    │
│  Join 50,000+ professionals who    │
│  trust Ross Tax Prep               │
│                                    │
│    [Sign Up Free] [Contact Sales]  │
└────────────────────────────────────┘
```

**Design:**
- Navy background (#002B5C)
- White text
- Primary CTA: Gold button
- Secondary CTA: White text with underline

---

## 3. Product Pages

### 3.1 Tax Preparation Product Page

**URL:** `/products/tax-prep`

**Sections:**
1. Hero (Navy + image)
2. Key features (3-column grid)
3. E-file capability (highlighted section)
4. Tax forms supported (expandable list)
5. Integrations (logo carousel: DocuSign, IRS, etc.)
6. Pricing (simplified tier comparison)
7. CTA section
8. FAQ (tax-specific)

**Unique Elements:**
- Feature icons (custom SVGs)
- Before/after comparison (manual prep vs. automated)
- Tax calendar (key dates and deadlines)
- Integration badges

### 3.2 Money Management Product Page

**URL:** `/products/money-management`

**Sections:**
1. Hero (Navy + image of app)
2. Account types (checking, savings, money market)
3. Card features (virtual + physical)
4. Security features (2FA, biometric, encryption)
5. Fraud protection features
6. P2P transfer capability
7. Mobile deposit feature
8. Integration with tax prep
9. Pricing & fees
10. CTA section
11. FAQ

**Unique Elements:**
- Account tier comparison table
- Card controls demo (freeze, limits)
- Mobile app screenshots (carousel)
- Security certifications (badges)

---

## 4. Security & Compliance Page

**URL:** `/security`

**Sections:**
1. Overview (trust statement)
2. Encryption (AES-256, TLS 1.3)
3. Authentication (MFA, biometric)
4. Compliance (FFIEC, SOC 2, BIPA, CCPA)
5. Audit logging (all access logged)
6. Data retention (customer controls)
7. Certifications (badges + links)
8. Contact security team (email)

**Design:**
- Icons for each security feature
- Compliance badge carousel
- Security statistics callouts
- Trust indicators throughout

---

## 5. Authentication Pages

### 5.1 Sign Up (Registration)

**Flow:**
```
1. Email verification
   [Email input] → [Check email] → [Verify code]
   
2. Identity verification
   [Name] [DOB] [SSN] [Address]
   
3. Account setup
   [Username] [Password] [Security Q]
   
4. MFA enrollment
   [Phone for SMS or] [Authenticator app]
   
5. Confirmation
   ✓ Account created → [Go to dashboard]
```

**Design:**
- Step indicator (numbered circles 1-5)
- Card-based form container
- Progress bar at top
- Navy background, white form
- Validation inline (real-time)
- Gold submit button

### 5.2 Sign In (Login)

**Layout:**
```
┌─ Card Container ────────────┐
│                             │
│  Sign In to Your Account    │
│                             │
│  Email: [____]              │
│  Password: [____]           │
│  Forgot password? (link)    │
│                             │
│  [ Sign In ]                │
│                             │
│  Don't have account?        │
│  [Create one]               │
│                             │
└─────────────────────────────┘
```

**Design:**
- Centered card (400px max-width)
- Navy background, white form
- Remember me checkbox (optional)
- Forgot password link
- Social login buttons (optional)
- Sign-up link at bottom

---

## 6. Authenticated Dashboard Pages

### 6.1 Dashboard Home / Overview

**Layout:**
```
┌─ Header ────────────────────────┐
│ Dashboard  [Account ▼] [⚙️]     │
├─────────────────────────────────┤
│                                 │
│  Quick Stats (4-column grid)    │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐│
│  │    │  │    │  │    │  │    ││
│  └────┘  └────┘  └────┘  └────┘│
│  Total   Accounts Transfers Cards│
│  Balance                         │
│                                 │
│  Recent Transactions            │
│  ┌──────────────────────────────┐│
│  │ Date │ Description │ Amount  ││
│  ├──────┼─────────────┼─────────┤│
│  │      │             │         ││
│  └──────┴─────────────┴─────────┘│
│                                 │
│  Quick Actions (4 buttons)      │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Send  │ │Pay   │ │Deposit│   │
│  │Money │ │Bills │ │Check │    │
│  └──────┘ └──────┘ └──────┘    │
│                                 │
└─────────────────────────────────┘
```

**Components:**
1. **Quick Stats Cards** — 4 metrics (balance, accounts, transfers, cards)
   - Icon + label + value
   - Navy background, gold text
   - Clickable (link to detail page)

2. **Recent Transactions** — Paginated table
   - Date, Description, Amount, Status
   - Status: Pending (orange), Posted (green), Declined (red)
   - Click row to see details

3. **Quick Actions** — 4 gold buttons
   - Send Money
   - Pay Bills
   - Deposit Check
   - Manage Cards

### 6.2 Accounts Page

**Layout:**
```
┌─ Header ────────────────────────┐
│ Accounts         [+ New Account] │
├─────────────────────────────────┤
│ Account Selector (Tabs)         │
│ ┌────────┬──────────┬────────────┤
│ │Checking│ Savings  │ Money Mkt  │
│ └────────┴──────────┴────────────┘
│                                 │
│ Account Detail (Selected: Chk)  │
│                                 │
│ ┌──────────────────────────────┐│
│ │ Account Name                 ││
│ │ Checking - Primary           ││
│ │                              ││
│ │ Account #: 1234XXXXXX5678   ││
│ │ Routing #: 121000248        ││
│ │ Balance: $5,234.56          ││
│ │ Available: $5,200.00        ││
│ │                              ││
│ │ [Transfer] [Details] [Close] ││
│ └──────────────────────────────┘│
│                                 │
│ Transaction History (Recent)    │
│ ┌──────────────────────────────┐│
│ │ [Date] [Desc] [Amount] [Stat]││
│ └──────────────────────────────┘│
│ [View All] [Export]             │
│                                 │
└─────────────────────────────────┘
```

### 6.3 Send Money Page

**Tab Navigation:**
```
  Send to Contact | Pay Bills | Request Money

  [Current Tab Content Below]
```

**Send Money Tab:**
```
Form:
─────────
[Recipient Type: ▼ Individual / Business]
[Recipient Email or Phone: ______]
[Or Account # ______]

[Search] or [Contacts ▼]

Selected Recipient:
─────────
John Doe (john@example.com)
Member since 2022
[Change]

Amount: $______
Purpose: [Optional text]
Speed: (○ Instant $0) (○ Standard $0) (○ Scheduled)

[Review] → [Confirm] → [Complete]
```

### 6.4 Cards Page

**Layout:**
```
┌─ Header ────────────────────────┐
│ Cards                [+New Card] │
├─────────────────────────────────┤
│ Card List (Card Grid 3-col)     │
│ ┌──────────────┐  ┌──────────────┐
│ │ Primary Card │  │ Travel Card  │
│ │ •••• 1234    │  │ •••• 5678    │
│ │ Exp: 12/27   │  │ Exp: 08/26   │
│ │ Status: Active│ │ Status: Frozen
│ │ Limit: $5K   │  │ Limit: $1K   │
│ │ [Manage]     │  │ [Manage]     │
│ └──────────────┘  │──────────────┘
│ ┌──────────────┐
│ │ Virtual Card │
│ │ •••• 9999    │
│ │ Exp: 03/26   │
│ │ [Manage]     │
│ └──────────────┘
└─────────────────────────────────┘
```

**Card Detail (on click):**
```
┌─────────────────────────────────┐
│ Visa Primary Card               │
│                                 │
│ •••••••••••••••• 1234           │
│ Exp: 12/27 | CVV: •••           │
│                                 │
│ Daily Limit: $5,000             │
│ Per-Transaction: $2,500         │
│ ATM Daily: $300                 │
│                                 │
│ Controls:                       │
│ ☑️ Online purchases enabled      │
│ ☑️ International enabled         │
│ ☑️ Contactless enabled           │
│ ☐ ATM enabled (disabled)         │
│                                 │
│ [Freeze Card] [Set Limits]      │
│ [Order New Card] [Cancel Card]  │
│                                 │
│ Recent Transactions:            │
│ [Transaction list below]        │
└─────────────────────────────────┘
```

---

## 7. Responsive Breakpoints

### 7.1 Mobile (320px - 575px)

**Changes:**
- Single column layout
- Hero image hidden (text only)
- Feature cards: 1 column
- Pricing cards: 1 column (swipeable)
- Form: Full width
- Navigation: Bottom tabs + hamburger menu
- Button: Full width
- Font: Reduced (14px body)

**Example Mobile Nav:**
```
┌─────────────────────────────┐
│ Logo      [☰]               │
└─────────────────────────────┘
  Main content (single column)
┌─────────────────────────────┐
│ 🏠 │ 💰 │ 📤 │ 💳 │ ⚙️      │
│Home│Send│ Txn│Cards│Menu    │
└─────────────────────────────┘
```

### 7.2 Tablet (576px - 991px)

**Changes:**
- 2-column grid where applicable
- Feature cards: 2 per row
- Navigation: Side drawer + hamburger
- Pricing: 3 columns (if space)
- Sidebar: Collapsible (icon-only when collapsed)

### 7.3 Desktop (992px+)

**Layout:** Full 3+ column grids
- Navigation: Persistent sidebar or top nav
- Pricing: 3 columns
- Content: Max-width 1200px container
- Spacing: Generous (32px+)

---

## 8. Navigation Patterns

### 8.1 Top Navigation (Public Site)

```
┌─────────────────────────────────────────────┐
│ [Logo]  Products  Pricing  Support  [SignIn]│
└─────────────────────────────────────────────┘
```

**Mobile:** Hamburger menu
```
┌───────────────────────────┐
│ Logo          [☰]         │
└───────────────────────────┘
  [Menu expanded on tap]
  ├─ Products
  ├─ Pricing
  ├─ Support
  └─ Sign In
```

### 8.2 Sidebar Navigation (Authenticated)

**Desktop:**
```
┌──────────────────┐
│  Logo            │
├──────────────────┤
│ 🏠 Dashboard     │
│ 💰 Accounts      │
│ 📤 Send Money    │
│ 💳 Cards         │
│ 📄 Documents     │
│ ⚙️  Settings     │
│ ❓ Support      │
└──────────────────┘
```

**Mobile:**
- Icon only (side-nav collapses)
- Label visible on hover/tap
- Or: Bottom tab bar instead

---

## 9. Form Patterns

### 9.1 Standard Form Layout

```
┌─ Form Container ────────────────┐
│                                 │
│ [Label]                         │
│ [Input field]                   │
│ [Helper text if needed]         │
│                                 │
│ [Label]                         │
│ [Input field]                   │
│                                 │
│ [Checkbox] I agree to terms     │
│                                 │
│ [Submit Button] [Cancel Link]   │
│                                 │
└─────────────────────────────────┘
```

### 9.2 Validation

**Inline validation (real-time):**
```
[Email]
[input@example.com] ✓
Valid email format

[Password]
[••••••••] ⚠️
Password too short (min 12)
Uppercase, numbers, symbols required
```

**On submit:**
- Highlight all errors in red
- Scroll to first error
- Show clear error message per field
- Disable submit until fixed

---

## 10. Accessibility Implementation

### 10.1 HTML Structure

**Semantic HTML:**
```html
<header role="banner">
  <nav role="navigation" aria-label="Main">...</nav>
</header>

<main role="main">
  <section aria-labelledby="hero-title">
    <h1 id="hero-title">...</h1>
  </section>
</main>

<footer role="contentinfo">...</footer>
```

### 10.2 Color Contrast

- Navy (#002B5C) on white: 7.8:1 ✅ (excellent)
- Gold (#FFD700) on navy: 5.2:1 ✅ (good)
- Gray (#495057) on white: 5.5:1 ✅ (good)

### 10.3 Focus Indicators

```css
:focus {
  outline: 3px solid #FFD700;
  outline-offset: 2px;
}
```

---

## 11. Performance Requirements

**Target Metrics:**
- Largest Contentful Paint (LCP): <2.5s
- First Input Delay (FID): <100ms
- Cumulative Layout Shift (CLS): <0.1

**Optimization:**
- Images: WebP format, lazy loading
- JavaScript: Code splitting, defer non-critical
- CSS: Minified, critical path extracted
- Caching: Browser cache headers
- CDN: Cloudflare for static assets

---

**[END OF WEBSITE SPECIFICATIONS]**
