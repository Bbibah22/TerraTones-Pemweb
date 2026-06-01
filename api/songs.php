<?php
// ============================================================
// api/songs.php — Baca Lagu
// GET    /api/songs.php              → semua lagu (filter: ?status=published / ?musisi_id=X / ?q=keyword)
// ============================================================
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

switch ($method) {

    // ── GET ─────────────────────────────────────────────────
    case 'GET':
        $where  = [];
        $params = [];

        if (isset($_GET['status'])) {
            $where[]  = 'status = ?';
            $params[] = $_GET['status'];
        }
        if (isset($_GET['musisi_id'])) {
            $where[]  = 'musisi_id = ?';
            $params[] = $_GET['musisi_id'];
        }
        if (isset($_GET['id'])) {
            $where[]  = 'id = ?';
            $params[] = $_GET['id'];
        }
        // Full-text search: ?q=keyword — cocok ke title, musisi_name, genre
        if (!empty($_GET['q'])) {
            $kw       = '%' . trim($_GET['q']) . '%';
            $where[]  = '(title LIKE ? OR musisi_name LIKE ? OR genre LIKE ?)';
            $params[] = $kw;
            $params[] = $kw;
            $params[] = $kw;
        }

        $sql  = 'SELECT * FROM songs';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= !empty($_GET['q']) ? ' ORDER BY streams DESC LIMIT 20' : ' ORDER BY uploaded DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $songs = $stmt->fetchAll();

        // Normalise field names agar sama dengan frontend (camelCase)
        $songs = array_map('normSong', $songs);
        jsonResponse($songs);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

// ─── Helper ─────────────────────────────────────────────────
function normSong(array $s): array {
    return [
        'id'          => $s['id'],
        'title'       => $s['title'],
        'musisiId'    => $s['musisi_id'],
        'musisiName'  => $s['musisi_name'],
        'genre'       => $s['genre'],
        'duration'    => $s['duration'],
        'streams'     => (int)$s['streams'],
        'likes'       => (int)$s['likes'],
        'status'      => $s['status'],
        'uploaded'    => $s['uploaded'],
        'cover'       => $s['cover'],
        'desc'        => $s['description'],
        'fileUrl'     => $s['file_url'] ?? null,
    ];
}
