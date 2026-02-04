# Mobile App Design Specifications
**Ross Tax Prep & Money Management Platform — iOS & Android Native Apps**

---

## 1. App Architecture & Navigation

### 1.1 Information Architecture

**Tab-Based Navigation (Bottom Tabs):**

| Tab | Icon | Label | Purpose |
|-----|------|-------|---------|
| 1 | 🏠 | Home | Dashboard overview, quick stats |
| 2 | 💰 | Accounts | Account list, balances, transactions |
| 3 | 📤 | Send | P2P transfers, bill pay, requests |
| 4 | 💳 | Cards | Card management, virtual cards |
| 5 | ⚙️ | Menu | Settings, support, logout |

**Alternative Stack-Based Navigation:**
- Primary: Tab bar (bottom, always visible)
- Secondary: Stack navigation (push/pop for details)
- Tertiary: Modal sheets (non-critical info)

### 1.2 Navigation Flows

**Flow 1: Home → Account Details → Transaction Details**
```
[Tab: Home]
   ↓ tap account card
[Account Details Screen]
   ↓ tap transaction
[Transaction Details]
   ↓ back gesture or back button
[Account Details]
   ↓ back
[Home]
```

**Flow 2: Send Money → Select Account → Enter Amount → Review → Complete**
```
[Tab: Send]
   ↓ tap "Send Money"
[Recipient Selection]
   ↓ select recipient
[Account Selection]
   ↓ select from account
[Amount & Description]
   ↓ enter details
[Review & Confirm]
   ↓ tap "Send"
[Success Screen]
   ↓ back to Home
```

---

## 2. Screen Specifications

### 2.1 Home / Dashboard Screen

**Layout:**
```
┌─────────────────────────────────┐
│  [Profile Icon]  [Time 9:41]    │  Status Bar
├─────────────────────────────────┤
│ Hi, John! 👋                    │
│ Monday, Feb 3                   │ Greeting
├─────────────────────────────────┤
│ Your Balance                    │
│ $12,456.89                      │ Primary stat
│                                 │
│ 3 Accounts  •  2 Cards          │ Secondary stats
├─────────────────────────────────┤
│ Quick Actions (4-button row)    │
│ ┌──────┐  ┌──────┐  ┌──────┐  │
│ │ Send │  │ Pay  │  │Deposit│  │
│ │Money │  │ Bills│  │ Check │  │
│ └──────┘  └──────┘  └──────┘  │
│     ┌──────┐                     │
│     │Manage│                     │
│     │Cards │                     │
│     └──────┘                     │
├─────────────────────────────────┤
│ Recent Transactions             │ Section header
│                                 │
│ [Txn 1]                         │
│ → Target   -$45.00              │
│ Just now                        │
│                                 │
│ [Txn 2]                         │
│ → Deposit   +$500.00            │
│ 2 days ago                      │
│                                 │
│ [View All Transactions]         │ Tappable link
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │ Tab bar
└─────────────────────────────────┘
```

**Design Details:**
- Status bar: Navy background, white text
- Greeting: Large text (22px), navy, friendly
- Balance: Huge text (44px), navy, bold
- Quick actions: 4 gold buttons, grid layout
- Transactions: Light gray background card per transaction
- Tab bar: Navy background, white icons, selected tab has gold underline

**Interactions:**
- Pull-to-refresh: Updates balance and transactions
- Swipe left on transaction: Delete/archive option
- Tap quick action: Navigate to corresponding screen
- Tap transaction: Show full details in modal

### 2.2 Accounts Screen

**Layout:**
```
┌─────────────────────────────────┐
│ Accounts        [+ Add Account] │  Header
├─────────────────────────────────┤
│ Account Type Filter:            │
│ [All] [Checking] [Savings] [MM] │ Segmented control
├─────────────────────────────────┤
│ PRIMARY ACCOUNT                 │ Section header
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Checking Account            │ │
│ │ Primary Checking            │ │
│ │                             │ │
│ │ Balance: $5,234.56          │ │ Account card
│ │ Available: $5,200.00        │ │
│ │ Account #: XXXXXX5678       │ │
│ │                             │ │
│ │ [Transfer] [Details]        │ │
│ └─────────────────────────────┘ │
│                                 │
│ OTHER ACCOUNTS                  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Savings Account             │ │
│ │ Emergency Fund              │ │
│ │ Balance: $12,000.00         │ │
│ │ [Transfer] [Details]        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Money Market                │ │
│ │ Investments                 │ │
│ │ Balance: $45,678.90         │ │
│ │ [Transfer] [Details]        │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │
└─────────────────────────────────┘
```

