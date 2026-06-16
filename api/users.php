<?php

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

switch ($method) {

    case 'GET':
        $q     = trim($_GET['q'] ?? '');
        $sql   = 'SELECT id, name, email, role, avatar, joined, status, musisi_id FROM users';
        $params = [];
        if ($q) {
            $sql   .= ' WHERE name LIKE ? OR email LIKE ?';
            $params = ["%$q%", "%$q%"];
        }
        $sql .= ' ORDER BY joined ASC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll();

        $users = array_map(function ($u) {
            return [
                'id'       => $u['id'],
                'name'     => $u['name'],
                'email'    => $u['email'],
                'role'     => $u['role'],
                'avatar'   => $u['avatar'],
                'joined'   => $u['joined'],
                'status'   => $u['status'],
                'musisiId' => $u['musisi_id'],
            ];
        }, $users);

        jsonResponse($users);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) jsonResponse(['error' => 'id wajib diisi'], 400);

        $chk = $db->prepare('SELECT role FROM users WHERE id = ?');
        $chk->execute([$id]);
        $user = $chk->fetch();
        if (!$user) jsonResponse(['error' => 'User tidak ditemukan'], 404);
        if ($user['role'] === 'admin') jsonResponse(['error' => 'Admin tidak bisa dihapus'], 403);

        $db->prepare('DELETE FROM likes WHERE user_id = ?')->execute([$id]);
        $db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
