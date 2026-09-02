-- W6 email verification — 2 September 2026.
--
-- RUN THIS BEFORE DEPLOYING THE BACKEND, not after. server.js now SELECTs
-- users.email_verified in /api/me, /api/me/export and /api/auth/resend-verification.
-- Deploy the new server.js against a database without the column and every one of
-- those returns 500 — /api/me failing means every signed-in player is treated as
-- logged out. Column first, then `tools/deploy.sh backend`.
--
-- Both statements are additive and safe to run against live data: no existing row
-- is rewritten, no column is dropped, nothing is backfilled. Existing accounts land
-- on email_verified = 0, which is honest — nobody has confirmed them — and costs
-- them nothing, because verification gates no part of the product.
--
--   mysql -u <user> -p <database> < 2026-09-02-email-verification.sql
--
-- Re-running it is safe: the CREATE TABLE is IF NOT EXISTS, and the ALTER will
-- error with "Duplicate column name" and change nothing.

ALTER TABLE users
  ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER token_version;

CREATE TABLE IF NOT EXISTS email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
