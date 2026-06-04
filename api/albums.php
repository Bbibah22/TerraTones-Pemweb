<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$action = $_GET['action'] ?? '';

function normAlbum(array $a, array $tracks = []): array {
    return [
        'id'          => $a['id'],
        'musisiId'    => $a['musisi_id'],
        'musisiName'  => $a['musisi_name'],
        'title'       => $a['title'],
        'type'        => $a['type'],           // album | ep | single
        'cover'       => $a['cover'],
        'coverUrl'    => $a['cover_url'] ?? null,
        'description' => $a['description'],
        'year'        => (int)$a['year'],
        'status'      => $a['status'],
        'createdAt'   => $a['created_at'],
        'trackCount'  => (int)($a['track_count'] ?? count($tracks)),
        'totalStreams' => (int)($a['total_streams'] ?? 0),
        'tracks'      => $tracks,
    ];
}

function getTracklist(PDO $db, string $albumId): array {
    $stmt = $db->prepare(
        'SELECT s.*, als.track_no
         FROM songs s
         JOIN album_songs als ON s.id = als.song_id
         WHERE als.album_id = ?
         ORDER BY als.track_no ASC'
    );
    $stmt->execute([$albumId]);
    return array_map(function($s) {
        return [
            'id'         => $s['id'],
            'title'      => $s['title'],
            'genre'      => $s['genre'],
            'duration'   => $s['duration'],
            'streams'    => (int)$s['streams'],
            'likes'      => (int)$s['likes'],
            'status'     => $s['status'],
            'cover'      => $s['cover'],
            'fileUrl'    => $s['file_url'] ?? null,
            'youtubeUrl' => $s['youtube_url'] ?? null,
            'trackNo'    => (int)$s['track_no'],
        ];
    }, $stmt->fetchAll());
}

