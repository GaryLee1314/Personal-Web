CREATE TABLE IF NOT EXISTS tool_click_daily (
  date TEXT NOT NULL,
  tool_key TEXT NOT NULL,
  tool_id TEXT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (date, tool_key)
);

CREATE INDEX IF NOT EXISTS idx_tool_click_daily_date_count
  ON tool_click_daily (date DESC, count DESC);
