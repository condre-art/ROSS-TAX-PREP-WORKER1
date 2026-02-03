# 🎨 DESIGN SYSTEM COLOR & BRANDING REFERENCE

**Quick Reference Guide for Ross Tax Prep & Bookkeeping**

---

## 🔴 PRIMARY COLORS

### Navy Blue (#4078b4)
**Primary Brand Color**
```
Hex:     #4078b4
RGB:     64, 120, 180
HSL:     210°, 47%, 48%
CMYK:    64%, 33%, 0%, 20%

Usage:
✅ Header background
✅ Primary buttons
✅ Main headings (h1, h2)
✅ Link colors
✅ Icon accents
✅ Border emphasis
```

**Color Scale (10 Steps)**:
```
50:   #f0f4f9 (Lightest - Hover backgrounds)
100:  #d9e4f0
200:  #b3c9e1
300:  #8caed2
400:  #6693c3
500:  #4078b4 ⭐ PRIMARY
600:  #2f5a8f (Hover state)
700:  #1f3d6a (Active/pressed)
800:  #0f2145
900:  #051220 (Darkest)
```

### Gold (#f3a006)
**Accent Brand Color**
```
Hex:     #f3a006
RGB:     243, 160, 6
HSL:     37°, 98%, 49%
CMYK:    0%, 34%, 97%, 5%

Usage:
✅ Call-to-action buttons
✅ Accent highlights
✅ Success indicators
✅ Badge accents
✅ Text emphasis
✅ Decorative elements
```

**Color Scale (10 Steps)**:
```
50:   #fef9f0 (Lightest - Light backgrounds)
100:  #fce8ce
200:  #fad69c
300:  #f7c46a
400:  #f5b238
500:  #f3a006 ⭐ PRIMARY
600:  #d18d04 (Hover state)
700:  #ae7a03 (Active/pressed)
800:  #8b6702
900:  #685401 (Darkest)
```

### Grey (#6b7280)
**Secondary Brand Color**
```
Hex:     #6b7280
RGB:     107, 114, 128
HSL:     220°, 9%, 46%
CMYK:    16%, 11%, 0%, 50%

Usage:
✅ Supporting text
✅ Divider lines
✅ Placeholder text
✅ Card borders
✅ Secondary elements
✅ Disabled states
```

**Color Scale (10 Steps)**:
```
50:   #f9fafb (Lightest - Page background)
100:  #f3f4f6
200:  #e5e7eb (Light borders)
300:  #d1d5db (Standard borders)
400:  #9ca3af (Disabled text)
500:  #6b7280 ⭐ PRIMARY (Body text)
600:  #4b5563
700:  #374151
800:  #1f2937 (Dark text)
900:  #111827 (Darkest)
```

### White (#ffffff)
**Background & Light Color**
```
Hex:     #ffffff
RGB:     255, 255, 255
HSL:     0°, 0%, 100%
CMYK:    0%, 0%, 0%, 0%

Usage:
✅ Card backgrounds
✅ Section backgrounds
✅ Button text
✅ Form backgrounds
✅ Page background
```

---

## 🎯 STATUS COLORS

### Success Green (#10b981)
```
Hex:     #10b981
RGB:     16, 185, 129
Usage:   Successful operations, checkmarks, confirmations
```

### Warning Orange (#f59e0b)
```
Hex:     #f59e0b
RGB:     245, 158, 11
Usage:   Warnings, pending operations, alerts
```

### Error Red (#ef4444)
```
Hex:     #ef4444
RGB:     239, 68, 68
Usage:   Errors, failures, critical alerts
```

### Info Blue (#3b82f6)
```
Hex:     #3b82f6
RGB:     59, 130, 246
Usage:   Information, notifications, alerts
```

---

## 🔤 TYPOGRAPHY SYSTEM

### Font Families

**Segoe UI, Roboto, Helvetica Neue, sans-serif** (Primary)
- Best for: Body text, UI elements, headings
- Available weights: 300, 400, 500, 600, 700, 800
- Line heights: 1.2 to 2.0

**Georgia** (Serif)
- Best for: Quotes, emphasis, highlights
- Usage: Occasional accent text

**Courier New** (Monospace)
- Best for: Code blocks, technical content
- Usage: Developer documentation, API examples

### Font Sizes

```
4xl:  36px  → Page main heading (h1)
3xl:  30px  → Page subheading (h2)
2xl:  24px  → Section headings (h3)
xl:   20px  → Subheadings (h4)
lg:   18px  → Paragraph emphasis
base: 16px  → Body text
sm:   14px  → Form labels, captions
xs:   12px  → Small labels, timestamps
```

