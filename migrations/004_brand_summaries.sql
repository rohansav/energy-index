CREATE TABLE brand_summaries (
  brand text PRIMARY KEY REFERENCES brands(name),
  summary text NOT NULL CHECK (char_length(summary) <= 1200),
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON brand_summaries FROM PUBLIC;
