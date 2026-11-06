-- MZ3 pre-signup email capture, 2 November 2026.
--
-- RUN THIS BEFORE DEPLOYING THE BACKEND. server.js now writes email_capture from
-- POST /api/email and reads it in /api/me/export and DELETE /api/me; against a database
-- without the table, every export and every account deletion returns 500.
--
-- Additive and safe against live data: one new table, no existing row touched.
--
--   node migrate.js migrations/2026-11-02-email-capture.sql
--
-- Re-running it is safe: the CREATE TABLE is IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS email_capture (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  device_hash CHAR(64) NOT NULL,
  user_id INT NULL,
  source VARCHAR(16) NOT NULL DEFAULT 'shard',
  tz VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_capture_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_capture_device (device_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
