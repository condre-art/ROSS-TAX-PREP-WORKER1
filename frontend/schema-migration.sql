-- Migration: Add intake status tracking and documents storage

-- Add status columns to intakes
ALTER TABLE intakes ADD COLUMN status TEXT DEFAULT 'New';
ALTER TABLE intakes ADD COLUMN last_status_at TEXT;

-- Create documents table for R2 references
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (intake_id) REFERENCES intakes(id)
);

-- Index for faster document lookups by intake
CREATE INDEX IF NOT EXISTS idx_documents_intake_id ON documents(intake_id);
