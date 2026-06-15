-- ============================================================
-- LokalBeat — Schema Database MySQL
-- Database: db_TerraTones
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS musisi;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────
-- Tabel: users
-- ─────────────────────────────────────────
CREATE TABLE users (
  id          VARCHAR(50)  NOT NULL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,   -- simpan hash bcrypt di produksi
  role        ENUM('admin','musisi','user') NOT NULL DEFAULT 'user',
  avatar      VARCHAR(10)  DEFAULT '🎧',
  joined      DATE         NOT NULL,
  status      ENUM('active','pending','banned') DEFAULT 'active',
  musisi_id   VARCHAR(50)  DEFAULT NULL  -- FK ke musisi.id (untuk role musisi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
-- Tabel: musisi
-- ─────────────────────────────────────────
CREATE TABLE musisi (
  id          VARCHAR(50)  NOT NULL PRIMARY KEY,
  user_id     VARCHAR(50)  DEFAULT NULL,
  name        VARCHAR(150) NOT NULL,
  genre       VARCHAR(100) DEFAULT '',
  kota        VARCHAR(100) DEFAULT '',
  provinsi    VARCHAR(100) DEFAULT '',  -- provinsi Indonesia
  bio         TEXT         DEFAULT '',
  followers   INT UNSIGNED DEFAULT 0,
  songs_count INT UNSIGNED DEFAULT 0,
  verified    TINYINT(1)   DEFAULT 0,
  cover       VARCHAR(10)  DEFAULT '🎵',
  streams     INT UNSIGNED DEFAULT 0,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
-- Tabel: songs
-- ─────────────────────────────────────────
CREATE TABLE songs (
  id          VARCHAR(50)   NOT NULL PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  musisi_id   VARCHAR(50)   NOT NULL,
  musisi_name VARCHAR(150)  NOT NULL,
  genre       VARCHAR(100)  DEFAULT '',
  duration    VARCHAR(10)   DEFAULT '0:00',
  streams     INT UNSIGNED  DEFAULT 0,
  likes       INT UNSIGNED  DEFAULT 0,
  status      ENUM('published','review','draft') DEFAULT 'review',
  uploaded    DATE          NOT NULL,
  cover       VARCHAR(10)   DEFAULT '🎵',
  description TEXT          DEFAULT '',
  FOREIGN KEY (musisi_id) REFERENCES musisi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
-- Tabel: gigs
-- ─────────────────────────────────────────
CREATE TABLE gigs (
  id           VARCHAR(50)  NOT NULL PRIMARY KEY,
  musisi_id    VARCHAR(50)  DEFAULT NULL,
  musisi_name  VARCHAR(150) NOT NULL,
  title        VARCHAR(200) NOT NULL,
  venue        VARCHAR(200) NOT NULL,
  kota         VARCHAR(100) NOT NULL,
  provinsi     VARCHAR(100) DEFAULT '',
  genre        VARCHAR(100) DEFAULT '',
  date         DATE         NOT NULL,
  time_start   TIME         DEFAULT '19:00:00',
  price_min    INT UNSIGNED DEFAULT 0,
  price_max    INT UNSIGNED DEFAULT 0,
  is_free      TINYINT(1)   DEFAULT 0,
  poster       VARCHAR(10)  DEFAULT '🎸',
  poster_url   VARCHAR(500) DEFAULT NULL,
  description  TEXT         DEFAULT '',
  ticket_url   VARCHAR(500) DEFAULT NULL,
  status       ENUM('upcoming','completed','cancelled') DEFAULT 'upcoming',
  going_count  INT UNSIGNED DEFAULT 0,
  submitted_by VARCHAR(50)  DEFAULT NULL,
  created_at   DATE         NOT NULL,
  FOREIGN KEY (musisi_id) REFERENCES musisi(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
-- Tabel: gig_attendees (user yang tandai hadir)
-- ─────────────────────────────────────────
CREATE TABLE gig_attendees (
  gig_id     VARCHAR(50) NOT NULL,
  user_id    VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (gig_id, user_id),
  FOREIGN KEY (gig_id)  REFERENCES gigs(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
-- Tabel: gig_lineups (musisi yang tampil)
-- ─────────────────────────────────────────
CREATE TABLE gig_lineups (
  gig_id    VARCHAR(50)  NOT NULL,
  musisi_id VARCHAR(50)  DEFAULT NULL,
  name      VARCHAR(150) NOT NULL,
  order_no  INT UNSIGNED DEFAULT 1,
  PRIMARY KEY (gig_id, name),
  FOREIGN KEY (gig_id)    REFERENCES gigs(id)   ON DELETE CASCADE,
  FOREIGN KEY (musisi_id) REFERENCES musisi(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE likes (
  user_id     VARCHAR(50) NOT NULL,
  song_id     VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, song_id),
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
-- Tabel: follows
-- ─────────────────────────────────────────
CREATE TABLE follows (
  user_id    VARCHAR(50) NOT NULL,
  musisi_id  VARCHAR(50) NOT NULL,
  created_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, musisi_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (musisi_id) REFERENCES musisi(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

