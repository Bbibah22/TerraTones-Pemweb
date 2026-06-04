<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$action = $_GET['action'] ?? '';

function normGig(array $g, array $lineup = []): array {
    return [
        'id'          => $g['id'],
        'musisiId'    => $g['musisi_id'],
        'musisiName'  => $g['musisi_name'],
        'title'       => $g['title'],
        'venue'       => $g['venue'],
        'kota'        => $g['kota'],
        'provinsi'    => $g['provinsi'] ?? '',
        'genre'       => $g['genre'],
        'date'        => $g['date'],
        'timeStart'   => $g['time_start'] ? substr($g['time_start'], 0, 5) : '19:00',
        'priceMin'    => (int)$g['price_min'],
        'priceMax'    => (int)$g['price_max'],
        'isFree'      => (bool)$g['is_free'],
        'poster'      => $g['poster'],
        'posterUrl'   => $g['poster_url'] ?? null,
        'description' => $g['description'],
        'ticketUrl'   => $g['ticket_url'] ?? null,
        'status'      => $g['status'],
        'goingCount'  => (int)$g['going_count'],
        'lineup'      => $lineup,
        'createdAt'   => $g['created_at'],
    ];
}

function fmtPrice(int $min, int $max, bool $free): string {
    if ($free) return 'Gratis';
    if ($min === $max) return 'Rp ' . number_format($min, 0, ',', '.');
    return 'Rp ' . number_format($min, 0, ',', '.') . ' – Rp ' . number_format($max, 0, ',', '.');
}

function getLineup(PDO $db, string $gigId): array {
    $stmt = $db->prepare(
        'SELECT gl.*, m.cover, m.verified
         FROM gig_lineups gl
         LEFT JOIN musisi m ON gl.musisi_id = m.id
         WHERE gl.gig_id = ?
         ORDER BY gl.order_no ASC'
    );
    $stmt->execute([$gigId]);
    return array_map(fn($r) => [
        'name'      => $r['name'],
        'musisiId'  => $r['musisi_id'],
        'cover'     => $r['cover'] ?? '🎸',
        'verified'  => (bool)($r['verified'] ?? false),
        'orderNo'   => (int)$r['order_no'],
    ], $stmt->fetchAll());
}

