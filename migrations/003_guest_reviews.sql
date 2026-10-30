-- Short-lived, keyed hashes for abuse limits; never store raw network addresses.
CREATE TABLE guest_rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX guest_rate_expiry ON guest_rate_limits(expires_at);
REVOKE ALL ON guest_rate_limits FROM PUBLIC;
