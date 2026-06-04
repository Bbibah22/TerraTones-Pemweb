<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

switch ($method) {
    case 'GET':

        $userId   = trim($_GET['user_id']   ?? '');
        $musisiId = trim($_GET['musisi_id'] ?? '');

        if (!$userId) jsonResponse(['error' => 'user_id wajib'], 400);

        if (!empty($_GET['feed'])) {
            $limit  = min((int)($_GET['limit'] ?? 30), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $stmt = $db->prepare('SELECT musisi_id FROM follows WHERE user_id = ?');
            $stmt->execute([$userId]);
            $followedIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (empty($followedIds)) {
                jsonResponse(['songs' => [], 'following' => 0, 'isEmpty' => true]);
                break;
            }

            $in   = implode(',', array_fill(0, count($followedIds), '?'));
            $stmt = $db->prepare(
                "SELECT s.*, f.created_at as followed_at
                 FROM songs s
                 JOIN follows f ON s.musisi_id = f.musisi_id AND f.user_id = ?
                 WHERE s.musisi_id IN ($in)
                   AND s.status = 'published'
                 ORDER BY s.uploaded DESC, s.streams DESC
                 LIMIT ? OFFSET ?"
            );
            $params = array_merge([$userId], $followedIds, [$limit, $offset]);
            $stmt->execute($params);
            $songs = $stmt->fetchAll();

            jsonResponse([
                'songs'     => array_map(fn($s) => [
                    'id'         => $s['id'],
                    'title'      => $s['title'],
                    'musisiId'   => $s['musisi_id'],
                    'musisiName' => $s['musisi_name'],
                    'genre'      => $s['genre'],
                    'duration'   => $s['duration'],
                    'streams'    => (int)$s['streams'],
                    'likes'      => (int)$s['likes'],
                    'status'     => $s['status'],
                    'uploaded'   => $s['uploaded'],
                    'cover'      => $s['cover'],
                    'fileUrl'    => $s['file_url'] ?? null,
                    'youtubeUrl' => $s['youtube_url'] ?? null,
                ], $songs),
                'following' => count($followedIds),
                'isEmpty'   => false,
            ]);
            break;
        }

        if ($musisiId) {
            $stmt = $db->prepare('SELECT 1 FROM follows WHERE user_id=? AND musisi_id=?');
            $stmt->execute([$userId, $musisiId]);
            jsonResponse(['following' => (bool)$stmt->fetch()]);
            break;
        }

        $stmt = $db->prepare(
            'SELECT m.*, f.created_at as followed_at,
                    (SELECT COUNT(*) FROM songs WHERE musisi_id=m.id AND status="published") as song_count
             FROM musisi m
             JOIN follows f ON m.id = f.musisi_id
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC'
        );
        $stmt->execute([$userId]);
        $list = $stmt->fetchAll();

        jsonResponse(array_map(fn($m) => [
            'id'         => $m['id'],
            'name'       => $m['name'],
            'genre'      => $m['genre'],
            'kota'       => $m['kota'],
            'provinsi'   => $m['provinsi'] ?? '',
            'cover'      => $m['cover'],
            'verified'   => (bool)$m['verified'],
            'followers'  => (int)$m['followers'],
            'songs'      => (int)($m['song_count'] ?? $m['songs_count']),
            'streams'    => (int)$m['streams'],
            'followedAt' => $m['followed_at'],
        ], $list));
        break;

    case 'POST':
        $body     = getBody();
        $userId   = trim($body['userId']   ?? '');
        $musisiId = trim($body['musisiId'] ?? '');

        if (!$userId || !$musisiId) jsonResponse(['error' => 'userId dan musisiId wajib'], 400);

        $chk = $db->prepare('SELECT 1 FROM follows WHERE user_id=? AND musisi_id=?');
        $chk->execute([$userId, $musisiId]);
        $isFollowing = (bool)$chk->fetch();

        if ($isFollowing) {
            $db->prepare('DELETE FROM follows WHERE user_id=? AND musisi_id=?')
               ->execute([$userId, $musisiId]);
            $db->prepare('UPDATE musisi SET followers = GREATEST(followers-1,0) WHERE id=?')
               ->execute([$musisiId]);
            jsonResponse(['following' => false, 'action' => 'unfollow']);
        } else {
            $db->prepare('INSERT IGNORE INTO follows (user_id, musisi_id) VALUES (?,?)')
               ->execute([$userId, $musisiId]);
            $db->prepare('UPDATE musisi SET followers = followers+1 WHERE id=?')
               ->execute([$musisiId]);
            jsonResponse(['following' => true, 'action' => 'follow'], 201);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
