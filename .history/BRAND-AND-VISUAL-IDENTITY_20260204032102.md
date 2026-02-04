# Brand & Visual Identity Guidelines
**Ross Tax Prep & Money Management Platform**

---

## 1. Brand Vision & Philosophy

### 1.1 Brand Promise
**"Trusted. Clear. Secure. Always."**

We provide institutional-grade financial services with military-precision reliability. Our brand conveys authority, transparency, and unwavering security—no flashiness, no confusion, just steady guidance through complex financial decisions.

### 1.2 Design Posture
- **Institutional**: Bank-grade credibility
- **Military-aligned**: Precision, discipline, reliability
- **Reliability-first**: Every design choice reduces risk and confusion
- **Accessibility-driven**: WCAG AA+, plain language, universal design

### 1.3 Core Values in Design
| Value | Visual Expression |
|-------|------------------|
| **Trust** | Navy blue foundation; consistent patterns; clear labeling |
| **Security** | Locks, shields, verified checkmarks; real-time feedback |
| **Clarity** | Generous white space; explicit labels; no hidden gestures |
| **Precision** | Aligned grids; consistent spacing; mathematical typography |
| **Accessibility** | High contrast; large touch targets; redundant cues |

---

## 2. Color Palette

### 2.1 Primary Colors

#### Deep Navy (#002B5C)
- **Usage:** Primary background, main UI elements, trust-building hero sections
- **Psychology:** Authority, stability, financial responsibility
- **Hex:** `#002B5C`
- **RGB:** `rgb(0, 43, 92)`
- **CMYK:** `100%, 53%, 0%, 64%`