### Font Weights

```
Extrabold: 800  → Page headings
Bold:      700  → Section headings
Semibold:  600  → Emphasis text
Medium:    500  → Labels, buttons
Normal:    400  → Body text, default
Light:     300  → Subtle text
```

### Line Heights

```
Loose:   2.0   → List items, spacing
Relaxed: 1.75  → Longer paragraphs
Normal:  1.5   → Standard body text
Tight:   1.2   → Headings, compact
```

---

## 📏 SPACING SYSTEM (8px Base)

```
xs:   4px   (½ base)
sm:   8px   (1 base)
md:   16px  (2 base)
lg:   24px  (3 base)
xl:   32px  (4 base)
2xl:  48px  (6 base)
3xl:  64px  (8 base)
```

**Applied To**:
- Padding (internal spacing)
- Margin (external spacing)
- Gaps between items
- Gutters in layouts

---

## 🔘 COMPONENT SPECIFICATIONS

### Buttons

#### Primary Button
```css
Background:     #4078b4 (Navy)
Text Color:     #ffffff (White)
Text Weight:    600 (Semibold)
Font Size:      16px (base)
Padding:        8px 24px
Border Radius:  8px (lg)
Min Height:     44px (touch target)
Cursor:         pointer

Hover:
  Background:   #2f5a8f (Navy 600)
  Transform:    scale(1.02)

Active/Pressed:
  Background:   #1f3d6a (Navy 700)
  Transform:    scale(0.98)

Disabled:
  Background:   #d1d5db (Grey 300)
  Cursor:       not-allowed
  Opacity:      0.6
```

#### Secondary (Accent) Button
```css
Background:     #f3a006 (Gold)
Text Color:     #002147 (Navy dark)
Text Weight:    600 (Semibold)
Font Size:      16px (base)
Padding:        8px 24px
Border Radius:  8px (lg)
Min Height:     44px (touch target)

Hover:
  Background:   #d18d04 (Gold 600)

Active/Pressed:
  Background:   #ae7a03 (Gold 700)
```

#### Outline Button
```css
Background:     transparent
Border:         2px solid #4078b4 (Navy)
Text Color:     #4078b4 (Navy)
Text Weight:    600
Font Size:      16px

Hover:
  Background:   #f0f4f9 (Navy 50)
  Border Color: #2f5a8f (Navy 600)

Active:
  Background:   #d9e4f0 (Navy 100)
```

### Cards

```css
Background:     #ffffff (White)
Border:         1px solid #e5e7eb (Grey 200)
Border Radius:  8px (lg)
Shadow:         0 4px 6px -1px rgba(0, 0, 0, 0.1)
Padding:        16px to 24px

Hover:
  Shadow:       0 10px 15px -3px rgba(0, 0, 0, 0.1)
  Transform:    translateY(-2px)
```

### Form Inputs

```css
Background:     #ffffff (White)
Border:         1px solid #e5e7eb (Grey 200)
Border Radius:  4px (md)
Padding:        8px 12px
Font Size:      16px
Color:          #111827 (Grey 900)
Placeholder:    #9ca3af (Grey 400)

Focus:
  Border Color: #4078b4 (Navy 500)
  Outline:      2px solid #f0f4f9 (Navy 50)
  Box Shadow:   0 0 0 3px rgba(64, 120, 180, 0.1)

Disabled:
  Background:   #f3f4f6 (Grey 100)
  Color:        #9ca3af (Grey 400)
```

### Badges

```css
Padding:        4px 12px
Border Radius:  9999px (full)
Font Size:      12px (xs) or 14px (sm)
Font Weight:    500 (medium)
Display:        inline-flex
Align Items:    center
Gap:            4px
White Space:    nowrap
```

**Color Variations**:
```
Success:  Background: #d1fae5 (Green light), Text: #065f46 (Green dark)
Warning:  Background: #fef3c7 (Orange light), Text: #92400e (Orange dark)
Error:    Background: #fee2e2 (Red light), Text: #991b1b (Red dark)
Info:     Background: #dbeafe (Blue light), Text: #1e3a8a (Blue dark)
```

---

## 🎯 RESPONSIVE BREAKPOINTS

```
xs:  320px   (Mobile phones - portrait)
sm:  640px   (Mobile phones - landscape, small tablets)
md:  768px   (Tablets)
lg:  1024px  (Small laptops)
xl:  1280px  (Desktop computers)
2xl: 1536px  (Large monitors)
```

**Media Query Examples**:
```css
/* Mobile first */
.element { width: 100%; }

/* Tablet and up */
@media (min-width: 768px) {
  .element { width: 50%; }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .element { width: 33.333%; }
}
```

