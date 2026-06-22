# TerraTones
---
##Deskripsi Web:
Terra Tones is a website designed to bridge the gap between local musicians and their loyal listeners. This platform allows musicians to upload their work, promote gig schedules, and build an organic fan community all within a single digital ecosystem that supports local music.

---

## Team

| Nama | Role | Tanggung Jawab |
|---|---|---|
| **Bintang Aqra Wibowo** | Musisi Fiture (Page, Logic, and Query) | Backend
| **Henriko Almer Rayyan** | Admin Fiture (Page, Logic, and Query) | Frontend
| **Lalu Moh. Habib Adrian Maulana** | User Fiture (Page, Logic, and Query | Frontend
---

## Actors & Features

### Admin
| Feature | Description |
| --- | --- |
| **Overview** | View a summary of overall platform statistics |
| **Listener Management** | View the listener list & delete user accounts |
| **Musician Management** | View the musician list, delete accounts, and verify musician accounts |
| **Gig Management** | Add and update schedule information for musicians' live performances (*gigs*) |
| **Song Review** | Review and approve songs before they are published to the platform |

---

### Listener
| Feature | Description |
| --- | --- |
| **Explore** | View gig information, search for songs, and discover local musicians |
| **Feed** | Get the latest updates from followed bands/musicians |
| **Liked Songs** | View the list of songs that have been liked |
| **Local Musicians** | Browse the list of local musicians and manage followed creators |
| **Profile** | View personal profile and access the log-out menu |

---

###  Musician
| Feature | Description |
| --- | --- |
| **Overview** | Monitor statistics: total streams, number of songs, followers, and total likes |
| **Upload Song** | Upload new musical works to be reviewed and published |
| **My Songs** | View and manage the entire catalog of uploaded songs |
| **Musician Profile** | Manage public profile information as a musician |
| **Log Out** | Log out of the musician account session |

---

## Tech Stack

**Backend**
- PHP (native, dengan PDO untuk koneksi database)
- Session-based authentication

**Database**
- MySQL

**Frontend**
- HTML5
- Vanilla JavaScript
- Tailwind CSS

**Tools**
- XAMPP / Laragon (local development server)
- Git & GitHub (version control)

---

## DBMS

Project ini menggunakan **MySQL** sebagai sistem manajemen basis data, diakses melalui **PDO (PHP Data Objects)** pada sisi backend untuk menjalankan query secara aman (prepared statements) dan mendukung multiple database driver.

## Configuration

1. Clone repository:
```bash
   git clone https://github.com/username/TerraTones-Pemweb.git
```

2. Import database:

   -Import File to phpmyadmin
   - Import file `db_terratones.sql`

3. Atur koneksi database:
   - Buka file `config/db.php
   - Sesuaikan kredensial berikut:
```php
     $host = 'localhost';
     $dbname = 'db_terratones';
     $username = 'root';
     $password = '';
```

4. Jalankan local server (menggunakan XAMPP/Laragon):
   - Letakkan folder project di `htdocs` (XAMPP) atau `www` (Laragon)
   - Akses melalui browser: `http://localhost/TerraTones-Pemweb`

## Table Specification

### Table: users
| Field | Type | Keterangan |
|---|---|---|
| id | VARCHAR(50) (PK) | ID unik user |
| name | VARCHAR(150) | Nama lengkap user |
| email | VARCHAR(150) UNIQUE | Email user, tidak boleh duplikat |
| password | VARCHAR(255) | Password (disarankan hash bcrypt) |
| role | ENUM('admin','musisi','user') | Role akses, default `user` |
| avatar | VARCHAR(10) | Emoji/icon avatar, default 🎧 |
| joined | DATE | Tanggal user bergabung |
| status | ENUM('active','pending','banned') | Status akun, default `active` |
| musisi_id | VARCHAR(50) (FK → musisi.id) | Relasi ke profil musisi (jika role = musisi) |

### Table: musisi
| Field | Type | Keterangan |
|---|---|---|
| id | VARCHAR(50) (PK) | ID unik musisi/band |
| user_id | VARCHAR(50) | Relasi ke akun user terkait |
| name | VARCHAR(150) | Nama musisi/band |
| genre | VARCHAR(100) | Genre musik |
| kota | VARCHAR(100) | Kota asal |
| provinsi | VARCHAR(100) | Provinsi asal di Indonesia |
| bio | TEXT | Deskripsi/bio musisi |
| followers | INT UNSIGNED | Jumlah followers, default 0 |
| songs_count | INT UNSIGNED | Jumlah lagu yang diunggah, default 0 |
| verified | TINYINT(1) | Status verifikasi (0/1), default 0 |
| cover | VARCHAR(10) | Emoji/icon cover, default 🎵 |
| streams | INT UNSIGNED | Total streams musisi, default 0 |

### Table: songs
| Field | Type | Keterangan |
|---|---|---|
| id | VARCHAR(50) (PK) | ID unik lagu |
| title | VARCHAR(200) | Judul lagu |
| musisi_id | VARCHAR(50) (FK → musisi.id) | Musisi pemilik lagu, terhapus otomatis jika musisi dihapus (CASCADE) |
| musisi_name | VARCHAR(150) | Nama musisi (disimpan langsung untuk efisiensi tampilan) |
| genre | VARCHAR(100) | Genre lagu |
| duration | VARCHAR(10) | Durasi lagu, format `mm:ss` |
| streams | INT UNSIGNED | Jumlah streams lagu, default 0 |
| likes | INT UNSIGNED | Jumlah like lagu, default 0 |
| status | ENUM('published','review','draft') | Status publikasi lagu, default `review` |
| uploaded | DATE | Tanggal lagu diunggah |
| cover | VARCHAR(10) | Emoji/icon cover lagu, default 🎵 |
| description | TEXT | Deskripsi lagu |

### Table: gigs
| Field | Type | Keterangan |
|---|---|---|
| id | VARCHAR(50) (PK) | ID unik gig/acara |
| musisi_id | VARCHAR(50) (FK → musisi.id) | Musisi penyelenggara, `SET NULL` jika musisi dihapus |
| musisi_name | VARCHAR(150) | Nama musisi penyelenggara |
| title | VARCHAR(200) | Judul acara |
| venue | VARCHAR(200) | Nama venue/tempat acara |
| kota | VARCHAR(100) | Kota acara |
| provinsi | VARCHAR(100) | Provinsi acara |
| genre | VARCHAR(100) | Genre musik acara |
| date | DATE | Tanggal acara |
| time_start | TIME | Jam mulai acara, default 19:00:00 |
| price_min | INT UNSIGNED | Harga tiket minimum |
| price_max | INT UNSIGNED | Harga tiket maksimum |
| is_free | TINYINT(1) | Status gratis (0/1), default 0 |
| poster | VARCHAR(10) | Emoji/icon poster, default 🎸 |
| poster_url | VARCHAR(500) | URL gambar poster acara |
| description | TEXT | Deskripsi acara |
| ticket_url | VARCHAR(500) | Link pembelian tiket |
| status | ENUM('upcoming','completed','cancelled') | Status acara, default `upcoming` |
| going_count | INT UNSIGNED | Jumlah user yang akan hadir |
| submitted_by | VARCHAR(50) | ID user yang menambahkan data gig |
| created_at | DATE | Tanggal data gig dibuat |

### Table: gig_attendees
| Field | Type | Keterangan |
|---|---|---|
| gig_id | VARCHAR(50) (PK, FK → gigs.id) | Relasi ke gig, CASCADE saat gig dihapus |
| user_id | VARCHAR(50) (PK, FK → users.id) | Relasi ke user, CASCADE saat user dihapus |
| created_at | DATETIME | Waktu user menandai hadir, default waktu sekarang |

*Composite primary key: (gig_id, user_id) — mencatat user mana yang akan hadir di gig mana.*

### Table: gig_lineups
| Field | Type | Keterangan |
|---|---|---|
| gig_id | VARCHAR(50) (PK, FK → gigs.id) | Relasi ke gig, CASCADE saat gig dihapus |
| musisi_id | VARCHAR(50) (FK → musisi.id) | Musisi yang tampil, `SET NULL` jika musisi dihapus |
| name | VARCHAR(150) (PK) | Nama musisi/band yang tampil |
| order_no | INT UNSIGNED | Urutan tampil, default 1 |

*Composite primary key: (gig_id, name) — daftar lineup musisi per gig.*

### Table: likes
| Field | Type | Keterangan |
|---|---|---|
| user_id | VARCHAR(50) (PK) | User yang menyukai lagu |
| song_id | VARCHAR(50) (PK, FK → songs.id) | Lagu yang disukai, CASCADE saat lagu dihapus |

*Composite primary key: (user_id, song_id) — mencatat lagu mana yang disukai user mana.*

### Table: follows
| Field | Type | Keterangan |
|---|---|---|
| user_id | VARCHAR(50) (PK, FK → users.id) | User yang mengikuti, CASCADE saat user dihapus |
| musisi_id | VARCHAR(50) (PK, FK → musisi.id) | Musisi yang diikuti, CASCADE saat musisi dihapus |
| created_at | DATETIME | Waktu mulai follow, default waktu sekarang |

*Composite primary key: (user_id, musisi_id) — mencatat relasi follow user ke musisi.*
