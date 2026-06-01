<?php
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'me':
        if (!isset($_SESSION['user'])) {
            jsonResponse(['error' => 'Belum login'], 401);
        }
        jsonResponse($_SESSION['user']);
        break;
    case 'login':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $body = getBody();
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $role     = $body['role'] ?? '';

        if (!$email || !$password) {
            jsonResponse(['error' => 'Email dan password wajib diisi'], 400);
        }

        $db = getDB();
        $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || $user['password'] !== $password) {
            jsonResponse(['error' => 'Email atau password salah'], 401);
        }
        if ($user['status'] !== 'active') {
            jsonResponse(['error' => 'Akun belum aktif atau diblokir'], 403);
        }
        if ($role && $user['role'] !== $role) {
            jsonResponse(['error' => 'Role tidak sesuai! Pilih tab yang tepat.'], 403);
        }

        unset($user['password']); 
        $_SESSION['user'] = $user;
        jsonResponse($user);
        break;

    case 'logout':
        session_destroy();
        jsonResponse(['success' => true]);
        break;

    case 'register':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $body = getBody();

        $name     = trim($body['name'] ?? '');
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $role     = $body['role'] ?? 'user';

        if (!$name || !$email || !$password) {
            jsonResponse(['error' => 'Nama, email, dan password wajib diisi'], 400);
        }
        if (strlen($password) < 6) {
            jsonResponse(['error' => 'Password minimal 6 karakter'], 400);
        }
        if (!in_array($role, ['user', 'musisi'])) {
            jsonResponse(['error' => 'Role tidak valid'], 400);
        }

        $db = getDB();

        $chk = $db->prepare('SELECT id FROM users WHERE email = ?');
        $chk->execute([$email]);
        if ($chk->fetch()) {
            jsonResponse(['error' => 'Email sudah terdaftar'], 409);
        }

        $userId   = 'u_' . time() . rand(100, 999);
        $avatar   = $role === 'musisi' ? '🎸' : '🎧';
        $joined   = date('Y-m-d');
        $status   = 'active';
        $musisiId = null;

        if ($role === 'musisi') {
            $stageName = trim($body['stage_name'] ?? $name);
            $genre     = trim($body['genre'] ?? '');
            $kota      = trim($body['kota'] ?? '');

            if (!$stageName || !$genre || !$kota) {
                jsonResponse(['error' => 'Data musisi (nama panggung, genre, kota) wajib diisi'], 400);
            }

            $musisiId = 'ms_' . time() . rand(100, 999);
            $insMusisi = $db->prepare(
                'INSERT INTO musisi (id, user_id, name, genre, kota, bio, followers, songs_count, verified, cover, streams)
                 VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 0)'
            );
            $insMusisi->execute([$musisiId, $userId, $stageName, $genre, $kota, '', '🎵']);
        }

        $insUser = $db->prepare(
            'INSERT INTO users (id, name, email, password, role, avatar, joined, status, musisi_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $insUser->execute([$userId, $name, $email, $password, $role, $avatar, $joined, $status, $musisiId]);

        $newUser = [
            'id'        => $userId,
            'name'      => $name,
            'email'     => $email,
            'role'      => $role,
            'avatar'    => $avatar,
            'joined'    => $joined,
            'status'    => $status,
            'musisi_id' => $musisiId,
        ];
        $_SESSION['user'] = $newUser;
        jsonResponse($newUser, 201);
        break;

    default:
        jsonResponse(['error' => 'Action tidak dikenal'], 400);
}
