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
    // Check if this is a request for a specific user (for profile viewing)
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $specificUserId = $query['id'] ?? null;
    
    if ($specificUserId) {
        // Return specific user data, including root admin if requested
        $stmt = $conn->prepare("SELECT id, email, role, id_number, avatar_url, first_name, middle_name, last_name, created_at FROM users WHERE id = ? LIMIT 1");
        if (!$stmt) {
            send_json(['success' => false, 'error' => $conn->error], 500);
        }
        $stmt->bind_param('s', $specificUserId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            send_json(['success' => true, 'data' => [$row]]);
        } else {
            send_json(['success' => false, 'error' => 'User not found'], 404);
        }
        return;
    }
    
    // For general users list, exclude the root admin account
    $result = $conn->query("SELECT id, email, role, id_number, avatar_url, first_name, middle_name, last_name, created_at FROM users WHERE id != '6717' AND email != 'benjie.trozo@csucc.edu.ph' ORDER BY created_at DESC");
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
    $id_number = $input['id_number'] ?? null;
    $first_name = $input['first_name'] ?? null;
    $middle_name = $input['middle_name'] ?? null;
    $last_name = $input['last_name'] ?? null;

    if ($email === '' || $password === '') {
        send_json(['success' => false, 'error' => 'Email and password are required'], 400);
    }

    // Handle role transition - only convert student to user for database compatibility
    // Keep instructor as is since we want to distinguish it from student
    if ($role === 'student') {
        $role = 'user';
    }

    if (!in_array($role, ['admin', 'user', 'instructor'], true)) {
        $role = 'user';
    }

    // Validate ID number format if provided
    if ($id_number && !preg_match('/^\d{4}-\d{4}$/', $id_number)) {
        send_json(['success' => false, 'error' => 'ID number must be in format xxxx-xxxx'], 400);
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
    
    // Generate a numeric ID for the users table (which uses int(11) AUTO_INCREMENT)
    $result = $conn->query("SELECT MAX(id) as max_id FROM users");
    $row = $result->fetch_assoc();
    $id = ($row['max_id'] ?? 0) + 1;

    $stmt = $conn->prepare('INSERT INTO users (id, email, password_hash, role, id_number, first_name, middle_name, last_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())');
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }
    $stmt->bind_param('isssssss', $id, $email, $hash, $role, $id_number, $first_name, $middle_name, $last_name);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    // Convert back to frontend role format for response
    $frontend_role = ($role === 'user') ? 'student' : $role;
    send_json(['success' => true, 'user' => [
        'id' => $id, 
        'email' => $email, 
        'role' => $frontend_role, 
        'id_number' => $id_number,
        'first_name' => $first_name,
        'middle_name' => $middle_name,
        'last_name' => $last_name
    ]], 201);
}

function handle_put(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;

    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    $input = get_json_input();
    
    // Debug: Log the input data
    error_log('PUT request data: ' . json_encode($input));
    
    $email = trim($input['email'] ?? '');
    $role = $input['role'] ?? null;
    $id_number = $input['id_number'] ?? null;
    $first_name = $input['first_name'] ?? null;
    $middle_name = $input['middle_name'] ?? null;
    $last_name = $input['last_name'] ?? null;

    if ($email === '') {
        send_json(['success' => false, 'error' => 'Email is required'], 400);
    }

    // Validate role if provided
    if ($role !== null) {
        // Handle role transition - only convert student to user for database compatibility
        // Keep instructor as is since we want to distinguish it from student
        if ($role === 'student') {
            $role = 'user';
        }

        if (!in_array($role, ['admin', 'user', 'instructor'], true)) {
            send_json(['success' => false, 'error' => 'Invalid role'], 400);
        }
    }

    // Validate ID number format if provided
    if ($id_number && !preg_match('/^\d{4}-\d{4}$/', $id_number)) {
        send_json(['success' => false, 'error' => 'ID number must be in format xxxx-xxxx'], 400);
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

    // Build dynamic UPDATE query based on provided fields
    $update_fields = ['email = ?'];
    $bind_params = [$email];
    $bind_types = 's';
    
    if ($role !== null) {
        $update_fields[] = 'role = ?';
        $bind_params[] = $role;
        $bind_types .= 's';
    }
    
    if ($id_number !== null) {
        $update_fields[] = 'id_number = ?';
        $bind_params[] = $id_number;
        $bind_types .= 's';
    }
    
    if ($first_name !== null) {
        $update_fields[] = 'first_name = ?';
        $bind_params[] = $first_name;
        $bind_types .= 's';
    }
    
    if ($middle_name !== null) {
        $update_fields[] = 'middle_name = ?';
        $bind_params[] = $middle_name;
        $bind_types .= 's';
    }
    
    if ($last_name !== null) {
        $update_fields[] = 'last_name = ?';
        $bind_params[] = $last_name;
        $bind_types .= 's';
    }
    
    $bind_params[] = $id;
    $bind_types .= 's';
    
    $sql = 'UPDATE users SET ' . implode(', ', $update_fields) . ' WHERE id = ?';
    
    // Debug: Log the SQL and parameters
    error_log('SQL: ' . $sql);
    error_log('Params: ' . json_encode($bind_params));
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }
    $stmt->bind_param($bind_types, ...$bind_params);

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