switch ($method) {
    case 'GET':

        // Satu album dengan tracklist lengkap
        if (!empty($_GET['id'])) {
            $stmt = $db->prepare(
                'SELECT a.*,
                        COUNT(als.song_id) as track_count,
                        COALESCE(SUM(s.streams),0) as total_streams
                 FROM albums a
                 LEFT JOIN album_songs als ON a.id = als.album_id
                 LEFT JOIN songs s ON als.song_id = s.id
                 WHERE a.id = ?
                 GROUP BY a.id'
            );
            $stmt->execute([$_GET['id']]);
            $a = $stmt->fetch();
            if (!$a) jsonResponse(['error' => 'Album tidak ditemukan'], 404);
            $tracks = getTracklist($db, $a['id']);
            jsonResponse(normAlbum($a, $tracks));
        }

        $where  = [];
        $params = [];
        if (!empty($_GET['musisi_id'])) {
            $where[]  = 'a.musisi_id = ?';
            $params[] = $_GET['musisi_id'];
        }
        if (!empty($_GET['status'])) {
            $where[]  = 'a.status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['type'])) {
            $where[]  = 'a.type = ?';
            $params[] = $_GET['type'];
        }

        $sql = 'SELECT a.*,
                       COUNT(als.song_id) as track_count,
                       COALESCE(SUM(s.streams),0) as total_streams
                FROM albums a
                LEFT JOIN album_songs als ON a.id = als.album_id
                LEFT JOIN songs s ON als.song_id = s.id';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' GROUP BY a.id ORDER BY a.year DESC, a.created_at DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $albums = $stmt->fetchAll();

        $result = array_map(function($a) use ($db) {
            $tracks = getTracklist($db, $a['id']);
            return normAlbum($a, $tracks);
        }, $albums);

        jsonResponse($result);
        break;

    case 'POST':
        if ($action === 'add_song') {
            $body     = getBody();
            $albumId  = trim($body['albumId']  ?? '');
            $songId   = trim($body['songId']   ?? '');
            $trackNo  = (int)($body['trackNo'] ?? 99);

            if (!$albumId || !$songId) jsonResponse(['error' => 'albumId dan songId wajib'], 400);

            $chk = $db->prepare('SELECT 1 FROM album_songs WHERE album_id=? AND song_id=?');
            $chk->execute([$albumId, $songId]);
            if ($chk->fetch()) jsonResponse(['error' => 'Lagu sudah ada di album ini'], 409);

            if ($trackNo === 99) {
                $max = $db->prepare('SELECT COALESCE(MAX(track_no),0)+1 FROM album_songs WHERE album_id=?');
                $max->execute([$albumId]);
                $trackNo = (int)$max->fetchColumn();
            }

            $db->prepare('INSERT INTO album_songs (album_id, song_id, track_no) VALUES (?,?,?)')
               ->execute([$albumId, $songId, $trackNo]);

            jsonResponse(['success' => true, 'trackNo' => $trackNo], 201);
        }

        $body       = getBody();
        $id         = 'alb_' . time() . rand(10, 99);
        $musisiId   = trim($body['musisiId']   ?? '');
        $musisiName = trim($body['musisiName'] ?? '');
        $title      = trim($body['title']      ?? '');
        $type       = in_array($body['type'] ?? '', ['album','ep','single']) ? $body['type'] : 'album';
        $cover      = trim($body['cover']      ?? '💿');
        $coverUrl   = trim($body['coverUrl']   ?? '');
        $desc       = trim($body['description'] ?? '');
        $year       = (int)($body['year']      ?? date('Y'));
        $status     = 'draft';

        if (!$title || !$musisiId) jsonResponse(['error' => 'title dan musisiId wajib'], 400);

        $db->prepare(
            'INSERT INTO albums (id,musisi_id,musisi_name,title,type,cover,cover_url,description,year,status,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([$id, $musisiId, $musisiName, $title, $type, $cover, $coverUrl ?: null, $desc, $year, $status, date('Y-m-d')]);

        if (!empty($body['songIds']) && is_array($body['songIds'])) {
            foreach ($body['songIds'] as $i => $sid) {
                $db->prepare('INSERT IGNORE INTO album_songs (album_id,song_id,track_no) VALUES (?,?,?)')
                   ->execute([$id, $sid, $i + 1]);
            }
        }

        $stmt = $db->prepare('SELECT * FROM albums WHERE id=?');
        $stmt->execute([$id]);
        $newAlbum = $stmt->fetch();
        jsonResponse(normAlbum($newAlbum, getTracklist($db, $id)), 201);
        break;

    case 'PATCH':
        if ($action === 'reorder') {
            $body    = getBody();
            $albumId = trim($body['albumId'] ?? '');
            $order   = $body['order'] ?? [];   // array of {songId, trackNo}
            if (!$albumId || !$order) jsonResponse(['error' => 'albumId dan order wajib'], 400);

            $stmt = $db->prepare('UPDATE album_songs SET track_no=? WHERE album_id=? AND song_id=?');
            foreach ($order as $item) {
                $stmt->execute([(int)$item['trackNo'], $albumId, $item['songId']]);
            }
            jsonResponse(['success' => true]);
        }

        $id   = $_GET['id'] ?? '';
        $body = getBody();
        if (!$id) jsonResponse(['error' => 'id wajib'], 400);

        $allowed = ['title','type','cover','cover_url','description','year','status'];
        $sets    = [];
        $params  = [];
        foreach ($allowed as $f) {
            $key = $f === 'cover_url' ? 'coverUrl' : $f;
            if (array_key_exists($key, $body)) {
                $sets[]   = "$f = ?";
                $params[] = $body[$key];
            }
        }
        if (!$sets) jsonResponse(['error' => 'Tidak ada field yang diupdate'], 400);

        $params[] = $id;
        $db->prepare('UPDATE albums SET ' . implode(',', $sets) . ' WHERE id=?')->execute($params);

        $stmt = $db->prepare('SELECT * FROM albums WHERE id=?');
        $stmt->execute([$id]);
        $updated = $stmt->fetch();
        jsonResponse(normAlbum($updated, getTracklist($db, $id)));
        break;

    case 'DELETE':

        // Lepas lagu dari album
        if ($action === 'remove_song') {
            $body    = getBody();
            $albumId = trim($body['albumId'] ?? $_GET['album_id'] ?? '');
            $songId  = trim($body['songId']  ?? $_GET['song_id']  ?? '');
            if (!$albumId || !$songId) jsonResponse(['error' => 'albumId dan songId wajib'], 400);

            $db->prepare('DELETE FROM album_songs WHERE album_id=? AND song_id=?')
               ->execute([$albumId, $songId]);
            jsonResponse(['success' => true]);
        }

        $id = $_GET['id'] ?? '';
        if (!$id) jsonResponse(['error' => 'id wajib'], 400);

        $db->prepare('DELETE FROM albums WHERE id=?')->execute([$id]);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
