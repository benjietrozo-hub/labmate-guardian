<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'error' => 'Method not allowed'], 405);
}

$conn = get_db_connection();

$userId = $_POST['user_id'] ?? '';

if ($userId === '') {
    send_json(['success' => false, 'error' => 'Missing user_id'], 400);
}

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    send_json(['success' => false, 'error' => 'No file uploaded or upload error'], 400);
}

$file = $_FILES['avatar'];
$allowedTypes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif'];

if (!isset($allowedTypes[$file['type']])) {
    send_json(['success' => false, 'error' => 'Invalid file type'], 400);
}

$ext = $allowedTypes[$file['type']];
$uploadsDir = __DIR__ . '/uploads/avatars';

if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
}

$filename = $userId . '.' . $ext;
$targetPath = $uploadsDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    send_json(['success' => false, 'error' => 'Failed to save file'], 500);
}

// Store relative URL so it can be used in the frontend
$avatarUrl = 'api/uploads/avatars/' . $filename;

$stmt = $conn->prepare('UPDATE users SET avatar_url = ? WHERE id = ?');
if (!$stmt) {
    send_json(['success' => false, 'error' => $conn->error], 500);
}
$stmt->bind_param('ss', $avatarUrl, $userId);

if (!$stmt->execute()) {
    send_json(['success' => false, 'error' => $stmt->error], 500);
}

send_json(['success' => true, 'avatar_url' => $avatarUrl]);