switch ($method) {

    case 'GET':

        if ($action === 'check_going') {
            $gigId  = $_GET['gig_id']  ?? '';
            $userId = $_GET['user_id'] ?? '';
            if (!$gigId || !$userId) jsonResponse(['going' => false]);
            $stmt = $db->prepare('SELECT 1 FROM gig_attendees WHERE gig_id=? AND user_id=?');
            $stmt->execute([$gigId, $userId]);
            jsonResponse(['going' => (bool)$stmt->fetch()]);
            break;
        }

        if (!empty($_GET['id'])) {
            $stmt = $db->prepare('SELECT * FROM gigs WHERE id=?');
            $stmt->execute([$_GET['id']]);
            $g = $stmt->fetch();
            if (!$g) jsonResponse(['error' => 'Gig tidak ditemukan'], 404);
            jsonResponse(normGig($g, getLineup($db, $g['id'])));
            break;
        }

        $where  = [];
        $params = [];

        $status = $_GET['status'] ?? 'upcoming';
        if ($status !== 'all') {
            $where[]  = 'g.status = ?';
            $params[] = $status;
        }

        if (!empty($_GET['kota'])) {
            $where[]  = 'g.kota = ?';
            $params[] = $_GET['kota'];
        }

        if (!empty($_GET['provinsi'])) {
            $where[]  = 'g.provinsi = ?';
            $params[] = $_GET['provinsi'];
        }

        if (!empty($_GET['genre'])) {
            $where[]  = 'g.genre = ?';
            $params[] = $_GET['genre'];
        }

        if (isset($_GET['is_free'])) {
            $where[]  = 'g.is_free = ?';
            $params[] = (int)$_GET['is_free'];
        }

        if (!empty($_GET['date_from'])) {
            $where[]  = 'g.date >= ?';
            $params[] = $_GET['date_from'];
        } else {
            $where[]  = 'g.date >= CURDATE()';
        }

        if (!empty($_GET['date_to'])) {
            $where[]  = 'g.date <= ?';
            $params[] = $_GET['date_to'];
        }

        if (!empty($_GET['month'])) {
            $where[]  = 'MONTH(g.date) = ?';
            $params[] = (int)$_GET['month'];
        }

        if (!empty($_GET['q'])) {
            $kw       = '%' . trim($_GET['q']) . '%';
            $where[]  = '(g.title LIKE ? OR g.musisi_name LIKE ? OR g.venue LIKE ? OR g.kota LIKE ?)';
            $params[] = $kw;
            $params[] = $kw;
            $params[] = $kw;
            $params[] = $kw;
        }

        if (!empty($_GET['musisi_id'])) {
            $where[]  = 'g.musisi_id = ?';
            $params[] = $_GET['musisi_id'];
        }

        $sql  = 'SELECT g.* FROM gigs g';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY g.date ASC, g.time_start ASC';

        if (!empty($_GET['limit'])) {
            $sql .= ' LIMIT ' . min((int)$_GET['limit'], 100);
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $result = array_map(fn($g) => normGig($g, getLineup($db, $g['id'])), $rows);

        if (!empty($_GET['with_meta'])) {
            $kotaStmt  = $db->query("SELECT DISTINCT kota FROM gigs WHERE status='upcoming' AND date >= CURDATE() ORDER BY kota");
            $genreStmt = $db->query("SELECT DISTINCT genre FROM gigs WHERE status='upcoming' AND date >= CURDATE() AND genre != '' ORDER BY genre");
            jsonResponse([
                'gigs'   => $result,
                'kota'   => $kotaStmt->fetchAll(PDO::FETCH_COLUMN),
                'genres' => $genreStmt->fetchAll(PDO::FETCH_COLUMN),
            ]);
            break;
        }

        jsonResponse($result);
        break;

    case 'POST':

        if ($action === 'going') {
            $body   = getBody();
            $gigId  = trim($body['gigId']  ?? '');
            $userId = trim($body['userId'] ?? '');
            if (!$gigId || !$userId) jsonResponse(['error' => 'gigId dan userId wajib'], 400);

            $chk = $db->prepare('SELECT 1 FROM gig_attendees WHERE gig_id=? AND user_id=?');
            $chk->execute([$gigId, $userId]);
            $isGoing = (bool)$chk->fetch();

            if ($isGoing) {
                $db->prepare('DELETE FROM gig_attendees WHERE gig_id=? AND user_id=?')->execute([$gigId, $userId]);
                $db->prepare('UPDATE gigs SET going_count = GREATEST(going_count-1,0) WHERE id=?')->execute([$gigId]);
                jsonResponse(['going' => false, 'action' => 'cancel']);
            } else {
                $db->prepare('INSERT IGNORE INTO gig_attendees (gig_id, user_id) VALUES (?,?)')->execute([$gigId, $userId]);
                $db->prepare('UPDATE gigs SET going_count = going_count+1 WHERE id=?')->execute([$gigId]);
                jsonResponse(['going' => true, 'action' => 'going'], 201);
            }
            break;
        }

        $body        = getBody();
        $id          = 'g_' . time() . rand(10, 99);
        $musisiId    = trim($body['musisiId']    ?? '');
        $musisiName  = trim($body['musisiName']  ?? '');
        $title       = trim($body['title']       ?? '');
        $venue       = trim($body['venue']       ?? '');
        $kota        = trim($body['kota']        ?? '');
        $provinsi    = trim($body['provinsi']    ?? '');
        $genre       = trim($body['genre']       ?? '');
        $date        = trim($body['date']        ?? '');
        $timeStart   = trim($body['timeStart']   ?? '19:00');
        $priceMin    = (int)($body['priceMin']   ?? 0);
        $priceMax    = (int)($body['priceMax']   ?? 0);
        $isFree      = !empty($body['isFree']) ? 1 : 0;
        $poster      = trim($body['poster']      ?? '🎸');
        $desc        = trim($body['description'] ?? '');
        $ticketUrl   = trim($body['ticketUrl']   ?? '');
        $submittedBy = trim($body['submittedBy'] ?? '');
        $lineup      = $body['lineup']           ?? [];   // array of {name, musisiId}

        if (!$title || !$venue || !$kota || !$date || !$musisiName) {
            jsonResponse(['error' => 'title, venue, kota, date, dan musisiName wajib diisi'], 400);
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            jsonResponse(['error' => 'Format tanggal harus YYYY-MM-DD'], 400);
        }

        $status = 'upcoming';

        $db->prepare(
            'INSERT INTO gigs (id,musisi_id,musisi_name,title,venue,kota,provinsi,genre,date,time_start,price_min,price_max,is_free,poster,description,ticket_url,status,going_count,submitted_by,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)'
        )->execute([
            $id, $musisiId ?: null, $musisiName, $title, $venue, $kota, $provinsi, $genre,
            $date, $timeStart, $priceMin, $priceMax, $isFree, $poster, $desc,
            $ticketUrl ?: null, $status, $submittedBy ?: null, date('Y-m-d')
        ]);

        if (!empty($lineup)) {
            $lStmt = $db->prepare('INSERT IGNORE INTO gig_lineups (gig_id, musisi_id, name, order_no) VALUES (?,?,?,?)');
            foreach ($lineup as $i => $act) {
                $lStmt->execute([$id, $act['musisiId'] ?: null, $act['name'], $i + 1]);
            }
        }

        $stmt = $db->prepare('SELECT * FROM gigs WHERE id=?');
        $stmt->execute([$id]);
        jsonResponse(normGig($stmt->fetch(), getLineup($db, $id)), 201);
        break;

    case 'PATCH':
        $id   = $_GET['id'] ?? '';
        $body = getBody();
        if (!$id) jsonResponse(['error' => 'id wajib'], 400);

        $allowed = ['title','venue','kota','provinsi','genre','date','time_start','price_min','price_max',
                    'is_free','poster','description','ticket_url','status','going_count'];
        $sets    = [];
        $params  = [];

        $keyMap = [
            'timeStart'  => 'time_start',
            'priceMin'   => 'price_min',
            'priceMax'   => 'price_max',
            'isFree'     => 'is_free',
            'ticketUrl'  => 'ticket_url',
            'goingCount' => 'going_count',
        ];

        foreach ($body as $k => $v) {
            $col = $keyMap[$k] ?? $k;
            if (in_array($col, $allowed)) {
                $sets[]   = "$col = ?";
                $params[] = $v;
            }
        }
        if (!$sets) jsonResponse(['error' => 'Tidak ada field yang diupdate'], 400);

        $params[] = $id;
        $db->prepare('UPDATE gigs SET ' . implode(',', $sets) . ' WHERE id=?')->execute($params);

        $stmt = $db->prepare('SELECT * FROM gigs WHERE id=?');
        $stmt->execute([$id]);
        jsonResponse(normGig($stmt->fetch(), getLineup($db, $id)));
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) jsonResponse(['error' => 'id wajib'], 400);
        $db->prepare('DELETE FROM gigs WHERE id=?')->execute([$id]);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
