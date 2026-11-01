CREATE TABLE IF NOT EXISTS domain_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE,
  email TEXT NOT NULL COLLATE NOCASE,
  project_url TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(name)
);
CREATE INDEX IF NOT EXISTS idx_domain_requests_status_created
  ON domain_requests(status, created_at);

CREATE TABLE IF NOT EXISTS request_rate_limits (
  ip_hash TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0
);
