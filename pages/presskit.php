<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<?php

require_once __DIR__ . '/../config/db.php';

$musisiId = trim($_GET['id'] ?? '');
$musisi   = null;
$songs    = [];
$gigs     = [];

if ($musisiId) {
    $db = getDB();

    
    $stmt = $db->prepare('SELECT * FROM musisi WHERE id = ?');
    $stmt->execute([$musisiId]);
    $musisi = $stmt->fetch();

    if ($musisi && $musisi['pk_is_published']) {
        
        $stmt = $db->prepare(
            'SELECT * FROM songs WHERE musisi_id = ? AND status = "published"
             ORDER BY streams DESC LIMIT 5'
        );
        $stmt->execute([$musisiId]);
        $songs = $stmt->fetchAll();

        
        $stmt = $db->prepare(
            'SELECT * FROM gigs WHERE musisi_id = ? AND status = "upcoming" AND date >= CURDATE()
             ORDER BY date ASC LIMIT 3'
        );
        $stmt->execute([$musisiId]);
        $gigs = $stmt->fetchAll();

        
        $members = [];
        if (!empty($musisi['pk_members'])) {
            $members = json_decode($musisi['pk_members'], true) ?: [];
        }
    }
}


function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

$name     = $musisi ? e($musisi['name'])               : 'Musisi tidak ditemukan';
$genre    = $musisi ? e($musisi['genre'])              : '';
$kota     = $musisi ? e($musisi['kota'])               : '';
$provinsi = $musisi ? e($musisi['provinsi'] ?? '')     : '';
$cover    = $musisi ? $musisi['cover']                 : '🎸';
$tagline  = $musisi ? e($musisi['pk_tagline']  ?? '')  : '';
$bioShort = $musisi ? nl2br(e($musisi['pk_bio_short'] ?? $musisi['bio'] ?? '')) : '';
$bioLong  = $musisi ? nl2br(e($musisi['pk_bio_long']  ?? ''))  : '';
$origin   = $musisi ? e($musisi['pk_origin']   ?? $musisi['kota'] ?? '') : '';
$formed   = $musisi ? e($musisi['pk_formed_year'] ?? '')   : '';
$booking  = $musisi ? e($musisi['pk_contact_booking'] ?? '') : '';
$media    = $musisi ? e($musisi['pk_contact_media']   ?? '') : '';
$instagram= $musisi ? e($musisi['pk_social_instagram'] ?? ''): '';
$tiktok   = $musisi ? e($musisi['pk_social_tiktok']   ?? '') : '';
$spotify  = $musisi ? e($musisi['pk_social_spotify']  ?? '') : '';
$ytSocial = $musisi ? e($musisi['pk_social_youtube']  ?? '') : '';
$rider    = $musisi ? nl2br(e($musisi['pk_rider_notes'] ?? '')) : '';
$verified = $musisi && $musisi['verified'];
$followers= $musisi ? number_format((int)$musisi['followers']) : '0';
$streams  = $musisi ? number_format((int)$musisi['streams'])   : '0';

