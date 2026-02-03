-- ============================================================================
-- BANK PRODUCTS SCHEMA
-- Santa Barbara TPG (Tax Products Group) Integration
-- Tax Year 2025 Filing Season
-- ============================================================================

-- Bank Product Transactions
CREATE TABLE IF NOT EXISTS bank_product_transactions (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  return_id INTEGER NOT NULL,
  product_type TEXT NOT NULL CHECK(product_type IN ('RT', 'RAL', 'EITC_Advance', 'ERC', 'Direct_Deposit')),
  product_id TEXT NOT NULL, -- e.g., 'RT-2025', 'RAL-2025'
  refund_amount REAL NOT NULL,
  fee_amount REAL NOT NULL,
  net_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'funded', 'rejected', 'completed', 'cancelled')),
  sbtpg_transaction_id TEXT UNIQUE,
  approval_code TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_client ON bank_product_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_return ON bank_product_transactions(return_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON bank_product_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_sbtpg_id ON bank_product_transactions(sbtpg_transaction_id);

-- Bank Product Configuration
CREATE TABLE IF NOT EXISTS bank_product_config (
  id TEXT PRIMARY KEY,
  product_id TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  base_fee REAL NOT NULL DEFAULT 0,
  percentage_fee REAL DEFAULT 0,
  max_fee REAL,
  min_refund_amount REAL NOT NULL DEFAULT 0,
  max_refund_amount REAL,
  eitc_required INTEGER DEFAULT 0,
  credit_check_required INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_config_year ON bank_product_config(tax_year);
CREATE INDEX IF NOT EXISTS idx_product_config_type ON bank_product_config(product_type);

-- Seed 2025 tax year products
INSERT OR IGNORE INTO bank_product_config (id, product_id, product_name, product_type, tax_year, base_fee, percentage_fee, max_fee, min_refund_amount, max_refund_amount, eitc_required, credit_check_required, active) VALUES
  ('rt-2025', 'RT-2025', 'Refund Transfer 2025', 'RT', 2025, 39.95, 0, 59.95, 300, NULL, 0, 0, 1),
  ('ral-2025', 'RAL-2025', 'Refund Anticipation Loan 2025', 'RAL', 2025, 0, 10.5, 500, 500, 6000, 0, 1, 1),
  ('eitc-2025', 'EITC-ADV-2025', 'EITC Advance 2025', 'EITC_Advance', 2025, 0, 5.0, 100, 300, 2000, 1, 0, 1),
  ('dd-2025', 'DD-2025', 'Direct Deposit 2025', 'Direct_Deposit', 2025, 0, 0, 0, 0, NULL, 0, 0, 1);

-- Bank Routing Information
CREATE TABLE IF NOT EXISTS bank_routing_info (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  routing_number TEXT NOT NULL,
  account_number_encrypted TEXT NOT NULL, -- Encrypted for PII compliance
  account_type TEXT NOT NULL CHECK(account_type IN ('checking', 'savings')),
  bank_name TEXT,
  verified INTEGER DEFAULT 0,
  verified_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_bank_routing_client ON bank_routing_info(client_id);

-- Refund Estimates
CREATE TABLE IF NOT EXISTS refund_estimates (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  return_id INTEGER NOT NULL,
  federal_refund REAL NOT NULL,
  state_refund REAL DEFAULT 0,
  total_refund REAL NOT NULL,
  eitc_amount REAL DEFAULT 0,
  ctc_amount REAL DEFAULT 0,
  estimated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE INDEX IF NOT EXISTS idx_refund_estimates_client ON refund_estimates(client_id);
CREATE INDEX IF NOT EXISTS idx_refund_estimates_return ON refund_estimates(return_id);

-- Bank Product Webhooks (for status updates from SBTPG)
CREATE TABLE IF NOT EXISTS bank_product_webhooks (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  webhook_event TEXT NOT NULL, -- e.g., 'transaction.approved', 'transaction.funded'
  payload TEXT NOT NULL, -- JSON payload from SBTPG
  processed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  FOREIGN KEY (transaction_id) REFERENCES bank_product_transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_webhooks_transaction ON bank_product_webhooks(transaction_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON bank_product_webhooks(processed);

-- Audit trail for bank product operations
INSERT INTO audit_log (id, action, entity, entity_id, details, created_at) VALUES
  (lower(hex(randomblob(16))), 'schema_create', 'bank_products', 'schema_2025', 'Bank products schema created for 2025 tax year', datetime('now'));
