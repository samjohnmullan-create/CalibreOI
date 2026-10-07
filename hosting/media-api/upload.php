<?php
// Calibre & Co. private media upload endpoint.
// Deploy this file to the document root of media.calibreco.com.au.

declare(strict_types=1);

const APP_ORIGIN = 'https://app.calibreco.com.au';
const SUPABASE_URL = 'https://jdeqnboljrgrpnvkfthx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fWijlFfBeTw4Ku8EPkno7w_BgOARn0j';
const MAX_BYTES = 26214400; // 25 MB

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . APP_ORIGIN);
header('Vary: Origin');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function fail(int $status, string $message): never {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

function bearerToken(): string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) fail(401, 'Authentication required.');
    return trim($m[1]);
}

function currentUser(string $jwt): array {
    if (!function_exists('curl_init')) fail(500, 'PHP cURL extension is required.');
    $ch = curl_init(SUPABASE_URL . '/auth/v1/user');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $jwt,
            'apikey: ' . SUPABASE_PUBLISHABLE_KEY,
            'Accept: application/json'
        ]
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status !== 200 || !$body) fail(401, 'Invalid or expired session.');
    $user = json_decode($body, true);
    if (!is_array($user) || empty($user['id'])) fail(401, 'Invalid user session.');
    return $user;
}

function safeSegment(string $value, string $fallback = 'unknown'): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9._-]+/', '-', $value) ?? '';
    $value = trim($value, '.-_');
    return $value !== '' ? substr($value, 0, 96) : $fallback;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST required.');
$user = currentUser(bearerToken());

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) fail(400, 'No file supplied.');
$file = $_FILES['file'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) fail(400, 'Upload failed.');
$size = (int)($file['size'] ?? 0);
if ($size < 1 || $size > MAX_BYTES) fail(413, 'File exceeds the 25 MB limit.');

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string)$finfo->file($file['tmp_name']);
$allowed = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'application/pdf' => 'pdf'
];
if (!isset($allowed[$mime])) fail(415, 'Unsupported file type.');

$categories = ['original','identity','movement','workshop','documents','sale'];
$category = strtolower(trim((string)($_POST['category'] ?? 'workshop')));
if (!in_array($category, $categories, true)) fail(400, 'Invalid media category.');

$userId = safeSegment((string)$user['id']);
$watchId = safeSegment((string)($_POST['watchId'] ?? 'unassigned'));
$jobId = safeSegment((string)($_POST['jobId'] ?? ''));
$stageId = safeSegment((string)($_POST['stageId'] ?? ''));
$assetId = bin2hex(random_bytes(16));
$ext = $allowed[$mime];

$storageRoot = __DIR__ . '/storage/private';
$relativeDir = $userId . '/' . $watchId . '/' . $category;
$targetDir = $storageRoot . '/' . $relativeDir;
if (!is_dir($targetDir) && !mkdir($targetDir, 0750, true) && !is_dir($targetDir)) fail(500, 'Could not create storage directory.');

$filename = $assetId . '.' . $ext;
$target = $targetDir . '/' . $filename;
if (!move_uploaded_file($file['tmp_name'], $target)) fail(500, 'Could not save uploaded file.');
@chmod($target, 0640);

$storageKey = 'private/' . $relativeDir . '/' . $filename;
$originalName = basename((string)($file['name'] ?? 'upload.' . $ext));
$createdAt = gmdate('c');

$asset = [
    'id' => $assetId,
    'watchId' => $watchId,
    'jobId' => $jobId !== 'unknown' ? $jobId : '',
    'stageId' => $stageId !== 'unknown' ? $stageId : '',
    'category' => $category,
    'storageKey' => $storageKey,
    'url' => '',
    'thumbnailUrl' => '',
    'originalName' => $originalName,
    'mimeType' => $mime,
    'bytes' => $size,
    'width' => null,
    'height' => null,
    'createdAt' => $createdAt,
    'caption' => '',
    'evidenceNote' => '',
    'checksum' => hash_file('sha256', $target),
    'visibility' => 'private'
];

if (str_starts_with($mime, 'image/')) {
    $dims = @getimagesize($target);
    if (is_array($dims)) {
        $asset['width'] = $dims[0] ?? null;
        $asset['height'] = $dims[1] ?? null;
    }
}

http_response_code(201);
echo json_encode(['ok' => true, 'asset' => $asset], JSON_UNESCAPED_SLASHES);
