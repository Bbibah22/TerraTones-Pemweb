<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

  <?php
  // ============================================================
  // pages/lagu.php — Halaman publik lagu (tanpa login)
  // URL: /pages/lagu.php?id=SONG_ID
  // Digunakan untuk share ke media sosial dengan OG meta tags
  // ============================================================
  require_once __DIR__ . '/../config/db.php';

  $songId = trim($_GET['id'] ?? '');
  $song   = null;
  $musisi = null;

  if ($songId) {
      $db   = getDB();
      $stmt = $db->prepare('SELECT * FROM songs WHERE id = ? AND status = "published"');
      $stmt->execute([$songId]);
      $song = $stmt->fetch();

      if ($song) {
          $stmt2 = $db->prepare('SELECT * FROM musisi WHERE id = ?');
          $stmt2->execute([$song['musisi_id']]);
          $musisi = $stmt2->fetch();

          // Increment stream view (halaman publik = 1 view)
          $db->prepare('UPDATE songs SET streams = streams + 1 WHERE id = ?')->execute([$songId]);
      }
  }

  $title    = $song ? htmlspecialchars($song['title'])       : 'Lagu tidak ditemukan';
  $artist   = $song ? htmlspecialchars($song['musisi_name']) : '';
  $genre    = $song ? htmlspecialchars($song['genre'])       : '';
  $desc     = $song ? htmlspecialchars($song['description'] ?: "Dengarkan $title oleh $artist di TerraTones — Platform Musik Lokal Indonesia.") : 'Lagu tidak ditemukan di TerraTones.';
  $cover    = $song ? $song['cover'] : '🎵';
  $duration = $song ? htmlspecialchars($song['duration'])    : '';
  $streams  = $song ? number_format((int)$song['streams'])   : '0';
  $fileUrl  = $song ? ($song['file_url']    ?? '') : '';
  $ytUrl    = $song ? ($song['youtube_url'] ?? '') : '';

  $pageUrl  = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
  $siteUrl  = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/');
  ?>

  <!-- OG Meta Tags untuk preview di WhatsApp, Twitter, dll -->
  <meta property="og:type"        content="music.song"/>
  <meta property="og:url"         content="<?= $pageUrl ?>"/>
  <meta property="og:title"       content="<?= $title ?> — <?= $artist ?>"/>
  <meta property="og:description" content="<?= $desc ?>"/>
  <meta property="og:site_name"   content="TerraTones — Musik Lokal Indonesia"/>

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary"/>
  <meta name="twitter:title"       content="<?= $title ?> — <?= $artist ?>"/>
  <meta name="twitter:description" content="<?= $desc ?>"/>

  <title><?= $title ?><?= $artist ? " — $artist" : '' ?> | TerraTones</title>

  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>

  <script>tailwind.config = { theme: { extend: { colors: { brand: '#7B5CFA' } } } }</script>
  <style>
    body { background: #0A0A14; font-family: 'Inter', sans-serif; }
    .glass { background: rgba(255,255,255,.04); backdrop-filter: blur(12px); border: 0.5px solid rgba(255,255,255,.08); }
    .glow  { box-shadow: 0 0 60px rgba(123,92,250,.2); }
    audio::-webkit-media-controls-panel { background: #1a1a2e; }
  </style>
</head>
<body class="min-h-screen flex flex-col items-center justify-center p-6">

  <!-- Background blur -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-brand/10 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
  </div>

  <!-- Logo -->
  <a href="../index.html" class="flex items-center gap-3 mb-10 relative z-10">
    <div class="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
      <i class="fa-solid fa-music text-white text-sm"></i>
    </div>
    <span style="font-family:Syne" class="font-bold text-white text-lg">Terra<span class="text-brand">Tones</span></span>
  </a>

  <?php if ($song): ?>
  <!-- Song Card -->
  <div class="glass rounded-3xl p-8 w-full max-w-md relative z-10 glow">

    <!-- Cover -->
    <div class="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand/30 to-purple-500/20 flex items-center justify-center text-7xl mx-auto mb-6 shadow-xl">
      <?= $cover ?>
    </div>

    <!-- Info -->
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-white mb-1"><?= $title ?></h1>
      <p class="text-brand font-semibold mb-1"><?= $artist ?></p>
      <div class="flex items-center justify-center gap-3 text-xs text-gray-500">
        <span><?= $genre ?></span>
        <?php if ($duration): ?><span>·</span><span><?= $duration ?></span><?php endif; ?>
        <span>·</span><span><?= $streams ?> stream</span>
      </div>
      <?php if ($song['description']): ?>
      <p class="text-gray-400 text-sm mt-4 leading-relaxed"><?= htmlspecialchars($song['description']) ?></p>
      <?php endif; ?>
    </div>

    <!-- Player -->
    <?php if ($fileUrl): ?>
    <div class="mb-6">
      <audio controls class="w-full rounded-xl" style="height:48px;">
        <source src="../<?= htmlspecialchars($fileUrl) ?>" type="audio/mpeg"/>
        Browser kamu tidak mendukung audio player.
      </audio>
    </div>
    <?php elseif ($ytUrl): ?>
    <div class="mb-6 rounded-2xl overflow-hidden" style="padding-top:56.25%;position:relative;">
      <?php
        // Ekstrak YouTube video ID
        preg_match('/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $ytUrl, $m);
        $ytId = $m[1] ?? '';
      ?>
      <?php if ($ytId): ?>
      <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;"
        src="https://www.youtube.com/embed/<?= $ytId ?>?autoplay=0"
        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
      <?php endif; ?>
    </div>
    <?php else: ?>
    <div class="mb-6 bg-white/5 rounded-2xl p-4 text-center text-gray-500 text-sm">
      <i class="fa-solid fa-headphones text-brand text-2xl block mb-2"></i>
      Buka di TerraTones untuk mendengarkan lagu ini
    </div>
    <?php endif; ?>

    <!-- Share buttons -->
    <div class="grid grid-cols-4 gap-2 mb-6">
      <a href="https://wa.me/?text=<?= urlencode("Dengerin lagu \"$title\" oleh $artist di TerraTones 🎵\n$pageUrl") ?>"
        target="_blank" rel="noopener"
        class="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-green-500/10 hover:bg-green-500/20 transition text-green-400">
        <i class="fa-brands fa-whatsapp text-lg"></i>
        <span class="text-[10px]">WhatsApp</span>
      </a>
      <a href="https://twitter.com/intent/tweet?text=<?= urlencode("Lagi dengerin \"$title\" oleh $artist 🎵") ?>&url=<?= urlencode($pageUrl) ?>"
        target="_blank" rel="noopener"
        class="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 transition text-sky-400">
        <i class="fa-brands fa-x-twitter text-lg"></i>
        <span class="text-[10px]">X / Twitter</span>
      </a>
      <a href="https://t.me/share/url?url=<?= urlencode($pageUrl) ?>&text=<?= urlencode("Dengerin \"$title\" oleh $artist di TerraTones 🎵") ?>"
        target="_blank" rel="noopener"
        class="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 transition text-blue-400">
        <i class="fa-brands fa-telegram text-lg"></i>
        <span class="text-[10px]">Telegram</span>
      </a>
      <button onclick="copyLink()"
        class="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition text-gray-400 hover:text-white">
        <i class="fa-solid fa-link text-lg" id="copyIcon"></i>
        <span class="text-[10px]" id="copyLabel">Salin Link</span>
      </button>
    </div>

    <!-- CTA buka di app -->
    <a href="../pages/user-dashboard.html?play=<?= urlencode($songId) ?>"
      class="w-full flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-white font-semibold py-3 rounded-xl transition text-sm">
      <i class="fa-solid fa-play"></i>
      Putar di TerraTones
    </a>

    <?php if ($musisi): ?>
    <div class="mt-4 flex items-center gap-3 p-3 bg-white/5 rounded-xl">
      <div class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl flex-shrink-0">
        <?= $musisi['cover'] ?>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <p class="text-sm font-semibold text-white truncate"><?= htmlspecialchars($musisi['name']) ?></p>
          <?php if ($musisi['verified']): ?><i class="fa-solid fa-circle-check text-brand text-xs flex-shrink-0"></i><?php endif; ?>
        </div>
        <p class="text-xs text-gray-500"><?= htmlspecialchars($musisi['genre']) ?> · <?= htmlspecialchars($musisi['kota']) ?></p>
      </div>
      <span class="text-xs text-gray-500"><?= number_format((int)$musisi['followers']) ?> fans</span>
    </div>
    <?php endif; ?>
  </div>

  <?php else: ?>
  <!-- Song not found -->
  <div class="glass rounded-3xl p-12 text-center max-w-sm relative z-10">
    <div class="text-6xl mb-4">😕</div>
    <h2 class="text-xl font-bold text-white mb-2">Lagu tidak ditemukan</h2>
    <p class="text-gray-400 text-sm mb-6">Link mungkin sudah tidak valid atau lagu belum dipublikasikan.</p>
    <a href="../index.html" class="inline-flex items-center gap-2 bg-brand text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition">
      <i class="fa-solid fa-home"></i> Kembali ke TerraTones
    </a>
  </div>
  <?php endif; ?>

  <p class="text-gray-600 text-xs mt-8 relative z-10">TerraTones — Platform Musik Lokal Indonesia 🎵</p>

  <script>
    function copyLink() {
      navigator.clipboard.writeText(location.href).then(() => {
        document.getElementById('copyIcon').className  = 'fa-solid fa-check text-lg';
        document.getElementById('copyLabel').textContent = 'Tersalin!';
        document.getElementById('copyIcon').parentElement.classList.add('text-green-400');
        setTimeout(() => {
          document.getElementById('copyIcon').className  = 'fa-solid fa-link text-lg';
          document.getElementById('copyLabel').textContent = 'Salin Link';
          document.getElementById('copyIcon').parentElement.classList.remove('text-green-400');
        }, 2000);
      });
    }
  </script>
</body>
</html>