**Card Design:**
- White background, 1px border (light gray)
- 16px padding
- Subtle shadow on iOS (elevation on Android)
- Blue highlight on tap (ripple effect on Android)

**Detail Actions:**
- **[Transfer]** → Transfer between own accounts
- **[Details]** → View account statement, settings

### 2.3 Account Details Screen

**Layout:**
```
┌─────────────────────────────────┐
│ [< Back]  Checking Account      │ Header
├─────────────────────────────────┤
│ Balance: $5,234.56              │
│ Available: $5,200.00            │
│ ┌─────────────────────────────┐ │
│ │ Account Details             │ │ Details card
│ │ Number: XXXXXX5678          │ │
│ │ Routing: 121000248          │ │
│ │ Type: Checking              │ │
│ │ Status: Active              │ │
│ └─────────────────────────────┘ │
│                                 │
│ Quick Actions:                  │
│ [Transfer Out] [Get Details]    │
├─────────────────────────────────┤
│ Transaction History             │ Sticky section header
│ Filter: [All ▼] [Date Range]    │ with controls
│                                 │
│ [Date filter picker]            │ Collapsible
│                                 │
│ TODAY                           │
│ [Txn] Description  Amount       │
│ ┌─────────────────────────────┐ │
│ │ → Amazon       -$25.00      │ │ Transaction row
│ │ Pending                     │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Txn] Deposit      +$500.00     │
│ 2 days ago                      │
│                                 │
│ [Export] [Print]               │ Action buttons
│                                 │
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │
└─────────────────────────────────┘
```

**Sticky Header:** Transaction filter stays visible when scrolling

### 2.4 Send Money Screen

**Tab Navigation:**
```
[Send Money] | [Pay Bills] | [Request Money]
```

**Send Money Tab:**
```
┌─────────────────────────────────┐
│ Send Money                      │ Title
├─────────────────────────────────┤
│ Who are you sending to?         │ Section header
│ [Search or pick contact]        │
│ ┌─────────────────────────────┐ │
│ │ Search by name, email,      │ │ Search input
│ │ or phone                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ Suggested Recipients:           │ Section
│ ┌──────┬──────┬──────┬──────┐  │
│ │ John │ Jane │ Mom  │ Boss │  │ Recipient chips
│ └──────┴──────┴──────┴──────┘  │
│                                 │
├─────────────────────────────────┤
│ [Next] (gold button, enabled)   │ Primary CTA
│                                 │
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │
└─────────────────────────────────┘
```

**Flow Screen 2: Amount**
```
┌─────────────────────────────────┐
│ [< Back] Send to John Doe       │
├─────────────────────────────────┤
│ From: Checking Account          │
│ Balance: $5,234.56              │
│                                 │
│ Amount: $__________             │ Large input
│         (tap to enter)          │
│                                 │
│ ┌──────────────────────────────┐│
│ │ Quick Amounts:               ││
│ │ [$50] [$100] [$200] [$500]   ││
│ └──────────────────────────────┘│
│                                 │
│ Description: ________________   │
│ (optional)                      │
│                                 │
│ Speed:                          │
│ (●) Instant    $0               │ Radio buttons
│ ( ) Standard   $0 (1-3 days)    │
│ ( ) Scheduled  [Pick date]      │
│                                 │
│ [Review] (gold button)          │
│                                 │
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │
└─────────────────────────────────┘
```

