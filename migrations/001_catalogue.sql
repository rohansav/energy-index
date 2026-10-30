CREATE TABLE brands (
  name text PRIMARY KEY,
  position integer NOT NULL UNIQUE,
  color text NOT NULL CHECK (color ~ '^#[a-fA-F0-9]{6}$'),
  text text NOT NULL CHECK (text ~ '^#[a-fA-F0-9]{6}$')
);

CREATE TABLE products (
  id text PRIMARY KEY,
  brand text NOT NULL REFERENCES brands(name),
  position integer NOT NULL UNIQUE,
  metadata jsonb NOT NULL,
  CHECK (metadata->>'id' IS NOT NULL AND metadata->>'id' = id),
  CHECK (metadata->>'brand' IS NOT NULL AND metadata->>'brand' = brand)
);

-- Store exact integer tenths; NUMERIC(3,1) would silently round extra precision.
CREATE TABLE editorial_reviews (
  product_id text PRIMARY KEY REFERENCES products(id),
  score integer CHECK (score BETWEEN 10 AND 100),
  sweetness integer CHECK (sweetness BETWEEN 0 AND 50),
  tartness integer CHECK (tartness BETWEEN 0 AND 50),
  dryness integer CHECK (dryness BETWEEN 0 AND 50),
  energy integer CHECK (energy BETWEEN 0 AND 50),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 300),
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 20000),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE editorial_review_history (
  product_id text NOT NULL REFERENCES products(id),
  version integer NOT NULL,
  review jsonb NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, version)
);

-- Not exposed through browser credentials or anonymous database roles.
REVOKE ALL ON brands, products, editorial_reviews, editorial_review_history FROM PUBLIC;
