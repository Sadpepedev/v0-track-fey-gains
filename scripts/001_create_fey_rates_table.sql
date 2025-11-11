-- Create table to store FEY conversion rate history
CREATE TABLE IF NOT EXISTS fey_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  xfey_amount BIGINT NOT NULL,
  fey_amount BIGINT NOT NULL,
  conversion_rate DECIMAL(20, 6) NOT NULL,
  gains_percent DECIMAL(10, 4) NOT NULL
);

-- Create index for faster timestamp queries
CREATE INDEX IF NOT EXISTS idx_fey_rates_timestamp ON fey_rates(timestamp DESC);

-- Enable RLS (though this is public data, we'll make it readable by anyone)
ALTER TABLE fey_rates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the data
CREATE POLICY "Allow public read access to fey_rates"
  ON fey_rates FOR SELECT
  TO PUBLIC
  USING (true);

-- Only allow inserts from authenticated service (we'll use anon key from server)
CREATE POLICY "Allow service to insert fey_rates"
  ON fey_rates FOR INSERT
  TO PUBLIC
  WITH CHECK (true);