#### Navy Darker (#001F47)
- **Usage:** Secondary backgrounds, subtle depth, inactive states
- **Hex:** `#001F47`
- **RGB:** `rgb(0, 31, 71)`
- **Darker Navy (#001529):** Ultra-dark backgrounds, text on navy

### 2.2 Accent Colors

#### Chrome Gold (#FFD700)
- **Usage:** CTAs, highlights, success states, achievement badges
- **Psychology:** Premium quality, success, achievement
- **Hex:** `#FFD700`
- **RGB:** `rgb(255, 215, 0)`
- **CMYK:** `0%, 16%, 100%, 0%`

#### Dark Gold (#DAA520) 
- **Usage:** Hover states, secondary accents, muted highlights
- **Hex:** `#DAA520`
- **RGB:** `rgb(218, 165, 32)`

#### Bronze Gold (#B8860B)
- **Usage:** Disabled states, low-priority elements
- **Hex:** `#B8860B`
- **RGB:** `rgb(184, 134, 11)`

### 2.3 Functional Colors

#### Success Green (#28A745)
- **Usage:** Approved transactions, positive confirmations, checkmarks
- **Hex:** `#28A745`
- **RGB:** `rgb(40, 167, 69)`

#### Alert Red (#DC3545)
- **Usage:** Error states, fraud alerts, warnings
- **Hex:** `#DC3545`
- **RGB:** `rgb(220, 53, 69)`

#### Warning Orange (#FFC107)
- **Usage:** Pending states, caution flags, approvals needed
- **Hex:** `#FFC107`
- **RGB:** `rgb(255, 193, 7)`

#### Information Blue (#0D6EFD)
- **Usage:** Information icons, help text, secondary CTAs
- **Hex:** `#0D6EFD`
- **RGB:** `rgb(13, 110, 253)`

### 2.4 Neutral Colors

#### White (#FFFFFF)
- **Usage:** Primary text, main content background, high contrast
- **Hex:** `#FFFFFF`
- **RGB:** `rgb(255, 255, 255)`

#### Light Gray (#F8F9FA)
- **Usage:** Secondary backgrounds, card backgrounds, hover states
- **Hex:** `#F8F9FA`
- **RGB:** `rgb(248, 249, 250)`

#### Medium Gray (#E9ECEF)
- **Usage:** Borders, dividers, disabled inputs
- **Hex:** `#E9ECEF`
- **RGB:** `rgb(233, 236, 239)`

#### Dark Gray (#495057)
- **Usage:** Secondary text, labels, annotations
- **Hex:** `#495057`
- **RGB:** `rgb(73, 80, 87)`

#### Charcoal (#212529)
- **Usage:** Primary text, high-contrast text on light backgrounds
- **Hex:** `#212529`
- **RGB:** `rgb(33, 37, 41)`

### 2.5 Color Usage Rules

**Rule 1: Navy-First**
- Every page should be predominantly navy (at least 40% of screen)
- Creates institutional, stable foundation

**Rule 2: Gold as Call-to-Action**
- All primary CTAs use chrome gold
- Only the most important action per section uses gold
- Secondary actions use navy text with border

**Rule 3: Functional Colors (Strict Use)**
- Green = success only
- Red = error/fraud only
- Orange = warning only
- Never use functional colors decoratively

**Rule 4: High Contrast (WCAG AA)**
- Navy text on white: 7.8:1 contrast (excellent)
- Gold on navy: 5.2:1 contrast (good)
- Gray on white: 5.5:1 contrast (good)
- All text must meet minimum 4.5:1 for normal text, 3:1 for large text

---

## 3. Typography

### 3.1 Font Family

#### Primary Font: Inter (Google Fonts)
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Why Inter?**
- Designed for screens (high legibility at small sizes)
- Extensive character set (supports multilingual)
- Open source + professional quality
- WCAG AAA compliant

#### Fallback Stack
1. `-apple-system` — iOS/macOS native font
2. `BlinkMacSystemFont` — macOS Chrome/Safari
3. `'Segoe UI'` — Windows native font
4. Generic `sans-serif` — Fallback

### 3.2 Type Scale

**Principle:** Mathematical scale (1.125 multiplier = Major Second)

| Use | Size | Weight | Line-Height | Letter-Spacing |
|-----|------|--------|-------------|----------------|
| **H1 / Hero** | 48px | 700 Bold | 1.2 (57.6px) | -0.5px |
| **H2 / Section** | 36px | 700 Bold | 1.3 (46.8px) | -0.3px |
| **H3 / Subsection** | 28px | 700 Bold | 1.4 (39.2px) | -0.2px |
| **H4 / Card Title** | 20px | 600 Semi-bold | 1.4 (28px) | 0px |
| **Body / Large** | 18px | 400 Regular | 1.6 (28.8px) | 0px |
| **Body / Normal** | 16px | 400 Regular | 1.6 (25.6px) | 0px |
| **Body / Small** | 14px | 400 Regular | 1.5 (21px) | 0px |
| **Label / Form** | 13px | 500 Medium | 1.5 (19.5px) | 0.5px |
| **Caption / Helper** | 12px | 400 Regular | 1.4 (16.8px) | 0px |

**CSS Example:**
```css
h1 {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.5px;
  color: #002B5C;
}
```

### 3.3 Font Weights

| Weight | Usage |
|--------|-------|
| **400 Regular** | Body text, descriptions, default state |
| **500 Medium** | Labels, form fields, navigation items |
| **600 Semi-bold** | Card titles, emphasis, moderate hierarchy |
| **700 Bold** | Headlines, important labels, primary emphasis |

**Note:** Only use 400, 500, 600, 700. Do not use 300 (too thin) or 800+ (too heavy).

### 3.4 Typography Rules

**Rule 1: Single-Column Text**
- Max line length: 75 characters (optimal reading)
- Apply max-width: 600px to body text containers

**Rule 2: Heading Hierarchy**
- Never skip heading levels (H1 → H2 → H3, not H1 → H3)
- Use CSS to style visually if needed, but preserve semantic structure

**Rule 3: All-Caps Sparingly**
- Use all-caps for labels, buttons, badges only
- Never use all-caps for body text (reduces readability by 20%)

**Rule 4: Emphasis**
- Use **bold (600-700 weight)** for emphasis, NOT italics
- Italics reserved for legal disclaimers, citations

**Rule 5: Accessible Links**
- Underline all links in body text
- Color alone is not sufficient (requires underline or other indicator)
- Hover state: gold underline + bold

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

**Base unit: 8px**

| Spacing | Value | Usage |
|---------|-------|-------|
| **XS** | 4px | Micro spacing (icon padding) |
| **S** | 8px | Component padding, tight spacing |
| **M** | 16px | Standard padding, section gaps |
| **L** | 24px | Section spacing, card margins |
| **XL** | 32px | Major section breaks |
| **2XL** | 48px | Full-page section gaps |

**CSS Variables:**
```css
--spacing-xs: 4px;
--spacing-s: 8px;
--spacing-m: 16px;
--spacing-l: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

### 4.2 Grid System

**12-Column Grid**
- Desktop: 1200px max-width container
- Tablet: 768px max-width container
- Mobile: 100% width with 16px margins
- Gutter: 24px between columns

### 4.3 Layout Patterns

#### Pattern 1: Hero Section
- Full-width navy background (#002B5C)
- Centered content container
- Headline: H1 (48px bold)
- Subheading: Body large (18px regular)
- CTA: Gold button (large, prominent)
- Gradient overlay: Navy → transparent bottom

#### Pattern 2: Content Card
- White background (#FFFFFF)
- 16px padding (all sides)
- Subtle border: 1px #E9ECEF
- 4px border-radius (soft corners)
- Box shadow: 0 2px 4px rgba(0,0,0,0.1)
- Max-width on content inside

#### Pattern 3: Form Section
- Navy background (#002B5C)
- White form inputs (#FFFFFF)
- Labels: Medium 13px above input
- Helper text: Caption 12px below input in dark gray
- 24px vertical spacing between form fields
- Gold submit button (full-width on mobile, auto on desktop)

---

## 5. Imagery & Iconography

### 5.1 Icon System

**Style:** Outlined, simple, literal

**Specifications:**
- Size grid: 16px, 20px, 24px, 32px, 48px (use one consistently)
- Stroke width: 1.5px (legible at 16px+)
- Corner radius: 2px (slightly rounded)
- Color: Inherit from text color (navy or white)

**Icon Categories:**

| Category | Examples | Usage |
|----------|----------|-------|
| **Navigation** | Home, Settings, Users, Reports | Tab bar, sidebar, menu |
| **Actions** | Send, Download, Share, Print | Buttons, toolbars |
| **Status** | Check, Clock, Alert, Lock | Transaction status, security |
| **Finance** | Dollar, CreditCard, Bank, Wallet | Financial icons |
| **Communication** | Chat, Mail, Bell, Phone | Notifications, support |

**Example Icon Markup:**
```html
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M5 12l5 5L19 7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### 5.2 Imagery (Photographs)

**Style:** Minimal, professional, Navy/Gold

**Usage:**
- Hero sections (large, atmospheric)
- Team pages (headshots, professional dress)
- Case studies (real customer scenarios)
- Never use stock photos alone; add navy overlay + white text

**Overlay Pattern:**
```css
background: linear-gradient(135deg, rgba(0, 43, 92, 0.7), rgba(0, 31, 71, 0.7)), 
            url('image.jpg');
background-size: cover;
background-position: center;
```

### 5.3 No Decorative Illustrations

**Rule:** Avoid cartoonish illustrations, emoji, or playful graphics

**Why:** Undermines institutional credibility; unnecessary visual noise

**Alternative:** Use icons + photography + data visualizations

---

## 6. Component Library

### 6.1 Button Styles

#### Primary Button (Gold)
```css
.btn-primary {
  background-color: #FFD700;
  color: #002B5C;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-primary:hover {
  background-color: #DAA520;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.2);
}
```

#### Secondary Button (Navy Outline)
```css
.btn-secondary {
  background-color: transparent;
  color: #002B5C;
  border: 2px solid #002B5C;
  padding: 10px 22px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-secondary:hover {
  background-color: #002B5C;
  color: #FFFFFF;
}
```

#### Danger Button (Red)
```css
.btn-danger {
  background-color: #DC3545;
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.btn-danger:hover {
  background-color: #C82333;
}
```

### 6.2 Form Input

```css
input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #212529;
  background-color: #FFFFFF;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #FFD700;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
}

input:disabled {
  background-color: #F8F9FA;
  color: #6C757D;
  cursor: not-allowed;
}
```

### 6.3 Cards

```css
.card {
  background-color: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 200ms ease, transform 200ms ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

### 6.4 Alert Messages

#### Success Alert
```css
.alert-success {
  background-color: #D4EDDA;
  border: 1px solid #C3E6CB;
  color: #155724;
  padding: 12px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-success::before {
  content: "✓";
  font-weight: bold;
  font-size: 18px;
}
```

#### Error Alert
```css
.alert-error {
  background-color: #F8D7DA;
  border: 1px solid #F5C6CB;
  color: #721C24;
  padding: 12px 16px;
  border-radius: 4px;
}
```

---

## 7. Responsive Design

### 7.1 Breakpoints

| Device | Breakpoint | Width | Layout |
|--------|-----------|-------|--------|
| **Mobile** | `max-width: 575px` | 320px–575px | Single column, full-width |
| **Tablet** | `576px to 991px` | 576px–991px | 2-column grid |
| **Desktop** | `min-width: 992px` | 992px+ | 3-4 column grid |
| **Large Desktop** | `min-width: 1200px` | 1200px+ | Full grid, fixed containers |

### 7.2 Responsive Rules

**Rule 1: Mobile First**
- Design for 375px (smallest iPhone)
- Scale up with media queries
- Use `max-width` containers, not fixed widths

**Rule 2: Touch Targets**
- Minimum 48x48px for interactive elements
- 8px padding around touch areas
- Avoid hover-only interactions (use tap-to-expand)

**Rule 3: Flexible Navigation**
- Mobile: Bottom tab bar (5 items max)
- Tablet: Side navigation or horizontal tabs
- Desktop: Top navigation + side menu

---

## 8. Accessibility Requirements (WCAG AA+)

### 8.1 Color Contrast

**Minimum Ratios:**
- Normal text: 4.5:1 contrast ratio
- Large text (18px+ bold or 24px+): 3:1 ratio
- Graphics/components: 3:1 ratio

**Testing:** Use WebAIM Contrast Checker or similar

### 8.2 Typography Accessibility

- Minimum font size: 14px for body text
- Maximum line length: 75 characters (600px max-width)
- Line-height: 1.5 for body text (spacing between lines)
- Avoid ALL-CAPS except for labels/badges

### 8.3 Interactive Elements

- All buttons must have visible focus indicator
- Focus indicator: 3px outline in gold (#FFD700)
- Keyboard navigation must be 100% functional (no mouse-only interactions)
- Tab order must be logical (left-to-right, top-to-bottom)

### 8.4 Images & Icons

- All images require descriptive `alt` text
- Icons must have aria-label or title attribute
- Example: `<img alt="Download tax return in PDF format" src="..." />`

### 8.5 Forms

- All form inputs must have associated `<label>` elements
- Error messages must be descriptive and associated with input
- Success messages must be announced to screen readers
- Example:
  ```html
  <label for="email">Email Address</label>
  <input id="email" type="email" aria-describedby="email-error" />
  <span id="email-error" class="error">Please enter valid email</span>
  ```

### 8.6 Mobile Accessibility

- Zoom must work (no `user-select: none` that prevents selection)
- Text should be resizable (avoid fixed font sizes)
- Avoid small touch targets (<48x48px)
- Provide alternative to gesture-based navigation

---

## 9. Tone & Messaging

### 9.1 Voice Characteristics

| Dimension | Our Voice |
|-----------|-----------|
| **Formality** | Professional but approachable |
| **Confidence** | Assured (not arrogant) |
| **Clarity** | Explicit, never ambiguous |
| **Empathy** | Calm, supportive tone |
| **Speed** | Direct (no filler) |

### 9.2 Word Choices

**Prefer:**
- "Transfer money" instead of "execute fund movement"
- "Verify your identity" instead of "authenticate credentials"
- "Your account is secure" instead of "endpoint encryption enabled"
- "Pending approval" instead of "awaiting authorization"

**Avoid:**
- Jargon (unless necessary, then explain)
- ALL-CAPS (except headlines)
- Exclamation marks (unless really necessary)
- Casual emoji or slang
- Passive voice ("Your transaction was declined" → "We declined your transaction")

### 9.3 Error Messages

**Bad Example:** "Invalid input"  
**Good Example:** "Please enter an email address like example@gmail.com"

**Structure:**
1. **What went wrong:** "Your password is too short"
2. **Why it matters:** "(minimum 12 characters)"
3. **How to fix it:** "Enter at least 12 characters including uppercase, numbers, and symbols"

### 9.4 Success Messages

- Clear confirmation: "✓ Transfer sent successfully"
- Next action hint: "Your $500 transfer to John Doe will arrive Monday"
- Auto-dismiss after 5 seconds or provide explicit close button

---

## 10. Design Specifications by Platform

### 10.1 Website (Public + Authenticated)

**Layout:**
- Top fixed navigation bar (navy #002B5C)
- Hero section (full-width navy + gradient overlay)
- Content sections (alternating white/light-gray backgrounds)
- Footer (dark navy with links)

**Key Elements:**
- Logo (top-left, white on navy)
- Main CTA (gold button, top-right)
- Sign-in button (secondary, top-right)
- Mobile menu icon (hamburger, white)

**Example Header:**
```html
<header class="navbar navbar-dark bg-navy">
  <div class="container">
    <img src="logo.svg" alt="Ross Tax Prep" class="logo" />
    <nav class="nav-links">
      <a href="#products">Products</a>
      <a href="#rates">Rates</a>
      <a href="#support">Support</a>
    </nav>
    <button class="btn-secondary">Sign In</button>
    <button class="btn-primary">Join Now</button>
  </div>
</header>
```

### 10.2 Mobile App (iOS/Android)

**Bottom Tab Navigation:**
1. **Home** — Dashboard, quick stats
2. **Accounts** — Account list, balances
3. **Send Money** — P2P transfers, payments
4. **Cards** — Card management, virtual cards
5. **Menu** — Settings, support, more

**Design Traits:**
- Full-bleed navy backgrounds
- Large touch targets (48px+)
- Bottom sheet modals (not center popups)
- Persistent header with account/profile selector
- No hover states (use tap feedback instead)

### 10.3 Online Portal (Logged-In Web)

**Layout:**
- Sidebar navigation (left, navy background, persistent)
- Main content area (white/light-gray)
- Top header bar (navy, shows user profile + logout)
- Breadcrumbs (below header for navigation context)

**Key Sections:**
1. **Dashboard** — Overview, quick stats, alerts
2. **Accounts** — Account management, transactions
3. **Send Money** — Transfers, P2P, bills
4. **Cards** — Virtual/physical card management
5. **Documents** — Tax returns, statements
6. **Settings** — Profile, security, preferences
7. **Support** — Chat, help center, contact

---

## 11. Design System Components Checklist

### 11.1 Essential Components (Must Have)

- ✅ Buttons (primary, secondary, danger, disabled states)
- ✅ Form inputs (text, email, password, number, textarea)
- ✅ Checkboxes & Radio buttons
- ✅ Select dropdowns
- ✅ Cards (content containers)
- ✅ Alerts (success, error, warning, info)
- ✅ Modals / Dialogs
- ✅ Navigation (top nav, sidebar, breadcrumbs)
- ✅ Tables (data display)
- ✅ Tabs (content organization)
- ✅ Icons (20-component starter set)
- ✅ Badge (status indicators)
- ✅ Loader / Spinner (async states)
- ✅ Tooltip (help text)
- ✅ Avatar (user profile images)

### 11.2 Advanced Components (Nice to Have)

- Date picker
- Time picker
- File upload
- Progress bar
- Step indicator
- Pagination
- Autocomplete search
- Sidebar collapsible

---

## 12. Design Governance

### 12.1 Who Maintains This Guide?

**Design Owner:** Creative/Product team
**Review Frequency:** Quarterly
**Update Process:** Submit change request to Product Lead; review for consistency; update guide + component library

### 12.2 Deviation Requests

**Process:**
1. Designer identifies need for deviation
2. Submit request with business justification
3. Design lead + CISO review (security implications)
4. Approval or counteroffer
5. If approved, update guide to reflect change

**Common Approved Deviations:**
- Temporary promotional banner (max 2 weeks)
- A/B test variant (flagged as experimental)
- Accessible alternative for specific disability

---

## 13. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- ✅ Create color palette CSS variables
- ✅ Define typography scale in CSS
- ✅ Build button component library
- ✅ Create spacing utility classes

### Phase 2: Components (Week 3-4)
- ✅ Form input components
- ✅ Card components
- ✅ Navigation components
- ✅ Alert/banner components

### Phase 3: Pages (Week 5-6)
- ✅ Homepage (hero + sections)
- ✅ Login/signup pages
- ✅ Dashboard layout
- ✅ Account management pages

### Phase 4: Refinement (Week 7+)
- ✅ Responsive testing
- ✅ Accessibility audit (WCAG AA)
- ✅ Browser compatibility testing
- ✅ Performance optimization

---

**[END OF BRAND GUIDELINES]**
