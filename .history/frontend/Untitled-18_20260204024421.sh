# 1. Set encryption key (generate with: openssl rand -base64 32)
wrangler secret put ENCRYPTION_KEY

# 2. Set JWT secret
wrangler secret put JWT_SECRET

# 3. Create D1 database
wrangler d1 create ross_tax_db

# 4. Run migrations
wrangler d1 execute DB --file=schema.sql --local

# 5. Deploy
npm run deploy