<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

$conn = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get($conn);
        break;
    case 'POST':
        handle_post($conn);
        break;
    case 'PUT':
        handle_put($conn);
        break;
    case 'DELETE':
        handle_delete($conn);
        break;
    default:
        send_json(['success' => false, 'error' => 'Method not allowed'], 405);
}

function handle_get(mysqli $conn): void {
    // Exclude the root admin account from the list (by id and email)
    $result = $conn->query("SELECT id, email, role, created_at FROM users WHERE id != '6717' AND email != 'benjie.trozo@csucc.edu.ph' ORDER BY created_at DESC");
    if (!$result) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    send_json(['success' => true, 'data' => $rows]);
}

function handle_post(mysqli $conn): void {
    $input = get_json_input();

    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? 'user';

    if ($email === '' || $password === '') {
        send_json(['success' => false, 'error' => 'Email and password are required'], 400);
    }

    if (!in_array($role, ['admin', 'user'], true)) {
        $role = 'user';
    }

    $stmt = $conn->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result && $result->num_rows > 0) {
        send_json(['success' => false, 'error' => 'Email already exists'], 400);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $id = bin2hex(random_bytes(16));

    $stmt = $conn->prepare('INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())');
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }
    $stmt->bind_param('ssss', $id, $email, $hash, $role);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    send_json(['success' => true, 'user' => ['id' => $id, 'email' => $email, 'role' => $role]], 201);
}

function handle_put(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;

    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    $input = get_json_input();
    $email = trim($input['email'] ?? '');
    $role = $input['role'] ?? null;

    if ($email === '' || !$role || !in_array($role, ['admin', 'user'], true)) {
        send_json(['success' => false, 'error' => 'Email and valid role are required'], 400);
    }

    // Ensure email is unique (excluding this user)
    $stmt = $conn->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }
    $stmt->bind_param('ss', $email, $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result && $result->num_rows > 0) {
        send_json(['success' => false, 'error' => 'Email already in use'], 400);
    }

    $stmt = $conn->prepare('UPDATE users SET email = ?, role = ? WHERE id = ?');
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }
    $stmt->bind_param('sss', $email, $role, $id);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    send_json(['success' => true]);
}

function handle_delete(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;

    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    // Protect root admin from deletion
    $stmt = $conn->prepare("SELECT email FROM users WHERE id = ? LIMIT 1");
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }
    $stmt->bind_param('s', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result ? $result->fetch_assoc() : null;

    if ($row && ($id === '6717' || $row['email'] === 'benjie.trozo@csucc.edu.ph')) {
        send_json(['success' => false, 'error' => 'Cannot delete root admin account'], 400);
    }

    $stmt = $conn->prepare('DELETE FROM users WHERE id = ?');
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }
    $stmt->bind_param('s', $id);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    send_json(['success' => true]);
}
