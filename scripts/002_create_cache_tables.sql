-- Create a general cache table for all external API data
CREATE TABLE IF NOT EXISTS api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);

-- Enable RLS
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read access to api_cache"
  ON api_cache FOR SELECT
  TO PUBLIC
  USING (true);

-- Allow service to insert/update
CREATE POLICY "Allow service to write api_cache"
  ON api_cache FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Allow service to update api_cache"
  ON api_cache FOR UPDATE
  TO PUBLIC
  USING (true);
