# Marketing Images Setup Guide

## 📸 Images to Add

Based on your marketing materials, place these images in `frontend/public/`:

### 1. **rtb-logo.png** (REQUIRED)
- **Source**: Use the "RTB" logo with navy blue letters and gold underline
- **Recommended**: The clean version from your business card design
- **Size**: ~200x60px (or maintain aspect ratio)
- **Background**: Transparent PNG

### 2. **launch-banner.png** (Optional)
- **Source**: The CloudBase Pro Web launch announcement graphic
- **Shows**: Golden Ross Tax badge, date "1.30.26 • 12:00 AM", "Join the waitlist" CTA
- **Size**: 1080x1080px (square format)
- **Use**: Featured in the "Secure Client Portal" section

### 3. **shield-logo.png** (Optional)
- **Source**: The Ross Tax shield/badge logo variant with checkmark
- **Shows**: "ROSS TAX AND BOOKKEEPING" with PTIN
- **Use**: Can be used as alternative logo or in footer

### 4. **portal-preview.png** (Optional)
- **Source**: The client portal interface mockup showing devices
- **Shows**: Laptop, tablet, phone with CloudBase interface
- **Size**: ~800x600px landscape
- **Use**: Can replace launch-banner in portal section

## 📁 File Placement

```
frontend/public/
├── _redirects
├── rtb-logo.png          ← Add this first
├── launch-banner.png     ← Optional marketing image
├── shield-logo.png       ← Optional alternate logo
└── README.md
```

## 🎨 Where Images Appear

### Current Implementation:

1. **Header Logo** (`rtb-logo.png`)
   - Location: Top navigation bar
   - Fallback: Shows alt text if missing
   - Path: `/rtb-logo.png`

2. **Portal Section** (`launch-banner.png`)
   - Location: "Secure Client Portal" section (before footer)
   - Features: CloudBase Pro Web announcement
   - Fallback: Hides gracefully if missing
   - Path: `/launch-banner.png`

## 🚀 How to Add Images

### Method 1: Manual Copy (Recommended)
1. Save images from your design files as PNG/JPG
2. Copy to: `C:\Users\condr\OneDrive\Documents\GitHub\ROSS-TAX-PREP-WORKER1\frontend\public\`
3. Use exact filenames: `rtb-logo.png`, `launch-banner.png`, etc.
4. Rebuild: `cd frontend && npm run build`

### Method 2: Export from Design Tools
- From Canva/Photoshop: Export as PNG (transparent background for logo)
- Optimize: Use TinyPNG or similar to reduce file size
- Rename: Use lowercase with hyphens (e.g., `rtb-logo.png`)

## ✅ Testing

After adding images:

```bash
# Build the frontend
cd frontend
npm run build

# Check the dist folder
ls dist/
# rtb-logo.png and other images should be copied here

# Optional: Preview locally
npm run dev
# Visit http://localhost:5173
```

## 🎯 Quick Wins

**Priority Order:**
1. ✅ **rtb-logo.png** - Makes header look professional
2. ⚡ **launch-banner.png** - Showcases CloudBase portal
3. 📋 **portal-preview.png** - Alternative to launch banner
4. 🛡️ **shield-logo.png** - Brand consistency

## 📝 Notes

- All images in `public/` are automatically copied to build output
- Images use absolute paths (start with `/`)
- Fallbacks are built-in (won't break if image missing)
- Optimal image formats: PNG for logos, JPG for photos
- Keep file sizes under 500KB for fast loading

## 🔥 Your Brand Colors

Already configured in CSS:
- **Navy**: `#0b2340` (primary brand color)
- **Gold**: `#caa24a` (accent color)
- **White**: `#ffffff` (backgrounds)

These match your business card and logo designs perfectly!
