CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER,
  author TEXT NOT NULL,
  email TEXT NOT NULL,
  url TEXT,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (parent_id) REFERENCES comments(id)
);

CREATE INDEX IF NOT EXISTS idx_comments_status_created_at
  ON comments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_parent_id
  ON comments (parent_id);
