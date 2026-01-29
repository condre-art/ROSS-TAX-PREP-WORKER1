# Frontend Public Assets

Place your marketing images and logos in this directory. They will be automatically copied to the build output and accessible at root-level URLs.

## Required Images

### Logo
- **rtb-logo.png** - Main RTB logo (navy blue with gold accent)
  - Used in the header navigation
  - Recommended size: 200x60px or similar
  - Format: PNG with transparent background

### Marketing Images (Optional)

#### Launch Announcements
- **launch-banner.png** - CloudBase Pro Web launch graphic
  - Size: 1080x1080px or 1200x630px (for social sharing)
  - Shows the Ross Tax & Bookkeeping golden badge logo

#### Business Cards / Brand Assets
- **business-card.png** - Digital business card design
- **shield-logo.png** - Ross Tax shield/badge logo variant
- **portal-preview.png** - Secure client portal screenshot

## Usage in Code

Images placed here are referenced with a leading slash:

```tsx
<img src="/rtb-logo.png" alt="Ross Tax & Bookkeeping" />
<img src="/launch-banner.png" alt="CloudBase Pro Web Launch" />
```

## Current Structure

```
frontend/public/
├── _redirects          # Cloudflare Pages redirect rules
├── rtb-logo.png        # ← ADD THIS (main logo)
├── launch-banner.png   # ← Optional marketing image
└── README.md           # This file
```

## Notes

- All files in this directory are served at the root URL path
- Use optimized PNG/JPG/WebP formats
- Keep file sizes reasonable (< 500KB per image)
- Use descriptive filenames with hyphens (not spaces)