**Flow Screen 3: Review**
```
┌─────────────────────────────────┐
│ Confirm Transfer                │
├─────────────────────────────────┤
│ From:                           │
│ Checking Account                │
│ $5,234.56 available             │
│                                 │
│ To:                             │
│ John Doe (john@example.com)     │
│                                 │
│ Amount: $150.00                 │
│ Speed: Instant (Free)           │
│ Description: For dinner         │
│                                 │
│ Total: $150.00                  │
│                                 │
│ [Confirm] [Edit]                │
│                                 │
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │
└─────────────────────────────────┘
```

**Flow Screen 4: Success**
```
┌─────────────────────────────────┐
│        ✓ Success!               │ Large checkmark
│                                 │
│ Transfer sent to John Doe       │
│ $150.00 • Instant               │
│                                 │
│ Reference #: TXN-1234567890     │
│                                 │
│ Your new balance:               │
│ $5,084.56                       │
│                                 │
│ [Share] [Save Receipt]          │
│ [Done]                          │
│                                 │
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │
└─────────────────────────────────┘
```

### 2.5 Cards Screen

**Layout:**
```
┌─────────────────────────────────┐
│ Cards                [+ New]    │
├─────────────────────────────────┤
│ Card Type Filter:               │
│ [All] [Virtual] [Physical]      │
├─────────────────────────────────┤
│ ACTIVE CARDS                    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │        VISA                 │ │ Card image (skeuomorphic)
│ │                             │ │
│ │    •••• 1234                │ │
│ │                             │ │
│ │ Exp: 12/27                  │ │
│ │                             │ │
│ │ Primary Card  [Status: Active]
│ │ Limit: $5,000/day           │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │        VISA                 │ │
│ │      VIRTUAL                │ │ Virtual card badge
│ │      •••• 9999              │ │
│ │ Exp: 03/26                  │ │
│ │ Travel Card (Frozen)        │ │
│ │ Limit: $1,000/day           │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Issue New Card]                │
│                                 │
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │
└─────────────────────────────────┘
```

**Card Design:**
- Skeuomorphic card design (looks like real card)
- Gradient background (navy to lighter blue)
- Chip icon (payment network icon)
- Cardholder name (encrypted display)
- Card number (last 4 visible)
- Expiration date
- Status badge (Active, Frozen, Expired)

**Tap Card → Card Details:**
```
┌─────────────────────────────────┐
│ [< Back]                        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │        VISA                 │ │
│ │    •••• 1234                │ │
│ │ Exp: 12/27                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Card Details                    │
│ Name: Primary Card              │
│ Type: Physical Debit            │
│ Status: Active                  │
│ Network: Visa                   │
│ Issued: Jan 15, 2024            │
│ Expires: Dec 31, 2027           │
│                                 │
│ Daily Spending Limit: $5,000    │
│ Transaction Limit: $2,500       │
│ ATM Limit: $300                 │
│                                 │
│ Controls:                       │
│ ☑️ Online Shopping              │
│ ☑️ International                │
│ ☑️ Contactless                  │
│ ☐ ATM Withdrawals (off)         │
│                                 │
│ ⚡ Recent Transactions:         │
│ [Txn list]                      │
│                                 │
│ [Freeze Card] [Set Limits]      │
│ [Order New] [Cancel]            │
│                                 │
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │
└─────────────────────────────────┘
```

### 2.6 Settings / Menu Screen

**Layout:**
```
┌─────────────────────────────────┐
│ Menu                            │
├─────────────────────────────────┤
│ Account                         │ Section
│ ┌─────────────────────────────┐ │
│ │ [Profile Icon]              │ │ User card
│ │ John Doe                    │ │
│ │ john@example.com            │ │
│ │ [Edit Profile]              │ │
│ └─────────────────────────────┘ │
│                                 │
│ Security & Access               │
│ [Password & PIN]                │
│ [Biometric Enrollment]          │
│ [Devices]                       │
│ [Login History]                 │
│                                 │
│ Preferences                     │
│ [Notifications]                 │
│ [Language]                      │
│ [Theme] (Dark / Light)          │
│                                 │
│ Help & Support                  │
│ [Help Center]                   │
│ [Contact Us]                    │
│ [Report Problem]                │
│                                 │
│ Legal                           │
│ [Terms of Service]              │
│ [Privacy Policy]                │
│ [Cardholder Agreement]          │
│                                 │
│ [Logout]                        │
│                                 │
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │
└─────────────────────────────────┘
```

