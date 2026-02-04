# Ross Tax Prep & Bookkeeping - Logo & Branding Assets

## Overview

This document provides comprehensive specifications for the Ross Tax Prep & Bookkeeping logo and branding assets, including file requirements, placement guidelines, and implementation details.

---

## Logo Files Required

### 1. Primary Logo (Full Color)
**Filename:** `ross-logo.png`
**Location:** `/frontend/public/images/ross-logo.png`
**Specifications:**
- Format: PNG with transparent background
- Size: 800x800 px (minimum)
- Resolution: 300 DPI
- Color Mode: RGB
- Alpha Channel: Yes

**Design Elements:**
- **Graduation cap** on top (Navy #1B365D)
- **Open book** below cap (Tan/Gold #C4A962 pages, Navy #1B365D binding)
- **"ROSS"** text in large serif font (Navy #1B365D with gold #C4A962 outline)
- **"TAX & BOOKKEEPING"** banner below in ribbon style (Navy background, white text)
- **Tagline:** "Software | Education | Tax Preparation Services" (Gold #C4A962)

**Usage:**
- Website header (homepage, all pages)
- Email signatures
- PDF documents (invoices, certificates)
- Print materials

---

### 2. White/Light Logo (For Dark Backgrounds)
**Filename:** `ross-logo-white.png`
**Location:** `/frontend/public/images/ross-logo-white.png`
**Specifications:**
- Same dimensions as primary logo (800x800 px)
- All navy elements → White (#FFFFFF)
- Gold elements → Light Gold (#F6C445) for contrast
- Transparent background

**Usage:**
- Dark website sections
- Video overlays
- Social media stories (dark themes)
- Presentation slides (dark backgrounds)

---

### 3. Favicon (Browser Icon)
**Filename:** `favicon.ico`
**Location:** `/frontend/public/images/favicon.ico`
**Specifications:**
- Format: ICO (multi-size)
- Sizes included: 16x16, 32x32, 48x48 px
- Color: Navy #1B365D primary, Gold #C4A962 accent
- Simplified design: Graduation cap + "R" monogram

**PNG Alternatives:**
- `favicon-16x16.png` (16x16 px)
- `favicon-32x32.png` (32x32 px)

**HTML Implementation:**
```html
<link rel="icon" type="image/x-icon" href="/images/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">
```

---

### 4. Apple Touch Icon (iOS/macOS)
**Filename:** `apple-touch-icon.png`
**Location:** `/frontend/public/images/apple-touch-icon.png`
**Specifications:**
- Format: PNG
- Size: 180x180 px
- Design: Simplified logo (graduation cap + "R")
- Background: Navy #1B365D (not transparent)
- Corners: Square (iOS auto-rounds them)

**HTML Implementation:**
```html
<link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">
```

---

### 5. Social Sharing Image (Open Graph)
**Filename:** `ross-logo-social.png`
**Location:** `/frontend/public/images/ross-logo-social.png`
**Specifications:**
- Format: PNG or JPG
- Size: 1200x630 px (exact Facebook/LinkedIn requirement)
- Resolution: 72 DPI (web-optimized)
- File size: Under 1 MB

**Design Layout:**
```
┌───────────────────────────────────────────────────┐
│                                                    │
│          [Full Color Logo - 400x400 px]           │
│                                                    │
│     ROSS TAX PREP & BOOKKEEPING                   │
│     Software | Education | Tax Preparation        │
│                                                    │
│     🎓 Professional Certification Programs        │
│     💼 Expert Tax Preparation Services            │
│     📊 Custom Bookkeeping Software                │
│                                                    │
└───────────────────────────────────────────────────┘
   (Navy #1B365D background with gold accents)
```

**HTML Implementation:**
```html
<!-- Open Graph -->
<meta property="og:image" content="https://rosstaxprep.com/images/ross-logo-social.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://rosstaxprep.com/images/ross-logo-social.png">
```

---

## Color Palette

### Primary Colors
```css
:root {
  --navy: #1B365D;       /* Primary brand color */
  --gold: #C4A962;       /* Accent/highlight color */
  --white: #FFFFFF;      /* Text on dark backgrounds */
  --light-gray: #F5F5F5; /* Section backgrounds */
}
```

### Secondary Colors
```css
:root {
  --success: #28A745;  /* Completed, approved */
  --warning: #FFA500;  /* Pending, warnings */
  --error: #DC3545;    /* Rejected, errors */
  --info: #17A2B8;     /* Informational */
}
```

### Usage Guidelines
- **Navy (#1B365D)**: Headers, primary buttons, text on light backgrounds
- **Gold (#C4A962)**: Accents, highlights, hover states, CTAs
- **White (#FFFFFF)**: Text on dark backgrounds, card backgrounds
- **Light Gray (#F5F5F5)**: Alternate section backgrounds

---

## Typography

### Font Families
```css
/* Headers & Logo */
font-family: 'Playfair Display', serif;

/* Body Text & UI */
font-family: 'Open Sans', sans-serif;

/* Code & IDs */
font-family: 'Courier New', monospace;
```

### Font Sizes
```css
h1 { font-size: 2.5rem; font-weight: 700; } /* 40px */
h2 { font-size: 2rem; font-weight: 600; }   /* 32px */
h3 { font-size: 1.5rem; font-weight: 600; } /* 24px */
body { font-size: 1rem; }                    /* 16px */
small { font-size: 0.875rem; }               /* 14px */
```

### Google Fonts Import
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
```

---

## Logo Placement Guidelines

### Homepage Header
**Location:** Top left corner
**Size:** 200px width (auto height)
**HTML:**
```html
<header>
  <a href="/" class="brand">
    <img src="/images/ross-logo.png" alt="Ross Tax Prep & Bookkeeping" width="200">
  </a>
</header>
```

**CSS:**
```css
.brand img {
  width: 200px;
  height: auto;
  transition: transform 0.2s;
}

.brand img:hover {
  transform: scale(1.05);
}
```

---

### Portal Headers (Admin, Instructor, Student)
**Location:** Top left corner
**Size:** 150px width
**HTML:**
```html
<nav class="portal-header">
  <img src="/images/ross-logo.png" alt="Ross Tax Portal" width="150">
  <span class="portal-title">Student Portal</span>
</nav>
```

**CSS:**
```css
.portal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #1B365D;
  border-bottom: 2px solid #C4A962;
}

.portal-header img {
  width: 150px;
  height: auto;
}

.portal-title {
  color: #FFFFFF;
  font-size: 1.5rem;
  font-weight: 600;
}
```

---

### Email Signatures
**Size:** 120px width
**HTML:**
```html
<table style="font-family: Arial, sans-serif; font-size: 14px;">
  <tr>
    <td style="padding-right: 15px;">
      <img src="https://rosstaxprep.com/images/ross-logo.png" 
           alt="Ross Tax Logo" 
           width="120" 
           height="120">
    </td>
    <td>
      <strong style="font-size: 16px; color: #1B365D;">John Doe</strong><br>
      <span style="color: #C4A962;">Tax Preparer</span><br>
      Ross Tax Prep & Bookkeeping<br>
      <a href="mailto:john@rosstaxprep.com" style="color: #1B365D;">john@rosstaxprep.com</a><br>
      <a href="https://rosstaxprep.com" style="color: #C4A962;">rosstaxprep.com</a>
    </td>
  </tr>
</table>
```

---

### PDF Documents (Certificates, Invoices)
**Size:** 100px width (top right corner)
**Usage:**
```python
# ReportLab PDF generation (Python)
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from PIL import Image

def add_logo_to_pdf(c, x=450, y=720, width=100):
    """Add Ross Tax logo to PDF"""
    logo_path = "images/ross-logo.png"
    c.drawImage(logo_path, x, y, width=width, preserveAspectRatio=True)
```

---

## Logo Don'ts (Brand Protection)

❌ **Don't:**
1. **Stretch or distort** the logo (maintain aspect ratio)
2. **Change colors** (only use approved navy/gold palette)
3. **Add effects** (shadows, gradients, outlines beyond design)
4. **Rotate** (keep horizontal orientation)
5. **Place on busy backgrounds** (ensure contrast and readability)
6. **Crop elements** (use full logo with all components)
7. **Recreate or modify** (use official files only)

✅ **Do:**
1. **Maintain clear space** (minimum 20px padding around logo)
2. **Use approved file formats** (PNG for web, SVG for print if available)
3. **Ensure contrast** (use white version on dark backgrounds)
4. **Scale proportionally** (lock aspect ratio when resizing)
5. **Test visibility** (logos should be legible at all sizes)

---

## Implementation Checklist

### Frontend Pages
- [x] Homepage (`/index.html`) - Logo in header, favicon, Open Graph
- [x] Academy page (`/academy.html`) - Logo, favicon, social meta
- [ ] Enrollment form (`/forms/enrollment.html`) - Logo, favicon
- [ ] Contact page (`/forms/contact.html`) - Logo, favicon
- [ ] Client portal login - Logo, favicon
- [ ] Staff portal login - Logo, favicon
- [ ] Instructor portal - Logo in header
- [ ] Student portal - Logo in header

### Email Templates
- [ ] Welcome email (new enrollments) - Logo at top
- [ ] Certificate issuance email - Logo + certificate attachment
- [ ] Grade notification - Logo in header
- [ ] Payment receipt - Logo + invoice
- [ ] Attendance warning - Logo in header

### PDF Documents
- [ ] Certificates (LMS completion) - Logo top right
- [ ] Transcripts (official/unofficial) - Logo + watermark
- [ ] Invoices (payment receipts) - Logo top right
- [ ] Tax returns (cover page) - Logo centered
- [ ] Engagement letters (client agreements) - Logo header

### Marketing Materials
- [ ] Business cards - Logo centered on front
- [ ] Letterhead - Logo top left corner
- [ ] Presentation slides - Logo bottom right (all slides)
- [ ] Social media profile images - Circular crop of logo
- [ ] LinkedIn company page - Social sharing image

---

## File Size Optimization

### Image Compression Tools
- **TinyPNG**: https://tinypng.com (PNG compression)
- **ImageOptim**: https://imageoptim.com (batch optimization)
- **Squoosh**: https://squoosh.app (Google's image optimizer)

### Target File Sizes
- Favicon (ICO): < 50 KB
- Logo (PNG 800x800): < 200 KB
- Social image (1200x630): < 500 KB
- Apple touch icon: < 50 KB

### Optimization Settings
```bash
# Using ImageMagick
convert ross-logo.png -quality 85 -strip ross-logo-optimized.png

# Generate favicons from source
convert ross-logo.png -resize 32x32 favicon-32x32.png
convert ross-logo.png -resize 16x16 favicon-16x16.png
convert favicon-32x32.png favicon-16x16.png favicon.ico
```

---

## CDN & Caching

### Cloudflare R2 Storage (Optional)
If hosting logo assets in R2 instead of directly in frontend:

```toml
# wrangler.toml
[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "ross-tax-assets"
```

**Upload logos to R2:**
```bash
npx wrangler r2 object put ross-tax-assets/images/ross-logo.png --file=frontend/public/images/ross-logo.png
```

**Access via custom domain:**
```
https://assets.rosstaxprep.com/images/ross-logo.png
```

### Cache Headers
```javascript
// In Cloudflare Worker
if (url.pathname.startsWith('/images/')) {
  response.headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year
  response.headers.set('Content-Type', 'image/png');
}
```

---

## Accessibility

### Alt Text Guidelines
```html
<!-- Homepage -->
<img src="/images/ross-logo.png" alt="Ross Tax Prep & Bookkeeping - Professional Tax Services and Education">

<!-- Portal Headers -->
<img src="/images/ross-logo.png" alt="Ross Tax Academy Logo">

<!-- Email Signatures -->
<img src="/images/ross-logo.png" alt="Ross Tax Prep Logo">

<!-- Decorative (if redundant with text) -->
<img src="/images/ross-logo.png" alt="" role="presentation">
```

### ARIA Labels (for icon-only buttons)
```html
<button aria-label="Go to homepage">
  <img src="/images/ross-logo.png" alt="">
</button>
```

---

## Version Control

### Asset Versioning Strategy
When updating logo files, append version number to avoid cache issues:

```html
<!-- Old -->
<img src="/images/ross-logo.png">

<!-- New (after redesign) -->
<img src="/images/ross-logo-v2.png">
<!-- Or with query parameter -->
<img src="/images/ross-logo.png?v=2">
```

### Git LFS for Large Files
If logo source files (PSD, AI) are large:

```bash
# Track large image files with Git LFS
git lfs track "*.psd"
git lfs track "*.ai"
git lfs track "frontend/public/images/*.png"
```

---

## Testing Checklist

### Visual Testing
- [ ] Logo displays correctly on all pages (homepage, academy, portals)
- [ ] Favicon appears in browser tabs
- [ ] Apple touch icon shows on iOS home screen
- [ ] Social sharing image previews correctly on Facebook/LinkedIn/Twitter
- [ ] Logo scales properly on mobile devices (320px - 1920px widths)
- [ ] Logo maintains aspect ratio at all sizes
- [ ] White logo has sufficient contrast on dark backgrounds
- [ ] No pixelation or blur at any scale

### Technical Testing
```bash
# Test Open Graph tags
curl -s "https://rosstaxprep.com" | grep -i "og:image"

# Validate favicon exists
curl -I "https://rosstaxprep.com/images/favicon.ico"

# Check image file sizes
du -h frontend/public/images/ross-logo.png
```

**Online Tools:**
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

---

## Brand Guidelines Summary

### Logo Minimum Size
- **Digital**: 80px width (smallest readable size)
- **Print**: 1 inch width

### Clear Space
- Maintain minimum clear space equal to the height of the graduation cap
- No text, graphics, or other elements within clear space

### Approved Backgrounds
- White or light gray (#F5F5F5)
- Navy (#1B365D) with white logo
- Photographs with sufficient contrast

### Prohibited Uses
- Logo on red or green backgrounds (conflicts with error/success colors)
- Logo as watermark at <30% opacity
- Animated or moving logos (except subtle hover effects)

---

## Contact & Support

**Design Questions**: design@rosstaxprep.com
**Asset Requests**: assets@rosstaxprep.com
**Brand Guidelines**: https://rosstaxprep.com/brand-guidelines

---

**Last Updated:** February 3, 2026  
**Version:** 1.0  
**Next Review:** May 2026 (Quarterly)
