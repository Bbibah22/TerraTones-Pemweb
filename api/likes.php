<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

switch ($method) {

    case 'GET':
        $userId = $_GET['user_id'] ?? '';
        if (!$userId) jsonResponse(['error' => 'user_id wajib diisi'], 400);

        $stmt = $db->prepare('SELECT song_id FROM likes WHERE user_id = ?');
        $stmt->execute([$userId]);
        $songIds = array_column($stmt->fetchAll(), 'song_id');
        jsonResponse($songIds);
        break;

    case 'POST':
        $body   = getBody();
        $userId = $body['userId'] ?? '';
        $songId = $body['songId'] ?? '';
        if (!$userId || !$songId) jsonResponse(['error' => 'userId dan songId wajib diisi'], 400);

        $chk = $db->prepare('SELECT 1 FROM likes WHERE user_id = ? AND song_id = ?');
        $chk->execute([$userId, $songId]);
        $exists = (bool)$chk->fetch();

        if ($exists) {
            $db->prepare('DELETE FROM likes WHERE user_id = ? AND song_id = ?')
               ->execute([$userId, $songId]);
            $db->prepare('UPDATE songs SET likes = GREATEST(0, likes - 1) WHERE id = ?')
               ->execute([$songId]);
            $liked = false;
        } else {
            $db->prepare('INSERT INTO likes (user_id, song_id) VALUES (?, ?)')
               ->execute([$userId, $songId]);
            $db->prepare('UPDATE songs SET likes = likes + 1 WHERE id = ?')
               ->execute([$songId]);
            $liked = true;
        }

        $cnt = $db->prepare('SELECT likes FROM songs WHERE id = ?');
        $cnt->execute([$songId]);
        $row = $cnt->fetch();

        jsonResponse(['liked' => $liked, 'newCount' => (int)($row['likes'] ?? 0)]);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
