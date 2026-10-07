<?php
declare(strict_types=1);

const APP_ORIGIN = 'https://app.calibreco.com.au';
const SUPABASE_URL = 'https://jdeqnboljrgrpnvkfthx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fWijlFfBeTw4Ku8EPkno7w_BgOARn0j';

header('Access-Control-Allow-Origin: ' . APP_ORIGIN);
header('Vary: Origin');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function fail(int $status, string $message): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
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

function safeSegment(string $value): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9._-]+/', '-', $value) ?? '';
    return trim($value, '.-_');
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail(405, 'GET required.');
$user = currentUser(bearerToken());
$userId = safeSegment((string)$user['id']);
$key = trim((string)($_GET['key'] ?? ''));
if ($key === '' || str_contains($key, "\0") || str_contains($key, '..') || str_contains($key, '\\')) fail(400, 'Invalid storage key.');

$requiredPrefix = 'private/' . $userId . '/';
if (!str_starts_with($key, $requiredPrefix)) fail(403, 'Media does not belong to this account.');

$storageRoot = realpath(__DIR__ . '/storage');
if ($storageRoot === false) fail(500, 'Storage directory is unavailable.');
$path = realpath($storageRoot . '/' . $key);
if ($path === false || !is_file($path)) fail(404, 'Media file not found.');

$userRoot = realpath($storageRoot . '/private/' . $userId);
if ($userRoot === false || !str_starts_with($path, $userRoot . DIRECTORY_SEPARATOR)) fail(403, 'Media path is not allowed.');

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string)$finfo->file($path);
$size = filesize($path);
if ($size === false) fail(500, 'Could not read media file.');

header('Content-Type: ' . ($mime ?: 'application/octet-stream'));
header('Content-Length: ' . $size);
header('Content-Disposition: inline; filename="' . rawurlencode(basename($path)) . '"');
header('Cache-Control: private, no-store, max-age=0');
header('Pragma: no-cache');

$fp = fopen($path, 'rb');
if ($fp === false) fail(500, 'Could not open media file.');
fpassthru($fp);
fclose($fp);
