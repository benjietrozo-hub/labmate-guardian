<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

// Set CORS headers
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
    case 'DELETE':
        handle_delete($conn);
        break;
    default:
        send_json(['success' => false, 'error' => 'Method not allowed'], 405);
}

function handle_get(mysqli $conn): void {
    $result = $conn->query('SELECT * FROM borrow_requests ORDER BY created_at DESC');
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
    $borrower_email = $conn->real_escape_string($input['borrower_email'] ?? '');
    $item = $conn->real_escape_string($input['item'] ?? '');
    $quantity = (int)($input['quantity'] ?? 1);
    $request_date = $conn->real_escape_string($input['request_date'] ?? date('Y-m-d'));
    $return_date = $conn->real_escape_string($input['return_date'] ?? null);
    $status = $conn->real_escape_string($input['status'] ?? 'pending');
    $created_by = $conn->real_escape_string($input['created_by'] ?? null);

    $sql = "INSERT INTO borrow_requests (id, borrower_name, borrower_email, item, quantity, request_date, return_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('sssisssss', $id, $borrower_name, $borrower_email, $item, $quantity, $request_date, $return_date, $status, $created_by);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    // Send notification to admins about new request
    send_borrow_request_notification($id, $borrower_name, $borrower_email, $item, $quantity);

    send_json(['success' => true]);
}

