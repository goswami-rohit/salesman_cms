CREATE TABLE auth_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mason_id uuid NOT NULL REFERENCES mason_pc_side(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);