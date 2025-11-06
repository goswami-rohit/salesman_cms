CREATE TABLE tally_raw (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_name TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);