function handle_put(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;
    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    $input = get_json_input();
    
    // Log incoming data
    error_log("PUT request - ID: $id");
    error_log("Input data: " . json_encode($input));

    // Get current record before update
    $current_sql = "SELECT * FROM borrow_requests WHERE id=?";
    $current_stmt = $conn->prepare($current_sql);
    $current_stmt->bind_param('s', $id);
    $current_stmt->execute();
    $current_result = $current_stmt->get_result();
    $current_record = $current_result->fetch_assoc();

    if (!$current_record) {
        error_log("Record not found for ID: $id");
        send_json(['success' => false, 'error' => 'Record not found'], 404);
    }

    error_log("Current record: " . json_encode($current_record));

    // Use existing values for fields not being updated
    $borrower_name = $conn->real_escape_string($input['borrower_name'] ?? $current_record['borrower_name']);
    $borrower_email = $conn->real_escape_string($input['borrower_email'] ?? $current_record['borrower_email']);
    $item = $conn->real_escape_string($input['item'] ?? $current_record['item']);
    $quantity = (int)($input['quantity'] ?? $current_record['quantity']);
    $request_date = $conn->real_escape_string($input['request_date'] ?? $current_record['request_date']);
    $return_date = $conn->real_escape_string($input['return_date'] ?? $current_record['return_date']);
    $status = $conn->real_escape_string($input['status'] ?? $current_record['status']);
    $approved_by = $conn->real_escape_string($input['approved_by'] ?? $current_record['approved_by']);
    $approved_at = $conn->real_escape_string($input['approved_at'] ?? $current_record['approved_at']);
    $rejection_reason = $conn->real_escape_string($input['rejection_reason'] ?? $current_record['rejection_reason']);

    error_log("Updating status to: $status");

    $sql = "UPDATE borrow_requests SET borrower_name=?, borrower_email=?, item=?, quantity=?, request_date=?, return_date=?, status=?, approved_by=?, approved_at=?, rejection_reason=? WHERE id=?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('sssisssssss', $borrower_name, $borrower_email, $item, $quantity, $request_date, $return_date, $status, $approved_by, $approved_at, $rejection_reason, $id);

    if (!$stmt->execute()) {
        error_log("Execute failed: " . $stmt->error);
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    error_log("Update successful");

    // If approved, create a borrowed item record
    if ($status === 'approved' && $current_record['status'] !== 'approved') {
        error_log("Creating borrowed item from request");
        $borrowed_item_created = create_borrowed_item_from_request($current_record, $approved_by);
        
        if (!$borrowed_item_created) {
            error_log("Failed to create borrowed item, rolling back approval");
            // Rollback the status change
            $rollback_sql = "UPDATE borrow_requests SET status=? WHERE id=?";
            $rollback_stmt = $conn->prepare($rollback_sql);
            if ($rollback_stmt) {
                $old_status = $current_record['status'];
                $rollback_stmt->bind_param('ss', $old_status, $id);
                $rollback_stmt->execute();
                $rollback_stmt->close();
            }
            send_json(['success' => false, 'error' => 'Failed to create borrowed item record'], 500);
            return;
        }
    }

    // Send notification if status changed
    if ($current_record && $current_record['status'] !== $status) {
        send_request_status_notification($current_record, $status, $rejection_reason);
    }

    send_json(['success' => true]);
}

function handle_delete(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;
    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    $sql = "DELETE FROM borrow_requests WHERE id=?";
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

function create_borrowed_item_from_request($request, $approved_by) {
    global $conn;
    
    error_log("Creating borrowed item from request: " . json_encode($request));
    
    $borrowed_id = generate_uuid();
    $sql = "INSERT INTO borrow_items (id, request_id, borrower_name, borrower_email, item, quantity, borrow_date, return_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        error_log("Failed to prepare borrowed item insert: " . $conn->error);
        return false;
    }
    
    $return_date = $request['return_date'] ?: null;
    $borrow_date = $request['request_date'] ?: date('Y-m-d');
    $item_status = 'borrowed';
    
    error_log("Inserting borrowed item with ID: $borrowed_id");
    error_log("Request ID: {$request['id']}");
    error_log("Borrower: {$request['borrower_name']}");
    error_log("Item: {$request['item']}");
    error_log("Quantity: {$request['quantity']}");
    $stmt->bind_param('sssssissss', $borrowed_id, $request['id'], $request['borrower_name'], $request['borrower_email'], $request['item'], $request['quantity'], $borrow_date, $return_date, $item_status, $approved_by);
    
    if (!$stmt->execute()) {
        error_log("Failed to insert borrowed item: " . $stmt->error);
        $stmt->close();
        return false;
    } else {
        error_log("Borrowed item created successfully");
        $stmt->close();
        return true;
    }
}

function send_borrow_request_notification($request_id, $borrower_name, $borrower_email, $item, $quantity) {
    // Get user ID from email
    global $conn;
    $user_sql = "SELECT id FROM users WHERE email=?";
    $user_stmt = $conn->prepare($user_sql);
    $user_stmt->bind_param('s', $borrower_email);
    $user_stmt->execute();
    $user_result = $user_stmt->get_result();
    $user = $user_result->fetch_assoc();
    
    if (!$user) return;

    $notification_data = [
        'type' => 'admin_borrow_update',
        'request_id' => $request_id,
        'borrower_name' => $borrower_name,
        'item' => $item,
        'quantity' => $quantity,
        'user_id' => $user['id'],
        'timestamp' => date('Y-m-d H:i:s')
    ];

    send_websocket_notification_to_admins($notification_data);
}

function send_request_status_notification($request, $new_status, $rejection_reason = null) {
    // Get user ID from email
    global $conn;
    $user_sql = "SELECT id FROM users WHERE email=?";
    $user_stmt = $conn->prepare($user_sql);
    $user_stmt->bind_param('s', $request['borrower_email']);
    $user_stmt->execute();
    $user_result = $user_stmt->get_result();
    $user = $user_result->fetch_assoc();
    
    if (!$user) return;

    $notification_data = [
        'type' => 'borrow_status_update',
        'request_id' => $request['id'],
        'item' => $request['item'],
        'quantity' => $request['quantity'],
        'old_status' => $request['status'],
        'new_status' => $new_status,
        'rejection_reason' => $rejection_reason,
        'user_id' => $user['id'],
        'timestamp' => date('Y-m-d H:i:s')
    ];

    send_websocket_notification($user['id'], $notification_data);
}

function send_websocket_notification_to_admins($data) {
    global $conn;
    
    // Get all admin users
    $admin_sql = "SELECT id FROM users WHERE role='admin'";
    $admin_result = $conn->query($admin_sql);
    
    while ($admin = $admin_result->fetch_assoc()) {
        send_websocket_notification($admin['id'], $data);
    }
}

function send_websocket_notification($user_id, $data) {
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
    curl_setopt($ch, CURLOPT_TIMEOUT, 2);
    
    curl_exec($ch);
    curl_close($ch);
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
