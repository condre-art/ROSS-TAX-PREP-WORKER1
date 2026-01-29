-- D1 Schema: intakes table (with encryption support)
CREATE TABLE IF NOT EXISTS intakes (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,        -- Encrypted PII
  email TEXT NOT NULL,            -- Encrypted PII
  phone TEXT,                     -- Encrypted PII
  service TEXT,
  notes TEXT,                     -- Encrypted PII
  ip TEXT,
  created_at TEXT NOT NULL
);

-- D1 Schema: certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issued_to TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  credentials_json TEXT,
  signature TEXT NOT NULL
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_intakes_created_at ON intakes(created_at);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(type);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
