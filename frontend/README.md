# Ross Tax & Bookkeeping - Frontend

Professional React-based website for Ross Tax & Bookkeeping services.

## Features

- Clean, professional design with navy blue and gold branding
- Responsive layout for all devices
- Client intake form
- Service descriptions
- Built with React + Vite + TypeScript

## Development

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173

## Deployment

```bash
# Build and deploy to Cloudflare Pages
npm run deploy
```

## Pretty URLs

The `public/_redirects` file enables clean marketing URLs:
- `/intake` → redirects to intake form section
- No ugly hash symbols or query parameters
- SEO-friendly and shareable

## Custom Domain Setup

See [DOMAIN-SETUP.md](./DOMAIN-SETUP.md) for complete instructions on:
- Configuring custom domains (rosstaxprep.com)
- Setting up subdomains (intake.rosstaxprep.com, portal.rosstaxprep.com)
- DNS configuration
- SSL/TLS setup

## Structure

- `src/App.tsx` - Main application component
- `src/index.css` - Global styles with CSS variables
- `src/main.tsx` - React entry point
- `index.html` - HTML template
- `vite.config.ts` - Vite configuration

## Branding

- Primary: Navy Blue (#0b2340)
- Secondary: Gold (#caa24a)
- Typography: Serif font family

## Integration with Backend API

The backend API is available at the worker endpoints:
- `/api/register/client` - Client registration
- `/api/login/client` - Client login
- `/api/client/refunds` - Refund tracking
- `/api/efile/transmit` - E-file submission
