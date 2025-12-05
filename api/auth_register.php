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

// Check if user exists
$stmt = $conn->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
if ($result && $result->num_rows > 0) {
    send_json(['success' => false, 'error' => 'Email already registered'], 400);
}

$hash = password_hash($password, PASSWORD_BCRYPT);

$id = bin2hex(random_bytes(16)); // pseudo-UUID

$stmt = $conn->prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, NOW())');
if (!$stmt) {
    send_json(['success' => false, 'error' => $conn->error], 500);
}
$stmt->bind_param('sss', $id, $email, $hash);

if (!$stmt->execute()) {
    send_json(['success' => false, 'error' => $stmt->error], 500);
}

send_json([
    'success' => true,
    'user' => [
        'id' => $id,
        'email' => $email,
        'role' => 'user',
    ],
], 201);
