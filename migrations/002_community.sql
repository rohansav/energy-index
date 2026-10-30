-- One editorial record per product remains in editorial_reviews, independently.
CREATE TABLE community_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer text NOT NULL,
  subject text NOT NULL,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 40),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','editor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, subject)
);
CREATE TABLE community_reviews (
  user_id uuid NOT NULL REFERENCES community_users(id),
  product_id text NOT NULL REFERENCES products(id),
  score integer NOT NULL CHECK (score BETWEEN 10 AND 100),
  sweetness integer CHECK (sweetness BETWEEN 0 AND 50),
  tartness integer CHECK (tartness BETWEEN 0 AND 50),
  dryness integer CHECK (dryness BETWEEN 0 AND 50),
  energy integer CHECK (energy BETWEEN 0 AND 50),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes)<=300),
  body text NOT NULL DEFAULT '' CHECK (char_length(body)<=20000),
  version integer NOT NULL DEFAULT 1 CHECK (version>0),
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,product_id)
);
CREATE INDEX community_drink_newest ON community_reviews(product_id,created_at DESC,user_id) WHERE NOT deleted;
CREATE INDEX community_drink_score ON community_reviews(product_id,score,created_at DESC,user_id) WHERE NOT deleted;
CREATE TABLE community_review_history (
  user_id uuid NOT NULL REFERENCES community_users(id),
  product_id text NOT NULL REFERENCES products(id),
  version integer NOT NULL,
  review jsonb NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,product_id,version)
);
REVOKE ALL ON community_users,community_reviews,community_review_history FROM PUBLIC;
