# TerraTones
---
##Deskripsi Web:
Terra Tones is a website designed to bridge the gap between local musicians and their loyal listeners. This platform allows musicians to upload their work, promote gig schedules, and build an organic fan community all within a single digital ecosystem that supports local music.

---

## Team

| Nama | Role | Tanggung Jawab |
|---|---|---|
| **Bintang Aqra Wibowo** | Musisi Fiture (Page, Logic, and Query) | 
| **Henriko Almer Rayyan** | Admin Fiture (Page, Logic, and Query) | 
| **Lalu Moh. Habib Adrian Maulana** | User Fiture (Page, Logic, and Query | 
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
| id | INT (PK, AUTO_INCREMENT) | ID unik user |
| name | VARCHAR(100) | Nama lengkap |
| email | VARCHAR(100) | Email, unique |
| password | VARCHAR(255) | Password (hashed) |
| role | ENUM('pendengar','musisi','admin') | Role akses user |
| created_at | TIMESTAMP | Waktu akun dibuat |

### Table: gigs
| Field | Type | Keterangan |
|---|---|---|
| id | INT (PK, AUTO_INCREMENT) | ID unik gig |
| musisi_id | INT (FK -> users.id) | Musisi/band yang mengadakan gig |
| title | VARCHAR(150) | Nama acara/gig |
| description | TEXT | Deskripsi acara |
| location | VARCHAR(150) | Lokasi acara |
| event_date | DATETIME | Tanggal & waktu acara |
| created_at | TIMESTAMP | Waktu data dibuat |

### Table: musisi_profile
| Field | Type | Keterangan |
|---|---|---|
| id | INT (PK, AUTO_INCREMENT) | ID profil |
| user_id | INT (FK -> users.id) | Relasi ke user dengan role musisi |
| band_name | VARCHAR(100) | Nama band/artis |
| genre | VARCHAR(50) | Genre musik |
| bio | TEXT | Deskripsi singkat |