**Sub-Screen: Settings → Security → Biometric**
```
┌─────────────────────────────────┐
│ [< Back] Biometric Security     │
├─────────────────────────────────┤
│ Face Recognition                │ Section
│ Status: Enrolled                │
│                                 │
│ Use Face ID for:                │
│ ☑️ App Login                    │
│ ☑️ Transaction Confirmation     │
│ ☑️ Settings Access              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [Re-enroll Face]            │ │ Action button
│ │ [Delete & Disable]          │ │
│ └─────────────────────────────┘ │
│                                 │
│ Privacy                         │
│ Your face data is encrypted     │
│ and stored securely on device.  │
│                                 │
│ [Learn More] [Privacy Policy]   │
│                                 │
├─────────────────────────────────┤
│ 🏠 Home │💰│📤│💳│⚙️            │
└─────────────────────────────────┘
```

---

## 3. iOS-Specific Design

### 3.1 Safe Area Handling

**Status Bar + Notch:**
- Content padding top: 44pt (standard) or 47pt (notch devices)
- Home Indicator area: Minimum 34pt padding bottom

**Implementation:**
```swift
VStack {
    // Content starts here (respects safe area)
    content
}
.ignoresSafeArea(.container, edges: .vertical)
.safeAreaInset(edge: .bottom) {
    // Tab bar goes here
    TabBar()
}
```

### 3.2 iOS-Specific Gestures

**Swipe Back:** Standard iOS back gesture (swipe from left edge)
```swift
.navigationBarBackButtonHidden(false)
// Standard iOS nav back button on left
```

**Pull to Refresh:**
```swift
.refreshable {
    await viewModel.refresh()
}
```

**Swipe on Cells:** Delete/Archive action
```swift
.swipeActions(edge: .trailing) {
    Button(role: .destructive) {
        // Delete action
    } label: {
        Label("Delete", systemImage: "trash")
    }
}
```

### 3.3 iOS Status Bar Styling

```swift
.preferredColorScheme(.light) // Light status bar on navy
.statusBar(hidden: false)
```

---

## 4. Android-Specific Design

### 4.1 System Navigation

**Gesture Navigation (Android 10+):**
- Back: Swipe from edge (any edge)
- Home: Swipe up from bottom
- Recents: Swipe up and hold
- No bottom nav buttons needed

**Implementation:**
```kotlin
// Use predictive back animation
window.decorView.windowInsetsController?.let {
    it.hide(WindowInsets.Type.navigationBars())
}
```

### 4.2 Material Design 3

**Design Language:**
- Ripple effect on tap
- Elevation for depth (Material Design)
- Colorful status bar (not white)

**Status Bar:**
```kotlin
window.statusBarColor = ContextCompat.getColor(
    this,
    R.color.navy_primary
)
window.insetsController?.setAppearance(
    APPEARANCE_LIGHT_NAVIGATION_BARS // White icons
)
```

### 4.3 Android-Specific Features

**Biometric Authentication:**
```kotlin
val biometricPrompt = BiometricPrompt(
    this,
    executor,
    callback
)
val promptInfo = BiometricPrompt.PromptInfo.Builder()
    .setTitle("Verify your identity")
    .setSubtitle("Use your face or fingerprint")
    .setNegativeButtonText("Cancel")
    .build()
biometricPrompt.authenticate(promptInfo)
```

**Notification Integration:**
- Transaction alerts
- Security notifications
- Account updates

---

## 5. Design System Components

### 5.1 Custom Components

**Account Balance Card**
- Displays balance prominently
- Tap to show/hide full amount
- Swipe to next account (carousel)

**Transaction Row**
- Icon (merchant category)
- Merchant name
- Transaction date
- Amount (in account color)
- Status indicator
- Swipe actions on iOS

**Quick Action Button**
- Icon (24px)
- Label (below icon)
- Gold background
- Rounded corners
- Tap feedback (ripple on Android, highlight on iOS)

**Secure Input Field**
- Biometric entry option
- Password strength indicator
- Reveal/hide toggle
- Error state with icon

