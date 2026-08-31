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

-- Manzil requires an account to play (Justin's call, 24 Aug 2026) and that
-- account is shared with Star Shard — but per the 24 Aug PM handoff, Manzil
-- itself never touches this table. It exists exclusively for the Star Shard
-- opt-in path (PUT /api/me/birth, when a user asks for a reading): full
-- birth date/time/place, encrypted at the application layer. Manzil's own
-- signup writes manzil_pack below instead — five integers, not a birth
-- certificate. Fields beyond birth_date stay nullable since Star Shard's
-- onboarding can supply them progressively (date first, place/lat/lon/tz
-- once geocoded).
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

-- Manzil's entire dependency on the birth chart: _castFive() in the client
-- reads b.five and nothing else, so this is pseudonymisation, not
-- anonymisation — five integers 1-28 are still personal data under GDPR
-- and still carry export/erasure obligations (see GET /api/me/export and
-- this table's CASCADE below) — but a full dump of this table is not a
-- dump of birth certificates the way birth_data would be. birth_year is
-- for age re-derivation only; never store a full date here.
CREATE TABLE IF NOT EXISTS manzil_pack (
  user_id INT NOT NULL PRIMARY KEY,
  five_json VARCHAR(64) NOT NULL,
  pack_json VARCHAR(128) NOT NULL,
  birth_year SMALLINT UNSIGNED NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_manzil_pack_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Manzil's actual game progress (30 Aug 2026): the sixteen manzil-v2-*
-- localStorage keys that make up a player's real save file — climbs,
-- rungs, lives, build/buildv, wrec, noted, stairseen, wipe, moon,
-- lastclimb, respec, claims, lock, shards, firstlight (see CLAUDE.md) —
-- none of which synced to an account before this table existed, so
-- signing into the same real account on a second device restored the
-- chart but not the save. An opaque, size-capped grab-bag like
-- window_state above, not a validated domain object like deck/sigil: the
-- server has no reason to understand this blob's contents, only to hold
-- it. See PUT /api/me/manzil-progress in server.js.
CREATE TABLE IF NOT EXISTS manzil_progress (
  user_id INT NOT NULL PRIMARY KEY,
  progress_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_manzil_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reporting a match opponent also blocks them (manzil-lobby.js's
-- report_player handler writes both rows together) — the point of a block
-- list existing at all is that the matchmaker skips it, so a report with no
-- accompanying block would defeat its own purpose.
CREATE TABLE IF NOT EXISTS manzil_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(32) NOT NULL,
  reporter_user_id INT NOT NULL,
  reported_user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_manzil_reports_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_manzil_reports_reported FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS manzil_blocks (
  blocker_user_id INT NOT NULL,
  blocked_user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  CONSTRAINT fk_manzil_blocks_blocker FOREIGN KEY (blocker_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_manzil_blocks_blocked FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE
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