$pageUrl  = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
?>
  
  <meta property="og:type"        content="profile"/>
  <meta property="og:url"         content="<?= $pageUrl ?>"/>
  <meta property="og:title"       content="<?= $name ?> — Press Kit | TerraTones"/>
  <meta property="og:description" content="<?= $tagline ?: "$name adalah musisi $genre dari $kota, Indonesia." ?>"/>
  <meta property="og:site_name"   content="TerraTones — Musik Lokal Indonesia"/>
  <meta name="twitter:card"       content="summary"/>
  <meta name="twitter:title"      content="<?= $name ?> — Press Kit"/>
  <meta name="twitter:description"content="<?= $tagline ?>"/>

  <title><?= $name ?> — Press Kit | TerraTones</title>

  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>

  <script>tailwind.config={ theme:{ extend:{ colors:{ brand:'#7B5CFA' } } } }</script>
  <style>
    *{font-family:'Inter',sans-serif}
    body{background:#F8F7FF;color:#1a1a2e}
    .syne{font-family:'Syne',sans-serif}
    .card{background:#fff;border:0.5px solid #E8E6FF;border-radius:16px;padding:28px 32px}
    .section-title{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#7B5CFA;margin-bottom:12px}
    .badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:4px 12px;border-radius:99px}
    .badge-verified{background:#EAF3FF;color:#1d4ed8}
    .badge-genre{background:#F0EEFF;color:#5B3FCC}
    .pill{display:inline-block;font-size:12px;padding:4px 12px;border-radius:99px;background:#F0EEFF;color:#5B3FCC;font-weight:500}
    .social-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:12px;font-size:13px;font-weight:500;transition:all .15s;text-decoration:none}
    .song-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:0.5px solid #F0EEFF}
    .song-row:last-child{border-bottom:none}
    .gig-row{background:#F8F7FF;border-radius:12px;padding:14px 16px;margin-bottom:8px}
    .member-card{background:#F8F7FF;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px}
    .print-btn{position:fixed;bottom:24px;right:24px;background:#7B5CFA;color:#fff;border:none;border-radius:16px;padding:12px 20px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(123,92,250,.35);display:flex;align-items:center;gap:8px;transition:all .2s}
    .print-btn:hover{opacity:.9;transform:translateY(-1px)}
    @media print{
      .print-btn,.no-print{display:none!important}
      body{background:#fff}
      .card{border:1px solid #ddd;box-shadow:none;break-inside:avoid}
    }
    @media(max-width:768px){.card{padding:20px}}
  </style>
</head>
<body class="min-h-screen">

<?php if (!$musisi || !$musisi['pk_is_published']): ?>

<div class="min-h-screen flex items-center justify-center p-6">
  <div class="text-center max-w-sm">
    <div class="text-6xl mb-4"><?= $musisi ? '🔒' : '🎸' ?></div>
    <h1 class="text-2xl font-bold text-gray-800 mb-2">
      <?= $musisi ? 'Press kit belum dipublikasikan' : 'Musisi tidak ditemukan' ?>
    </h1>
    <p class="text-gray-500 text-sm mb-6">
      <?= $musisi
        ? 'Musisi ini belum mengaktifkan press kit publik mereka.'
        : 'Link mungkin sudah tidak valid.' ?>
    </p>
    <a href="../index.html" class="inline-flex items-center gap-2 bg-brand text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition">
      <i class="fa-solid fa-home"></i> Kembali ke TerraTones
    </a>
  </div>
</div>
<?php else: ?>

<div class="max-w-4xl mx-auto px-4 py-10 space-y-6">

  
  <div class="flex items-center justify-between mb-2 no-print">
    <a href="../index.html" class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
        <i class="fa-solid fa-music text-white text-sm"></i>
      </div>
      <span class="syne font-bold text-gray-800">Terra<span class="text-brand">Tones</span></span>
    </a>
    <span class="text-xs text-gray-400">Press Kit · Dipublikasikan via TerraTones</span>
  </div>


  <div class="card" style="background:linear-gradient(135deg,#F0EEFF 0%,#fff 60%)">
    <div class="flex flex-col md:flex-row items-start gap-8">
      <!-- Cover / avatar besar -->
      <div class="w-28 h-28 md:w-36 md:h-36 rounded-3xl flex items-center justify-center text-7xl md:text-8xl flex-shrink-0"
           style="background:linear-gradient(135deg,rgba(123,92,250,.15),rgba(123,92,250,.05))">
        <?= $cover ?>
      </div>

      <div class="flex-1 min-w-0">
        
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <h1 class="syne text-3xl font-bold text-gray-900"><?= $name ?></h1>
          <?php if ($verified): ?>
          <span class="badge badge-verified"><i class="fa-solid fa-circle-check text-xs"></i> Terverifikasi</span>
          <?php endif; ?>
        </div>

        
        <?php if ($tagline): ?>
        <p class="text-lg text-brand font-medium mb-3 italic">"<?= $tagline ?>"</p>
        <?php endif; ?>

       
        <div class="flex flex-wrap gap-2 mb-4">
          <?php if ($genre):   ?><span class="pill"><i class="fa-solid fa-music mr-1 text-xs"></i><?= $genre ?></span><?php endif; ?>
          <?php if ($origin):  ?><span class="pill"><i class="fa-solid fa-location-dot mr-1 text-xs"></i><?= $origin ?><?= $provinsi ? ", $provinsi" : '' ?></span><?php endif; ?>
          <?php if ($formed):  ?><span class="pill"><i class="fa-solid fa-calendar mr-1 text-xs"></i>Berdiri <?= $formed ?></span><?php endif; ?>
        </div>

      
        <div class="flex gap-6 text-center">
          <div>
            <div class="text-xl font-bold text-gray-900"><?= $followers ?></div>
            <div class="text-xs text-gray-400 mt-0.5">Fans</div>
          </div>
          <div class="w-px bg-gray-100"></div>
          <div>
            <div class="text-xl font-bold text-gray-900"><?= count($songs) ?></div>
            <div class="text-xs text-gray-400 mt-0.5">Lagu Rilis</div>
          </div>
          <div class="w-px bg-gray-100"></div>
          <div>
            <div class="text-xl font-bold text-gray-900"><?= $streams ?></div>
            <div class="text-xs text-gray-400 mt-0.5">Total Stream</div>
          </div>
        </div>
      </div>
    </div>
  </div>

 
  <div class="grid md:grid-cols-2 gap-6">

   
    <?php if ($bioShort): ?>
    <div class="card">
      <div class="section-title">Biografi Singkat</div>
      <p class="text-gray-700 text-sm leading-relaxed"><?= $bioShort ?></p>
    </div>
    <?php endif; ?>

    
    <?php if (!empty($members)): ?>
    <div class="card">
      <div class="section-title">Anggota</div>
      <div class="space-y-2">
        <?php foreach ($members as $m): ?>
        <div class="member-card">
          <div class="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-xl flex-shrink-0">
            <?= !empty($m['emoji']) ? e($m['emoji']) : '🎵' ?>
          </div>
          <div>
            <div class="font-semibold text-gray-900 text-sm"><?= e($m['name'] ?? '') ?></div>
            <div class="text-xs text-gray-500"><?= e($m['role'] ?? '') ?><?= !empty($m['instrument']) ? ' · ' . e($m['instrument']) : '' ?></div>
          </div>
        </div>
        <?php endforeach; ?>
      </div>
    </div>
    <?php endif; ?>

  </div>

  
  <?php if ($bioLong): ?>
  <div class="card">
    <div class="section-title">Biografi Lengkap</div>
    <div class="text-gray-700 text-sm leading-relaxed prose max-w-none"><?= $bioLong ?></div>
  </div>
  <?php endif; ?>

  
  <div class="grid md:grid-cols-2 gap-6">

    <?php if (!empty($songs)): ?>
    <div class="card">
      <div class="section-title">Lagu Unggulan</div>
      <?php foreach ($songs as $i => $s): ?>
      <div class="song-row">
        <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
             style="background:#F0EEFF;color:#7B5CFA"><?= $i+1 ?></div>
        <div class="text-lg flex-shrink-0"><?= e($s['cover']) ?></div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-900 truncate"><?= e($s['title']) ?></div>
          <div class="text-xs text-gray-400"><?= e($s['genre']) ?> · <?= e($s['duration']) ?></div>
        </div>
        <div class="text-xs text-gray-400 flex-shrink-0">
          <?= number_format((int)$s['streams']) ?> <span class="text-gray-300">stream</span>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
    <?php endif; ?>

  
    <?php if (!empty($gigs)): ?>
    <div class="card">
      <div class="section-title">Jadwal Tampil</div>
      <?php
        $months = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
        foreach ($gigs as $g):
          $d      = new DateTime($g['date']);
          $dateStr= $d->format('d') . ' ' . $months[(int)$d->format('m')] . ' ' . $d->format('Y');
      ?>
      <div class="gig-row">
        <div class="flex items-start gap-3">
          <span class="text-2xl"><?= $g['poster'] ?></span>
          <div class="flex-1">
            <div class="font-semibold text-gray-900 text-sm"><?= e($g['title']) ?></div>
            <div class="text-xs text-gray-500 mt-0.5">
              <i class="fa-solid fa-location-dot mr-1 text-brand/60"></i><?= e($g['venue']) ?>, <?= e($g['kota']) ?>
            </div>
            <div class="text-xs text-brand font-medium mt-1">
              <i class="fa-regular fa-calendar mr-1"></i><?= $dateStr ?> · <?= substr($g['time_start'], 0, 5) ?>
            </div>
          </div>
          <?php if ($g['is_free']): ?>
          <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">Gratis</span>
          <?php elseif ($g['ticket_url']): ?>
          <a href="<?= e($g['ticket_url']) ?>" target="_blank"
             class="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full flex-shrink-0 hover:bg-brand/20 transition">Tiket</a>
          <?php endif; ?>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
    <?php endif; ?>

  </div>


  <?php if ($rider): ?>
  <div class="card">
    <div class="section-title">Technical Rider</div>
    <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-line"><?= $rider ?></p>
    <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700">
      <i class="fa-solid fa-triangle-exclamation mr-1.5"></i>
      Untuk detail rider lengkap dan hospitality, hubungi tim manajemen melalui kontak booking di bawah.
    </div>
  </div>
  <?php endif; ?>

 
  <div class="grid md:grid-cols-2 gap-6">

   
    <?php if ($booking || $media): ?>
    <div class="card">
      <div class="section-title">Kontak</div>
      <div class="space-y-3">
        <?php if ($booking): ?>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-briefcase text-brand text-sm"></i>
          </div>
          <div>
            <div class="text-xs text-gray-400 mb-0.5">Booking & Manajemen</div>
            <a href="mailto:<?= $booking ?>" class="text-sm font-medium text-brand hover:underline"><?= $booking ?></a>
          </div>
        </div>
        <?php endif; ?>
        <?php if ($media): ?>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-newspaper text-blue-500 text-sm"></i>
          </div>
          <div>
            <div class="text-xs text-gray-400 mb-0.5">Media & Press</div>
            <a href="mailto:<?= $media ?>" class="text-sm font-medium text-blue-600 hover:underline"><?= $media ?></a>
          </div>
        </div>
        <?php endif; ?>
      </div>
    </div>
    <?php endif; ?>

   
    <?php if ($instagram || $tiktok || $spotify || $ytSocial): ?>
    <div class="card">
      <div class="section-title">Media Sosial</div>
      <div class="flex flex-wrap gap-2">
        <?php if ($instagram): ?>
        <a href="<?= $instagram ?>" target="_blank" rel="noopener"
           class="social-btn bg-pink-50 text-pink-600 hover:bg-pink-100">
          <i class="fa-brands fa-instagram"></i> Instagram
        </a>
        <?php endif; ?>
        <?php if ($tiktok): ?>
        <a href="<?= $tiktok ?>" target="_blank" rel="noopener"
           class="social-btn bg-gray-100 text-gray-800 hover:bg-gray-200">
          <i class="fa-brands fa-tiktok"></i> TikTok
        </a>
        <?php endif; ?>
        <?php if ($spotify): ?>
        <a href="<?= $spotify ?>" target="_blank" rel="noopener"
           class="social-btn bg-green-50 text-green-700 hover:bg-green-100">
          <i class="fa-brands fa-spotify"></i> Spotify
        </a>
        <?php endif; ?>
        <?php if ($ytSocial): ?>
        <a href="<?= $ytSocial ?>" target="_blank" rel="noopener"
           class="social-btn bg-red-50 text-red-600 hover:bg-red-100">
          <i class="fa-brands fa-youtube"></i> YouTube
        </a>
        <?php endif; ?>
      </div>
    </div>
    <?php endif; ?>

  </div>


  <div class="text-center py-6 border-t border-gray-100">
    <p class="text-xs text-gray-400 mb-2">
      Press kit ini dibuat dan dikelola oleh <strong><?= $name ?></strong> melalui
      <a href="../index.html" class="text-brand hover:underline font-medium">TerraTones</a>
      — Platform Musik Lokal Indonesia
    </p>
    <p class="text-xs text-gray-300">Terakhir diperbarui: <?= date('d M Y') ?></p>
  </div>

</div>


<button class="print-btn no-print" onclick="window.print()">
  <i class="fa-solid fa-print"></i> Cetak / Simpan PDF
</button>

<?php endif; ?>
</body>
</html>