---

## 6. Accessibility

### 6.1 VoiceOver (iOS) / TalkBack (Android)

**Focus Order:**
- Natural reading order (top to bottom, left to right)
- Skip buttons for quick navigation
- Headings properly labeled

**Labels:**
```swift
Image(systemName: "lock.fill")
    .accessibilityLabel("Secure")
    .accessibilityHint("Your data is encrypted")
```

**Buttons:**
```swift
Button("Send Money") {
    // Action
}
.accessibilityHint("Double tap to send money to a contact")
```

### 6.2 Color Contrast

**Minimum 4.5:1 for text on backgrounds:**
- Navy (#002B5C) + white: 7.8:1 ✅
- Gold (#FFD700) + navy: 5.2:1 ✅
- Status colors always have text overlay or icon

### 6.3 Large Text Support

**Font Scaling:**
- Dynamic Type on iOS (respects user size settings)
- Scalable SP on Android
- Minimum 14pt body text
- No hard-coded text sizes

```swift
.font(.body)  // Uses system Dynamic Type
.lineLimit(nil)  // Allow wrapping
```

---

## 7. Performance & Optimization

### 7.1 Memory Management

- Lazy load transaction lists
- Image caching (SDWebImage / Coil)
- Pagination (50 transactions per load)
- Release resources on background

### 7.2 Battery Optimization

- Reduce animation frame rate
- Disable location tracking when app backgrounded
- Use efficient image formats (WebP with PNG fallback)
- Minimize network requests

### 7.3 Network Optimization

- API call debouncing (e.g., search with 300ms delay)
- Batch requests where possible
- Offline support (cache last known data)
- Graceful error handling with retry

---

## 8. Testing Checklist

### 8.1 Functional Testing
- [ ] All navigation flows work
- [ ] Forms validate correctly
- [ ] Biometric enrollment/verification works
- [ ] Transactions process correctly
- [ ] Card management works
- [ ] Settings persist across app launch

### 8.2 Accessibility Testing
- [ ] VoiceOver/TalkBack fully functional
- [ ] All colors meet 4.5:1 contrast
- [ ] Touch targets ≥48x48pt
- [ ] Tab order is logical
- [ ] Dynamic Type works at large sizes

### 8.3 Device Testing
- **iOS:** iPhone SE (small), iPhone 14 Pro (large), iPad
- **Android:** 5-inch, 6-inch, 6.5-inch devices
- **OS Versions:** Oldest 2-3 supported versions

### 8.4 Performance Testing
- [ ] App launches <3 seconds
- [ ] Scrolling smooth (60fps)
- [ ] Images load without janking
- [ ] Network requests don't block UI

---

## 9. Security Implementation

### 9.1 Biometric Authentication

**iOS:**
```swift
let context = LAContext()
var error: NSError?

guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
    // Fallback to PIN
}

context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
    localizedReason: "Verify your identity") { success, _ in
    if success {
        // Grant access
    }
}
```

**Android:**
```kotlin
val executor = ContextCompat.getMainExecutor(this)
val callback = object : BiometricPrompt.AuthenticationCallback() {
    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
        // Grant access
    }
}
val biometricPrompt = BiometricPrompt(this, executor, callback)
biometricPrompt.authenticate(promptInfo)
```

### 9.2 Data Encryption

- All sensitive data encrypted at rest
- TLS 1.3 for all network communication
- Secure storage: Keychain (iOS), KeyStore (Android)

### 9.3 Jailbreak / Root Detection

- Detect and warn on jailbroken/rooted devices
- Restrict sensitive features on compromised devices
- Log attempts for security review

---

## 10. Release Notes Template

**Version 2.0.0 — New Money Management Features**
```
✨ New Features
• Send money to contacts (P2P transfers)
• Issue virtual Visa cards instantly
• Mobile check deposits
• Biometric 2FA with facial recognition

🐛 Bug Fixes
• Fixed transaction sorting
• Improved app performance
• Enhanced security

🔧 Improvements
• Redesigned send money flow
• Better error messages
• Faster load times
```

---

**[END OF MOBILE APP SPECIFICATIONS]**
