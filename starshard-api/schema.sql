CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(32) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  token_version INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS window_state (
  user_id INT NOT NULL PRIMARY KEY,
  state_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_window_state_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deck (
  user_id INT NOT NULL PRIMARY KEY,
  deck_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_deck_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The reboot's Sigil/Sounding system. Additive, alongside the pre-reboot
-- `deck` table above (not a migration of it) — see COSMOLOGY.md §7 and
-- OWNERSHIP.md. `deck` stays as-is for the old page until it's retired.

CREATE TABLE IF NOT EXISTS sigil (
  user_id INT NOT NULL PRIMARY KEY,
  sigil_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sigil_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per kindled (station, step) pair, ever — the unique key makes
-- re-visiting an already-kindled segment a no-op insert, not a new row
-- ("each of the 112 shard-slots kindles once", COSMOLOGY §4). station/step
-- are recorded from the SERVER's own real-time position, never trusted from
-- the client — see the POST /api/recollection handler below.
CREATE TABLE IF NOT EXISTS recollection (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  station TINYINT UNSIGNED NOT NULL,
  step TINYINT UNSIGNED NOT NULL,
  cast_context_json TEXT NOT NULL,
  kindled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recollection_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_station_step (user_id, station, step)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Manzil now requires an account to play (Justin's call, 24 Aug 2026) and
-- that account is shared with Star Shard. Real birth date/time/place now
-- lives server-side per account, alongside the Sigil's derived-only data
-- above — a deliberate reversal of the old "birth data never leaves the
-- browser" rule (see CLAUDE.md's Privacy invariant). Fields beyond
-- birth_date stay nullable: Manzil's own birth screen has no geocoding,
-- so only a date is guaranteed at signup; place/lat/lon/tz fill in later
-- via PUT /api/me/birth when a fuller onboarding (Star Shard's) supplies
-- them.
CREATE TABLE IF NOT EXISTS birth_data (
  user_id INT NOT NULL PRIMARY KEY,
  birth_date DATE NOT NULL,
  birth_time TIME NULL,
  birth_time_known TINYINT(1) NOT NULL DEFAULT 1,
  place_name VARCHAR(255) NULL,
  lat DECIMAL(8,5) NULL,
  lon DECIMAL(8,5) NULL,
  tz VARCHAR(64) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_birth_data_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guestbook_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  msg VARCHAR(280) NOT NULL,
  stamp VARCHAR(8) NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_guestbook_ip_hash (ip_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
