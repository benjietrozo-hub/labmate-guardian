<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

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
    default:
        send_json(['success' => false, 'error' => 'Method not allowed'], 405);
}

function handle_get(mysqli $conn): void {
    $user_id = $_GET['user_id'] ?? null;
    $limit = (int)($_GET['limit'] ?? 50);
    $offset = (int)($_GET['offset'] ?? 0);
    $unread_only = $_GET['unread_only'] === 'true';
    
    if (!$user_id) {
        send_json(['success' => false, 'error' => 'Missing user_id'], 400);
        return;
    }
    
    $sql = "SELECT * FROM notifications WHERE user_id = ?";
    $params = [$user_id];
    $types = 's';
    
    if ($unread_only) {
        $sql .= " AND read_status = FALSE";
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $notifications = [];
    while ($row = $result->fetch_assoc()) {
        $notifications[] = $row;
    }
    
    // Get unread count
    $count_sql = "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_status = FALSE";
    $count_stmt = $conn->prepare($count_sql);
    $count_stmt->bind_param('s', $user_id);
    $count_stmt->execute();
    $unread_count = $count_stmt->get_result()->fetch_assoc()['count'];
    
    send_json([
        'success' => true,
        'data' => $notifications,
        'unread_count' => (int)$unread_count
    ]);
}

function handle_post(mysqli $conn): void {
    $input = get_json_input();
    
    $id = generate_uuid();
    $user_id = $conn->real_escape_string($input['user_id'] ?? '');
    $title = $conn->real_escape_string($input['title'] ?? '');
    $message = $conn->real_escape_string($input['message'] ?? '');
    $type = $conn->real_escape_string($input['type'] ?? '');
    $data = $input['data'] ? json_encode($input['data']) : null;
    $action_url = $conn->real_escape_string($input['action_url'] ?? '');
    
    if (!$user_id || !$title || !$message || !$type) {
        send_json(['success' => false, 'error' => 'Missing required fields'], 400);
        return;
    }
    
    $sql = "INSERT INTO notifications (id, user_id, title, message, type, data, action_url) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sssssss', $id, $user_id, $title, $message, $type, $data, $action_url);
    
    if ($stmt->execute()) {
        send_json(['success' => true, 'id' => $id]);
    } else {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }
}

function handle_put(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;
    $action = $query['action'] ?? 'mark_read';
    
    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
        return;
    }
    
    if ($action === 'mark_read') {
        $sql = "UPDATE notifications SET read_status = TRUE WHERE id = ?";
    } elseif ($action === 'mark_all_read') {
        $user_id = $query['user_id'] ?? null;
        if (!$user_id) {
            send_json(['success' => false, 'error' => 'Missing user_id for mark_all_read'], 400);
            return;
        }
        $sql = "UPDATE notifications SET read_status = TRUE WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('s', $user_id);
        $stmt->execute();
        send_json(['success' => true]);
        return;
    } else {
        send_json(['success' => false, 'error' => 'Invalid action'], 400);
        return;
    }
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $id);
    
    if ($stmt->execute()) {
        send_json(['success' => true]);
    } else {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }
}

function generate_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
?>