---

## 🌲 VISUAL HIERARCHY

### Color Hierarchy
```
1. Navy (#4078b4)      → Most important, primary actions
2. Gold (#f3a006)      → Call-to-action, emphasis
3. Grey (#6b7280)      → Supporting, secondary
4. White (#ffffff)     → Background, contrast
5. Status Colors       → Specific conditions (success, error)
```

### Size Hierarchy
```
1. 36px (4xl) → Page main heading (h1)
2. 30px (3xl) → Page subheading (h2)
3. 24px (2xl) → Section headings (h3)
4. 20px (xl)  → Subheadings (h4)
5. 16px (base)→ Body text, default
6. 14px (sm)  → Labels, secondary
7. 12px (xs)  → Captions, timestamps
```

### Weight Hierarchy
```
1. 700-800 (Bold/Extrabold)  → Headings, emphasis
2. 600 (Semibold)             → Buttons, labels
3. 500 (Medium)               → Subheadings
4. 400 (Normal)               → Body text
5. 300 (Light)                → Subtle, secondary
```

---

## ✨ SHADOWS & ELEVATION

### Shadow Levels
```
sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05)
     Used for: Subtle borders, slight lift

md:  0 4px 6px -1px rgba(0, 0, 0, 0.1)
     Used for: Cards, dropdowns, standard elements

lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1)
     Used for: Modals, important cards

xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1)
     Used for: Floating elements, focus emphasis

2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
     Used for: Overlays, maximum elevation
```

---

## 🎨 USAGE EXAMPLES

### Hero Section
```
Background:  Navy (#4078b4)
Heading:     White (#ffffff), 36px, bold
Subheading:  White (#ffffff), 18px
Button CTA:  Gold (#f3a006) background
Text:        White (#ffffff)
```

### Navigation Bar
```
Background:  Navy (#4078b4)
Links:       White (#ffffff)
Hover:       Gold (#f3a006) text
Active:      Gold (#f3a006) underline
```

### Card Section
```
Background:  White (#ffffff)
Border:      Grey (#e5e7eb)
Title:       Navy (#4078b4), 24px, bold
Text:        Grey (#6b7280), 16px
Button:      Navy (#4078b4) background
```

### Form
```
Labels:      Navy (#4078b4), 14px, semibold
Inputs:      White (#ffffff) background
Borders:     Grey (#e5e7eb)
Focus:       Navy (#4078b4) border + shadow
Helper:      Grey (#6b7280), 12px
Error:       Red (#ef4444)
Success:     Green (#10b981)
```

### Footer
```
Background:  Navy (#051220)
Text:        White (#ffffff)
Links:       Gold (#f3a006)
Border:      Grey (#1f2937)
```

---

## 📋 QUICK COPY-PASTE COLORS

### CSS Variables
```css
:root {
  --color-navy-primary: #4078b4;
  --color-gold-primary: #f3a006;
  --color-grey-primary: #6b7280;
  --color-white: #ffffff;
  
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  --font-sans: 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
  --font-serif: 'Georgia', serif;
  --font-mono: 'Courier New', monospace;
  
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

### Tailwind Config
```js
module.exports = {
  theme: {
    colors: {
      navy: '#4078b4',
      gold: '#f3a006',
      grey: '#6b7280',
      white: '#ffffff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    fontFamily: {
      sans: ["'Segoe UI'", "'Roboto'", "sans-serif"],
      serif: ["'Georgia'", "serif"],
      mono: ["'Courier New'", "monospace"],
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
    },
  },
}
```

---

## ✅ BRAND COMPLIANCE CHECKLIST

- [x] Colors match approved palette
- [x] Typography follows system
- [x] Spacing consistent (8px base)
- [x] Components properly styled
- [x] Responsive breakpoints used
- [x] Color contrast verified (WCAG AA)
- [x] Touch targets ≥ 44px
- [x] No unauthorized colors used
- [x] Font weights used correctly
- [x] Shadows applied appropriately

---

## 🚀 IMPLEMENTATION STATUS

**Design System**: ✅ COMPLETE & LIVE
**Color Palette**: ✅ VERIFIED
**Typography**: ✅ IMPLEMENTED
**Spacing**: ✅ APPLIED
**Components**: ✅ STYLED
**Responsive**: ✅ TESTED
**Accessibility**: ✅ COMPLIANT
**Performance**: ✅ OPTIMIZED

**Status**: 🎉 **READY FOR PRODUCTION**

---

*Design System Color & Branding Reference*  
*Version 1.0 - February 3, 2026*  
*Ross Tax Prep & Bookkeeping*
