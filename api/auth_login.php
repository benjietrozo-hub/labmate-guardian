<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

$conn = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'error' => 'Method not allowed'], 405);
}

$input = get_json_input();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    send_json(['success' => false, 'error' => 'Email and password are required'], 400);
}

$stmt = $conn->prepare('SELECT id, password_hash, role FROM users WHERE email = ? LIMIT 1');
if (!$stmt) {
    send_json(['success' => false, 'error' => $conn->error], 500);
}
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if (!$result || $result->num_rows === 0) {
    send_json(['success' => false, 'error' => 'Invalid credentials'], 401);
}

$row = $result->fetch_assoc();

if (!password_verify($password, $row['password_hash'])) {
    send_json(['success' => false, 'error' => 'Invalid credentials'], 401);
}

send_json([
    'success' => true,
    'user' => [
        'id' => $row['id'],
        'email' => $email,
        'role' => $row['role'] ?? 'user',
    ],
]);
