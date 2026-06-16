<?php

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

switch ($method) {


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

    
        $songs = array_map('normSong', $songs);
        jsonResponse($songs);
        break;

   
    case 'POST':
        $body = getBody();

        $id          = 's_' . time() . rand(100, 999);
        $title       = trim($body['title']       ?? '');
        $musisiId    = trim($body['musisiId']     ?? '');
        $musisiName  = trim($body['musisiName']   ?? '');
        $genre       = trim($body['genre']        ?? '');
        $duration    = trim($body['duration']     ?? '0:00');
        $cover       = trim($body['cover']        ?? '🎵');
        $description = trim($body['description']  ?? '');
        $fileUrl     = trim($body['fileUrl']      ?? '');  
        $youtubeUrl  = trim($body['youtubeUrl']   ?? '');  
        $status      = 'review';
        $uploaded    = date('Y-m-d');

        if (!$title || !$musisiId) {
            jsonResponse(['error' => 'Judul dan musisi_id wajib diisi'], 400);
        }

        $stmt = $db->prepare(
            'INSERT INTO songs (id, title, musisi_id, musisi_name, genre, duration, streams, likes, status, uploaded, cover, description, file_url)
             VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$id, $title, $musisiId, $musisiName, $genre, $duration, $status, $uploaded, $cover, $description, $fileUrl ?: null]);

       
        $db->prepare('UPDATE musisi SET songs_count = songs_count + 1 WHERE id = ?')->execute([$musisiId]);

        $new = $db->prepare('SELECT * FROM songs WHERE id = ?');
        $new->execute([$id]);
        jsonResponse(normSong($new->fetch()), 201);
        break;

   
    case 'PATCH':
        $id   = $_GET['id'] ?? '';
        $body = getBody();
        if (!$id) jsonResponse(['error' => 'id wajib diisi'], 400);

        $allowed = ['title','genre','duration','cover','description','status','streams','likes','file_url'];
        $sets    = [];
        $params  = [];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $body)) {
                $sets[]   = "$field = ?";
                $params[] = $body[$field];
            }
        }
        if (!$sets) jsonResponse(['error' => 'Tidak ada field yang diupdate'], 400);

        $params[] = $id;
        $db->prepare('UPDATE songs SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);

        $upd = $db->prepare('SELECT * FROM songs WHERE id = ?');
        $upd->execute([$id]);
        jsonResponse(normSong($upd->fetch()));
        break;

    
    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) jsonResponse(['error' => 'id wajib diisi'], 400);

   
        $s = $db->prepare('SELECT musisi_id FROM songs WHERE id = ?');
        $s->execute([$id]);
        $song = $s->fetch();

        $db->prepare('DELETE FROM likes  WHERE song_id = ?')->execute([$id]);
        $db->prepare('DELETE FROM songs  WHERE id = ?')->execute([$id]);

        if ($song) {
            $db->prepare('UPDATE musisi SET songs_count = GREATEST(0, songs_count - 1) WHERE id = ?')
               ->execute([$song['musisi_id']]);
        }

        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}


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
