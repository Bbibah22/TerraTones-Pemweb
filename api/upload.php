<?php
// ============================================================
// api/upload.php — Upload file MP3/WAV ke server
// POST multipart/form-data:
//   file       = file MP3/WAV
//   song_id    = ID lagu yang sudah dibuat (opsional, untuk update)
// Response: { url: "uploads/songs/filename.mp3" }
// ============================================================
require_once __DIR__ . '/../config/db.php';

// Pastikan folder uploads ada
$uploadDir = __DIR__ . '/../uploads/songs/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Cek ada file yang dikirim
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errCode = $_FILES['file']['error'] ?? -1;
    $errMsg  = [
        UPLOAD_ERR_INI_SIZE   => 'File terlalu besar (php.ini limit)',
        UPLOAD_ERR_FORM_SIZE  => 'File terlalu besar (form limit)',
        UPLOAD_ERR_NO_FILE    => 'Tidak ada file yang dikirim',
    ][$errCode] ?? 'Upload error: ' . $errCode;
    jsonResponse(['error' => $errMsg], 400);
}

$file     = $_FILES['file'];
$songId   = $_POST['song_id'] ?? null;
$origName = $file['name'];
$tmpPath  = $file['tmp_name'];
$size     = $file['size'];
$mime     = mime_content_type($tmpPath);

// Validasi tipe file
$allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave'];
$allowedExts  = ['mp3', 'wav'];
$ext          = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

if (!in_array($mime, $allowedMimes) && !in_array($ext, $allowedExts)) {
    jsonResponse(['error' => 'Format tidak didukung. Gunakan MP3 atau WAV.'], 400);
}

// Validasi ukuran (maks 50MB)
if ($size > 50 * 1024 * 1024) {
    jsonResponse(['error' => 'File terlalu besar. Maksimal 50MB.'], 400);
}

// Buat nama file unik
$newName = 'song_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$destPath = $uploadDir . $newName;

if (!move_uploaded_file($tmpPath, $destPath)) {
    jsonResponse(['error' => 'Gagal menyimpan file ke server.'], 500);
}

// Relative URL yang bisa diakses browser
$fileUrl = 'uploads/songs/' . $newName;

// Jika ada song_id, update kolom file_url di DB
if ($songId) {
    $db = getDB();
    $db->prepare('UPDATE songs SET file_url = ? WHERE id = ?')
       ->execute([$fileUrl, $songId]);
}

jsonResponse([
    'success'  => true,
    'url'      => $fileUrl,
    'filename' => $newName,
    'size'     => $size,
]);
