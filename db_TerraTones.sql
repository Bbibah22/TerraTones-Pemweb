-- ============================================================
-- LokalBeat — Schema Database MySQL
-- Database: db_TerraTones
-- Jalankan file ini setelah membuat database:
--   CREATE DATABASE db_TerraTones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE db_TerraTones;
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
  youtube_url VARCHAR(300) DEFAULT NULL  -- channel YouTube musisi (opsional)
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
  file_url    VARCHAR(500)  DEFAULT NULL,  -- path file lokal atau URL eksternal MP3
  youtube_url VARCHAR(300)  DEFAULT NULL,  -- URL video YouTube untuk embed player
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


CREATE TABLE albums (
  id          VARCHAR(50)   NOT NULL PRIMARY KEY,
  musisi_id   VARCHAR(50)   NOT NULL,
  musisi_name VARCHAR(150)  NOT NULL,
  title       VARCHAR(200)  NOT NULL,
  type        ENUM('album','ep','single') DEFAULT 'album',
  cover       VARCHAR(10)   DEFAULT '💿',
  cover_url   VARCHAR(500)  DEFAULT NULL,   -- URL gambar cover art (opsional)
  description TEXT          DEFAULT '',
  year        YEAR          NOT NULL,
  status      ENUM('published','draft') DEFAULT 'draft',
  created_at  DATE          NOT NULL,
  FOREIGN KEY (musisi_id) REFERENCES musisi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
-- Tabel: album_songs (relasi album ↔ songs)
-- ─────────────────────────────────────────
CREATE TABLE album_songs (
  album_id  VARCHAR(50) NOT NULL,
  song_id   VARCHAR(50) NOT NULL,
  track_no  INT UNSIGNED DEFAULT 1,
  PRIMARY KEY (album_id, song_id),
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id)  REFERENCES songs(id)  ON DELETE CASCADE
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

-- ============================================================
-- SEED DATA — Akun & Konten Demo
-- ============================================================

-- Users (password disimpan plain untuk demo; ganti ke bcrypt di produksi)
INSERT INTO users (id, name, email, password, role, avatar, joined, status, musisi_id) VALUES
('u1',  'Admin LokalBeat', 'admin@lokalbeat.id', 'admin123',  'admin',  '🛡️', '2024-01-01', 'active', NULL),
('u2',  'Budi Santoso',    'budi@mail.com',      'user123',   'user',   '🎧', '2024-03-15', 'active', NULL),
('u3',  'Rina Melati',     'rina@mail.com',      'user123',   'user',   '🎵', '2024-04-20', 'active', NULL),
('m1',  'Arjuna Band',     'arjuna@mail.com',    'musisi123', 'musisi', '🎸', '2024-02-10', 'active', 'ms1'),
('m2',  'Dewi Nada',       'dewi@mail.com',      'musisi123', 'musisi', '🎤', '2024-03-05', 'active', 'ms2'),
('m3',  'Trio Kota',       'trio@mail.com',      'musisi123', 'musisi', '🥁', '2024-04-01', 'pending','ms3');

-- Musisi
INSERT INTO musisi (id, user_id, name, genre, kota, bio, followers, songs_count, verified, cover, streams) VALUES
('ms1', 'm1',  'Arjuna Band',  'Indie Folk',     'Yogyakarta', 'Band indie folk dari Jogja yang menggabungkan gamelan dengan gitar akustik.', 2840, 12, 1, '🎸', 48200),
('ms2', 'm2',  'Dewi Nada',   'Jazz Lokal',     'Jakarta',    'Penyanyi jazz muda dengan nuansa lokal yang kental. Terinspirasi dari keroncong dan bossanova.', 1560, 8, 1, '🎤', 31000),
('ms3', 'm3',  'Trio Kota',   'Pop Alternatif', 'Bandung',    'Trio dari Bandung yang membawa warna pop alternatif segar di kancah musik Indonesia.', 980, 5, 0, '🥁', 15400),
('ms4', NULL,  'Senja Merah', 'R&B Lokal',      'Surabaya',   'Duo R&B yang membawa nuansa urban Surabaya ke dalam musik modern.', 3200, 15, 1, '🎹', 62000);

-- Songs
INSERT INTO songs (id, title, musisi_id, musisi_name, genre, duration, streams, likes, status, uploaded, cover, description) VALUES
('s1', 'Rindu Tanah Air', 'ms1', 'Arjuna Band',  'Indie Folk',     '4:12', 12400, 342, 'published', '2025-04-01', '🌿', 'Lagu tentang kerinduan akan kampung halaman.'),
('s2', 'Mentari Pagi',    'ms2', 'Dewi Nada',   'Jazz Lokal',     '3:45',  8900, 218, 'published', '2025-04-10', '☀️', 'Jazz manis untuk mengawali hari.'),
('s3', 'Kota Hujan',      'ms3', 'Trio Kota',   'Pop Alternatif', '3:58',  5600, 176, 'published', '2025-04-15', '🌧️', 'Ode untuk Bogor, kota hujan.'),
('s4', 'Senja di Bromo',  'ms4', 'Senja Merah', 'R&B Lokal',      '4:30', 19800, 504, 'published', '2025-03-28', '🌋', 'Pesona senja di kaki Bromo.'),
('s5', 'Jalan Pulang',    'ms1', 'Arjuna Band',  'Indie Folk',     '5:02',  9200, 267, 'published', '2025-03-20', '🏡', 'Perjalanan kembali ke rumah.'),
('s6', 'Bintang Selatan', 'ms2', 'Dewi Nada',   'Jazz Lokal',     '3:22',  7100, 194, 'published', '2025-04-18', '⭐', 'Bintang yang selalu menemani.'),
('s7', 'Pasar Malam',     'ms4', 'Senja Merah', 'R&B Lokal',      '3:55', 14300, 388, 'review',    '2025-04-22', '🏮', 'Suasana pasar malam yang meriah.'),
('s8', 'Angin Laut',      'ms3', 'Trio Kota',   'Pop Alternatif', '4:08',  3400,  98, 'review',    '2025-04-25', '🌊', 'Semilir angin pantai selatan.');

-- Gigs
INSERT INTO gigs (id, musisi_id, musisi_name, title, venue, kota, provinsi, genre, date, time_start, price_min, price_max, is_free, poster, description, ticket_url, status, going_count, submitted_by, created_at) VALUES
('g1',  'ms1', 'Arjuna Band',  'Arjuna Band Live at Rossi',         'Rossi Musik',              'Jakarta',   'DKI Jakarta',        'Indie Folk',     '2026-06-15', '19:00', 75000,  150000, 0, '🌿', 'Malam spesial bersama Arjuna Band membawakan lagu-lagu dari album terbaru mereka. Hadir juga tamu spesial dari skena indie Jakarta.',                               'https://tiket.com', 'upcoming',  42, NULL, '2026-05-01'),
('g2',  'ms2', 'Dewi Nada',    'Jazz Under The Stars',              'Taman Ismail Marzuki',     'Jakarta',   'DKI Jakarta',        'Jazz Lokal',     '2026-06-20', '20:00', 100000, 200000, 0, '⭐', 'Malam jazz di bawah bintang bersama Dewi Nada dan kawan-kawan. Nikmati suasana TIM yang romantis dengan musik jazz lokal terbaik.',                               NULL,                'upcoming',  28, NULL, '2026-05-02'),
('g3',  'ms3', 'Trio Kota',    'Kota Hujan Festival',               'Lapangan Sempur',          'Bogor',     'Jawa Barat',         'Pop Alternatif', '2026-06-28', '15:00', 0,      0,      1, '🌧️', 'Festival musik gratis persembahan Pemerintah Kota Bogor. Menampilkan Trio Kota dan 5 band lokal Bogor lainnya. Bawa tikar dan nikmati musiknya!',                 NULL,                'upcoming',  89, NULL, '2026-05-03'),
('g4',  'ms4', 'Senja Merah',  'Senja Merah Release Party',         'Stos Bar Surabaya',        'Surabaya',  'Jawa Timur',         'R&B Lokal',      '2026-07-05', '20:00', 50000,  50000,  0, '🌋', 'Perayaan rilis single terbaru Senja Merah. Acara eksklusif dengan kapasitas terbatas, dapatkan signed merch langsung dari band!',                                'https://loket.com', 'upcoming',  56, NULL, '2026-05-04'),
('g5',  NULL,  'Various',      'Bandung Lautan Musik Vol. 3',        'Sabuga Bandung',           'Bandung',   'Jawa Barat',         'Indie Folk',     '2026-07-12', '13:00', 80000,  150000, 0, '🎸', 'Kembalinya festival musik terbesar di Bandung! Menampilkan lebih dari 15 band lokal dari berbagai genre. Food stalls, bazaar, dan merchandise area tersedia.',     'https://tiket.com', 'upcoming',  134,NULL, '2026-05-05'),
('g6',  'ms1', 'Arjuna Band',  'Malam Indie Yogyakarta',            'Kedai Kebun Forum',        'Yogyakarta','DI Yogyakarta',       'Indie Folk',     '2026-07-19', '20:00', 60000,  60000,  0, '🏡', 'Arjuna Band hadir di kota gudeg! Venue intimate dengan kapasitas 200 orang. Cocok untuk kalian yang ingin merasakan konser yang dekat dan personal.',            NULL,                'upcoming',  33, NULL, '2026-05-06'),
('g7',  NULL,  'Various',      'Jazz Nusantara Night',              'Auditorium Universitas Indonesia', 'Depok', 'Jawa Barat',    'Jazz Lokal',     '2026-08-02', '19:00', 120000, 250000, 0, '🎷', 'Perayaan musik jazz Indonesia dengan penampil-penampil terbaik dari berbagai daerah. Dresscode: smart casual.',                                                    'https://tiket.com', 'upcoming',  67, NULL, '2026-05-07'),
('g8',  'ms3', 'Trio Kota',    'Open Mic Komunitas Bekasi',         'Coffe Toffee Bekasi Timur','Bekasi',    'Jawa Barat',         'Pop Alternatif', '2026-06-10', '19:30', 0,      0,      1, '🌊', 'Open mic bulanan komunitas musik Bekasi. Gratis untuk penonton! Registrasi performer via DM Instagram @trimkota. Slot terbatas 10 performer.',                     NULL,                'upcoming',  18, NULL, '2026-05-08'),
('g9',  'ms2', 'Dewi Nada',    'Jazz for Charity',                  'Hotel Mulia Senayan',      'Jakarta',   'DKI Jakarta',        'Jazz Lokal',     '2026-08-15', '18:00', 200000, 500000, 0, '🎹', 'Konser jazz amal untuk mendukung pendidikan anak-anak tidak mampu. Sebagian hasil tiket disumbangkan ke Yayasan Musik Untuk Negeri.',                            'https://tiket.com', 'upcoming',  45, NULL, '2026-05-09'),
('g10', NULL,  'Various',      'Makassar Music Week',               'Fort Rotterdam',           'Makassar',  'Sulawesi Selatan',   'Pop Alternatif', '2026-08-20', '17:00', 50000,  100000, 0, '🌴', 'Perayaan satu minggu penuh musik lokal Makassar dan Sulawesi Selatan. 30+ band tampil di 5 stage berbeda selama 7 hari berturut-turut.',                          'https://tiket.com', 'upcoming',  78, NULL, '2026-05-10'),
('g11', NULL,  'Various',      'Bali Beats Festival',               'GWK Cultural Park',        'Denpasar',  'Bali',               'Elektronik',     '2026-09-01', '16:00', 150000, 300000, 0, '🌺', 'Festival musik elektronik terbesar di Bali yang memadukan musik tradisional Bali dengan elektronik modern. Venue ikonik di GWK dengan view yang luar biasa.',       'https://tiket.com', 'upcoming',  112,NULL, '2026-05-11'),
('g12', 'ms4', 'Senja Merah',  'R&B Night Surabaya',                'Empire Palace Surabaya',   'Surabaya',  'Jawa Timur',         'R&B Lokal',      '2026-09-10', '21:00', 100000, 200000, 0, '🎤', 'Malam penuh warna bersama Senja Merah dan kolaborasi spesial bersama beberapa musisi R&B lokal terbaik dari Surabaya, Malang, dan Bali.',                         'https://loket.com', 'upcoming',  39, NULL, '2026-05-12');

-- Gig lineups
INSERT INTO gig_lineups (gig_id, musisi_id, name, order_no) VALUES
('g1', 'ms1', 'Arjuna Band', 1),
('g1', NULL,  'Tamu Spesial', 2),
('g2', 'ms2', 'Dewi Nada', 1),
('g3', 'ms3', 'Trio Kota', 1),
('g3', NULL,  'Dara Project', 2),
('g3', NULL,  'Langit Senja', 3),
('g4', 'ms4', 'Senja Merah', 1),
('g5', 'ms1', 'Arjuna Band', 1),
('g5', 'ms3', 'Trio Kota', 2),
('g5', NULL,  'Bunga Hitam', 3),
('g5', NULL,  'Kota Tua', 4),
('g12','ms4', 'Senja Merah', 1),
('g12', NULL, 'R&B Collective', 2);

-- ============================================================
-- MIGRASI — Jalankan ini jika database sudah ada (tidak perlu drop ulang)
-- ============================================================
-- ALTER TABLE songs ADD COLUMN file_url VARCHAR(500) DEFAULT NULL COMMENT 'Path file lokal atau URL eksternal MP3';

-- ============================================================
-- MIGRASI v2 — jalankan jika DB sudah ada
-- ============================================================
-- ALTER TABLE musisi ADD COLUMN provinsi VARCHAR(100) DEFAULT '' AFTER kota;
-- ALTER TABLE musisi ADD COLUMN youtube_url VARCHAR(300) DEFAULT NULL;
-- ALTER TABLE songs  ADD COLUMN youtube_url VARCHAR(300) DEFAULT NULL;

-- MIGRASI v3 — jalankan jika DB sudah ada
-- ALTER TABLE songs ADD COLUMN album_id VARCHAR(50) DEFAULT NULL;
-- CREATE TABLE albums ( id VARCHAR(50) NOT NULL PRIMARY KEY, musisi_id VARCHAR(50) NOT NULL, musisi_name VARCHAR(150) NOT NULL, title VARCHAR(200) NOT NULL, type ENUM('album','ep','single') DEFAULT 'album', cover VARCHAR(10) DEFAULT '💿', cover_url VARCHAR(500) DEFAULT NULL, description TEXT DEFAULT '', year YEAR NOT NULL, status ENUM('published','draft') DEFAULT 'draft', created_at DATE NOT NULL, FOREIGN KEY (musisi_id) REFERENCES musisi(id) ON DELETE CASCADE ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- CREATE TABLE album_songs ( album_id VARCHAR(50) NOT NULL, song_id VARCHAR(50) NOT NULL, track_no INT UNSIGNED DEFAULT 1, PRIMARY KEY (album_id, song_id), FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE, FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MIGRASI v4 — jalankan jika DB sudah ada
-- CREATE TABLE follows ( user_id VARCHAR(50) NOT NULL, musisi_id VARCHAR(50) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, musisi_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (musisi_id) REFERENCES musisi(id) ON DELETE CASCADE ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MIGRASI v5 — jalankan jika DB sudah ada
-- CREATE TABLE gigs ( id VARCHAR(50) NOT NULL PRIMARY KEY, musisi_id VARCHAR(50) DEFAULT NULL, musisi_name VARCHAR(150) NOT NULL, title VARCHAR(200) NOT NULL, venue VARCHAR(200) NOT NULL, kota VARCHAR(100) NOT NULL, provinsi VARCHAR(100) DEFAULT '', genre VARCHAR(100) DEFAULT '', date DATE NOT NULL, time_start TIME DEFAULT '19:00:00', price_min INT UNSIGNED DEFAULT 0, price_max INT UNSIGNED DEFAULT 0, is_free TINYINT(1) DEFAULT 0, poster VARCHAR(10) DEFAULT '🎸', poster_url VARCHAR(500) DEFAULT NULL, description TEXT DEFAULT '', ticket_url VARCHAR(500) DEFAULT NULL, status ENUM('upcoming','completed','cancelled') DEFAULT 'upcoming', going_count INT UNSIGNED DEFAULT 0, submitted_by VARCHAR(50) DEFAULT NULL, created_at DATE NOT NULL, FOREIGN KEY (musisi_id) REFERENCES musisi(id) ON DELETE SET NULL ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- CREATE TABLE gig_attendees ( gig_id VARCHAR(50) NOT NULL, user_id VARCHAR(50) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (gig_id, user_id), FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- CREATE TABLE gig_lineups ( gig_id VARCHAR(50) NOT NULL, musisi_id VARCHAR(50) DEFAULT NULL, name VARCHAR(150) NOT NULL, order_no INT UNSIGNED DEFAULT 1, PRIMARY KEY (gig_id, name), FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE, FOREIGN KEY (musisi_id) REFERENCES musisi(id) ON DELETE SET NULL ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
