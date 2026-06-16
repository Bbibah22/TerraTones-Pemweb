<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

switch ($method) {

    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare('SELECT * FROM musisi WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $m = $stmt->fetch();
            if (!$m) jsonResponse(['error' => 'Musisi tidak ditemukan'], 404);
            jsonResponse(normMusisi($m));
        } else {
            $where  = [];
            $params = [];
            if (!empty($_GET['q'])) {
                $kw       = '%' . trim($_GET['q']) . '%';
                $where[]  = '(name LIKE ? OR genre LIKE ? OR kota LIKE ? OR provinsi LIKE ?)';
                $params[] = $kw;
                $params[] = $kw;
                $params[] = $kw;
                $params[] = $kw;
            }
            $sql = 'SELECT * FROM musisi';
            if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
            $sql .= !empty($_GET['q']) ? ' ORDER BY streams DESC LIMIT 10' : ' ORDER BY streams DESC';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            jsonResponse(array_map('normMusisi', $stmt->fetchAll()));
        }
        break;

    case 'PATCH':
        $id   = $_GET['id'] ?? '';
        $body = getBody();
        if (!$id) jsonResponse(['error' => 'id wajib diisi'], 400);

        $allowed = ['name','genre','kota','provinsi','bio','cover','verified','followers','songs_count','streams','youtube_url',
                    'pk_tagline','pk_bio_short','pk_bio_long','pk_formed_year','pk_origin','pk_members',
                    'pk_contact_booking','pk_contact_media',
                    'pk_social_instagram','pk_social_tiktok','pk_social_spotify','pk_social_youtube',
                    'pk_rider_notes','pk_is_published'];
        $sets    = [];
        $params  = [];

        $keyMap  = [
            'songs'              => 'songs_count',
            'youtubeUrl'         => 'youtube_url',
            'pkTagline'          => 'pk_tagline',
            'pkBioShort'         => 'pk_bio_short',
            'pkBioLong'          => 'pk_bio_long',
            'pkFormedYear'       => 'pk_formed_year',
            'pkOrigin'           => 'pk_origin',
            'pkMembers'          => 'pk_members',
            'pkContactBooking'   => 'pk_contact_booking',
            'pkContactMedia'     => 'pk_contact_media',
            'pkSocialInstagram'  => 'pk_social_instagram',
            'pkSocialTiktok'     => 'pk_social_tiktok',
            'pkSocialSpotify'    => 'pk_social_spotify',
            'pkSocialYoutube'    => 'pk_social_youtube',
            'pkRiderNotes'       => 'pk_rider_notes',
            'pkIsPublished'      => 'pk_is_published',
        ];

        foreach ($body as $key => $val) {
            $col = $keyMap[$key] ?? $key;
            if (!in_array($col, $allowed)) continue;
            if ($col === 'pk_members' && is_array($val)) $val = json_encode($val, JSON_UNESCAPED_UNICODE);
            $sets[]   = "$col = ?";
            $params[] = $val;
        }
        if (!$sets) jsonResponse(['error' => 'Tidak ada field yang diupdate'], 400);

        $params[] = $id;
        $db->prepare('UPDATE musisi SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);

        $upd = $db->prepare('SELECT * FROM musisi WHERE id = ?');
        $upd->execute([$id]);
        jsonResponse(normMusisi($upd->fetch()));
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) jsonResponse(['error' => 'id wajib diisi'], 400);
        $db->prepare('DELETE FROM musisi WHERE id = ?')->execute([$id]);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

function normMusisi(array $m): array {
    $members = [];
    if (!empty($m['pk_members'])) {
        $members = json_decode($m['pk_members'], true) ?: [];
    }
    return [
        'id'         => $m['id'],
        'userId'     => $m['user_id'],
        'name'       => $m['name'],
        'genre'      => $m['genre'],
        'kota'       => $m['kota'],
        'provinsi'   => $m['provinsi'] ?? '',
        'bio'        => $m['bio'],
        'followers'  => (int)$m['followers'],
        'songs'      => (int)$m['songs_count'],
        'verified'   => (bool)$m['verified'],
        'cover'      => $m['cover'],
        'streams'    => (int)$m['streams'],
        'youtubeUrl' => $m['youtube_url'] ?? null,
        'pressKit' => [
            'tagline'          => $m['pk_tagline']          ?? null,
            'bioShort'         => $m['pk_bio_short']        ?? null,
            'bioLong'          => $m['pk_bio_long']         ?? null,
            'formedYear'       => $m['pk_formed_year']      ?? null,
            'origin'           => $m['pk_origin']           ?? null,
            'members'          => $members,
            'contactBooking'   => $m['pk_contact_booking']  ?? null,
            'contactMedia'     => $m['pk_contact_media']    ?? null,
            'socialInstagram'  => $m['pk_social_instagram'] ?? null,
            'socialTiktok'     => $m['pk_social_tiktok']    ?? null,
            'socialSpotify'    => $m['pk_social_spotify']   ?? null,
            'socialYoutube'    => $m['pk_social_youtube']   ?? null,
            'riderNotes'       => $m['pk_rider_notes']      ?? null,
            'isPublished'      => (bool)($m['pk_is_published'] ?? false),
        ],
    ];
}
