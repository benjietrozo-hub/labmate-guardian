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
    $result = $conn->query('SELECT * FROM borrow_items ORDER BY created_at DESC');
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

    // Generate UUID for the new record
    $id = $conn->real_escape_string(generate_uuid());
    $borrower_name = $conn->real_escape_string($input['borrower_name'] ?? '');
    $item = $conn->real_escape_string($input['item'] ?? '');
    $quantity = (int)($input['quantity'] ?? 1);
    $borrow_date = $conn->real_escape_string($input['borrow_date'] ?? '');
    $return_date = $conn->real_escape_string($input['return_date'] ?? null);
    $status = $conn->real_escape_string($input['status'] ?? 'pending');
    $created_by = $conn->real_escape_string($input['created_by'] ?? null);

    $sql = "INSERT INTO borrow_items (id, borrower_name, item, quantity, borrow_date, return_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('sssissss', $id, $borrower_name, $item, $quantity, $borrow_date, $return_date, $status, $created_by);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    // Send notification to admins about new borrow request
    send_admin_notification($conn, $borrower_name, $item, $quantity, $id);

    send_json(['success' => true]);
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

function handle_put(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;
    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    $input = get_json_input();

    $borrower_name = $conn->real_escape_string($input['borrower_name'] ?? '');
    $item = $conn->real_escape_string($input['item'] ?? '');
    $quantity = (int)($input['quantity'] ?? 1);
    $borrow_date = $conn->real_escape_string($input['borrow_date'] ?? '');
    $return_date = $conn->real_escape_string($input['return_date'] ?? null);
    $status = $conn->real_escape_string($input['status'] ?? 'Borrowed');
    $approved_by = $conn->real_escape_string($input['approved_by'] ?? null);
    $approved_at = $conn->real_escape_string($input['approved_at'] ?? null);
    $rejection_reason = $conn->real_escape_string($input['rejection_reason'] ?? null);

    // Get current record before update for notification purposes
    $current_sql = "SELECT * FROM borrow_items WHERE id=?";
    $current_stmt = $conn->prepare($current_sql);
    $current_stmt->bind_param('s', $id);
    $current_stmt->execute();
    $current_result = $current_stmt->get_result();
    $current_record = $current_result->fetch_assoc();

    $sql = "UPDATE borrow_items SET borrower_name=?, item=?, quantity=?, borrow_date=?, return_date=?, status=?, approved_by=?, approved_at=?, rejection_reason=? WHERE id=?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('ssisssssss', $borrower_name, $item, $quantity, $borrow_date, $return_date, $status, $approved_by, $approved_at, $rejection_reason, $id);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    // Send notification if status changed
    if ($current_record && $current_record['status'] !== $status) {
        send_borrow_notification($current_record, $status, $rejection_reason);
    }

    send_json(['success' => true]);
}

function handle_delete(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;
    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    $sql = "DELETE FROM borrow_items WHERE id=?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('s', $id);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    send_json(['success' => true]);
}

function send_borrow_notification($borrow_record, $new_status, $rejection_reason = null) {
    // Extract email from borrower_name (format: "Name (email)")
    preg_match('/\(([^)]+)\)/', $borrow_record['borrower_name'], $matches);
    $borrower_email = $matches[1] ?? null;
    
    if (!$borrower_email) {
        return; // No email found, cannot send notification
    }

    // Get user ID from email
    global $conn;
    $user_sql = "SELECT id FROM users WHERE email=?";
    $user_stmt = $conn->prepare($user_sql);
    $user_stmt->bind_param('s', $borrower_email);
    $user_stmt->execute();
    $user_result = $user_stmt->get_result();
    $user = $user_result->fetch_assoc();
    
    if (!$user) {
        return; // User not found
    }

    $notification_data = [
        'type' => 'borrow_status_update',
        'borrow_id' => $borrow_record['id'],
        'item' => $borrow_record['item'],
        'quantity' => $borrow_record['quantity'],
        'old_status' => $borrow_record['status'],
        'new_status' => $new_status,
        'rejection_reason' => $rejection_reason,
        'user_id' => $user['id'],
        'timestamp' => date('Y-m-d H:i:s')
    ];

    // Send WebSocket notification
    send_websocket_notification($user['id'], $notification_data);
    
    // Also notify admins about status changes
    notify_admins_about_borrow_update($notification_data);
}

function notify_admins_about_borrow_update($notification_data) {
    global $conn;
    
    // Get all admin users
    $admin_sql = "SELECT id FROM users WHERE role='admin'";
    $admin_result = $conn->query($admin_sql);
    
    while ($admin = $admin_result->fetch_assoc()) {
        $admin_notification = [
            'type' => 'admin_borrow_update',
            ...$notification_data
        ];
        send_websocket_notification($admin['id'], $admin_notification);
    }
}

function send_admin_notification($conn, $borrower_name, $item, $quantity, $borrow_id) {
    $notification_data = [
        'item' => $item,
        'quantity' => $quantity,
        'borrower_name' => $borrower_name,
        'borrow_id' => $borrow_id,
        'new_status' => 'pending', // Add status for proper WebSocket handling
        'old_status' => null,
        'user_id' => null, // Not applicable for admin notifications of new requests
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    notify_admins_about_borrow_update($notification_data);
}

function send_websocket_notification($user_id, $data) {
    // This will send notification to WebSocket server
    $ch = curl_init();
    
    $notification = [
        'user_id' => $user_id,
        'data' => $data
    ];
    
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:8081/notify');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($notification));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2); // Don't wait too long
    
    curl_exec($ch);
    curl_close($ch);
}
?>
