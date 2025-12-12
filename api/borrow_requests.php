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

    // Debug: Log the incoming data
    error_log("POST request data: " . json_encode($input));

    // Generate UUID for the new record
    $id = $conn->real_escape_string(generate_uuid());
    $borrower_name = $conn->real_escape_string($input['borrower_name'] ?? '');
    $borrower_email = $conn->real_escape_string($input['borrower_email'] ?? '');
    $item = $conn->real_escape_string($input['item'] ?? '');
    $quantity = (int)($input['quantity'] ?? 1);
    $request_date = $conn->real_escape_string($input['request_date'] ?? date('Y-m-d'));
    $return_date = $conn->real_escape_string($input['return_date'] ?? null);
    $message = $conn->real_escape_string($input['message'] ?? '');
    $status = $conn->real_escape_string($input['status'] ?? 'pending');
    $created_by = $conn->real_escape_string($input['created_by'] ?? null);

    // Debug: Log the processed data
    error_log("Processed message field: '$message'");

    $sql = "INSERT INTO borrow_requests (id, borrower_name, borrower_email, item, quantity, request_date, return_date, message, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('ssssisssss', $id, $borrower_name, $borrower_email, $item, $quantity, $request_date, $return_date, $message, $status, $created_by);

    if (!$stmt->execute()) {
        error_log("SQL execution error: " . $stmt->error);
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    // Debug: Log successful insertion
    error_log("Borrow request inserted successfully with message: '$message'");

    // Send consolidated notifications
    send_consolidated_borrow_notifications($id, $borrower_name, $borrower_email, $item, $quantity);

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
    $message = $conn->real_escape_string($input['message'] ?? $current_record['message'] ?? '');
    $status = $conn->real_escape_string($input['status'] ?? $current_record['status']);
    $approved_by = $conn->real_escape_string($input['approved_by'] ?? $current_record['approved_by']);
    $approved_at = $conn->real_escape_string($input['approved_at'] ?? $current_record['approved_at']);
    $rejection_reason = $conn->real_escape_string($input['rejection_reason'] ?? $current_record['rejection_reason']);

    error_log("Updating status to: $status");

    if ($status === 'approved' && $current_record['status'] !== 'approved') {
        error_log("Starting approval workflow with inventory check");
        $conn->begin_transaction();
        $inv_select_sql = "SELECT id, quantity FROM inventory_equipment WHERE name = ? FOR UPDATE";
        $inv_select_stmt = $conn->prepare($inv_select_sql);
        if (!$inv_select_stmt) {
            $conn->rollback();
            send_json(['success' => false, 'error' => $conn->error], 500);
        }
        $inv_select_stmt->bind_param('s', $item);
        $inv_select_stmt->execute();
        $inv_result = $inv_select_stmt->get_result();
        $inventory_row = $inv_result->fetch_assoc();
        $inv_select_stmt->close();

        if (!$inventory_row) {
            $conn->rollback();
            send_json(['success' => false, 'error' => 'Inventory item not found'], 404);
        }

        $available_qty = (int)$inventory_row['quantity'];
        if ($available_qty < $quantity) {
            $conn->rollback();
            send_json(['success' => false, 'error' => 'Insufficient inventory for approval'], 409);
        }
        $inv_update_sql = "UPDATE inventory_equipment SET quantity = quantity - ? WHERE id = ? AND quantity >= ?";
        $inv_update_stmt = $conn->prepare($inv_update_sql);
        if (!$inv_update_stmt) {
            $conn->rollback();
            send_json(['success' => false, 'error' => $conn->error], 500);
        }
        $inv_update_stmt->bind_param('isi', $quantity, $inventory_row['id'], $quantity);
        $inv_update_stmt->execute();
        $affected = $inv_update_stmt->affected_rows;
        $inv_update_stmt->close();

        if ($affected <= 0) {
            $conn->rollback();
            send_json(['success' => false, 'error' => 'Concurrent update detected: inventory insufficient'], 409);
        }
        $borrowed_item_created = create_borrowed_item_from_request([
            'id' => $id,
            'borrower_name' => $borrower_name,
            'borrower_email' => $borrower_email,
            'item' => $item,
            'quantity' => $quantity,
            'request_date' => $request_date,
            'return_date' => $return_date,
            'status' => $status
        ], $approved_by);

        if (!$borrowed_item_created) {
            $conn->rollback();
            send_json(['success' => false, 'error' => 'Failed to create borrowed item record'], 500);
        }
        $sql = "UPDATE borrow_requests SET borrower_name=?, borrower_email=?, item=?, quantity=?, request_date=?, return_date=?, message=?, status=?, approved_by=?, approved_at=?, rejection_reason=? WHERE id=?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            $conn->rollback();
            send_json(['success' => false, 'error' => $conn->error], 500);
        }
        $stmt->bind_param('sssissssssss', $borrower_name, $borrower_email, $item, $quantity, $request_date, $return_date, $message, $status, $approved_by, $approved_at, $rejection_reason, $id);
        if (!$stmt->execute()) {
            $stmt->close();
            $conn->rollback();
            send_json(['success' => false, 'error' => $stmt->error], 500);
        }
        $stmt->close();
        ensure_inventory_audit_table($conn);
        insert_inventory_audit($conn, [
            'equipment_id' => $inventory_row['id'],
            'item_name' => $item,
            'change_type' => 'borrow_deduction',
            'quantity_change' => -$quantity,
            'performed_by' => $approved_by,
            'related_request_id' => $id
        ]);

        $conn->commit();
        send_request_status_notification([
            'id' => $id,
            'item' => $item,
            'quantity' => $quantity,
            'status' => $current_record['status'],
            'borrower_email' => $borrower_email
        ], $status, $rejection_reason);
        $admin_notification_data = [
            'type' => 'admin_borrow_update',
            'request_id' => $id,
            'item' => $item,
            'quantity' => $quantity,
            'old_status' => $current_record['status'],
            'new_status' => $status,
            'timestamp' => date('Y-m-d H:i:s'),
            'title' => 'Borrow Request Updated',
            'message' => "Borrow request for {$quantity} x {$item} has been {$status}",
            'actionUrl' => '/borrow-requests'
        ];
        send_websocket_notification_to_admins($admin_notification_data);

        send_json(['success' => true]);
        return;
    }

    // Non-approval path: proceed with standard update
    $sql = "UPDATE borrow_requests SET borrower_name=?, borrower_email=?, item=?, quantity=?, request_date=?, return_date=?, message=?, status=?, approved_by=?, approved_at=?, rejection_reason=? WHERE id=?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        send_json(['success' => false, 'error' => $conn->error], 500);
    }
    $stmt->bind_param('sssissssssss', $borrower_name, $borrower_email, $item, $quantity, $request_date, $return_date, $message, $status, $approved_by, $approved_at, $rejection_reason, $id);
    if (!$stmt->execute()) {
        error_log("Execute failed: " . $stmt->error);
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }
    $stmt->close();
    error_log("Update successful");

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

function ensure_inventory_audit_table(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS inventory_audit (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        equipment_id CHAR(36) NULL,
        item_name VARCHAR(255) NOT NULL,
        change_type VARCHAR(50) NOT NULL,
        quantity_change INT NOT NULL,
        performed_by CHAR(36) NULL,
        related_request_id CHAR(36) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $conn->query($sql);
}

function insert_inventory_audit(mysqli $conn, $entry) {
    $sql = "INSERT INTO inventory_audit (equipment_id, item_name, change_type, quantity_change, performed_by, related_request_id) VALUES (?,?,?,?,?,?)";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param(
            'sssiss',
            $entry['equipment_id'],
            $entry['item_name'],
            $entry['change_type'],
            $entry['quantity_change'],
            $entry['performed_by'],
            $entry['related_request_id']
        );
        $stmt->execute();
        $stmt->close();
    }
}

function send_consolidated_borrow_notifications($request_id, $borrower_name, $borrower_email, $item, $quantity) {
    // Get user ID from email
    global $conn;
    $user_sql = "SELECT id FROM users WHERE email=?";
    $user_stmt = $conn->prepare($user_sql);
    $user_stmt->bind_param('s', $borrower_email);
    $user_stmt->execute();
    $user_result = $user_stmt->get_result();
    $user = $user_result->fetch_assoc();
    
    if (!$user) return;

    // Send notification to admins about new request only
    $admin_notification_data = [
        'type' => 'admin_borrow_update',
        'request_id' => $request_id,
        'borrower_name' => $borrower_name,
        'item' => $item,
        'quantity' => $quantity,
        'user_id' => $user['id'],
        'timestamp' => date('Y-m-d H:i:s'),
        'title' => 'New Borrow Request',
        'message' => "{$borrower_name} has requested to borrow {$quantity} x {$item}",
        'actionUrl' => '/borrow-requests'
    ];
    send_websocket_notification_to_admins($admin_notification_data);
}

function send_borrow_request_confirmation($request_id, $borrower_name, $borrower_email, $item, $quantity) {
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
        'type' => 'borrow_request_submitted',
        'request_id' => $request_id,
        'borrower_name' => $borrower_name,
        'item' => $item,
        'quantity' => $quantity,
        'user_id' => $user['id'],
        'timestamp' => date('Y-m-d H:i:s')
    ];

    send_websocket_notification($user['id'], $notification_data);
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
        'return_date' => $request['return_date'] ?? null,
        'old_status' => $request['status'],
        'new_status' => $new_status,
        'rejection_reason' => $rejection_reason,
        'user_id' => $user['id'],
        'timestamp' => date('Y-m-d H:i:s'),
        'title' => $new_status === 'approved' ? 'Borrow Request Approved' : 'Borrow Request Rejected',
        'message' => "Your borrow request for {$request['quantity']} x {$request['item']} has been {$new_status}" . ($rejection_reason ? ". Reason: {$rejection_reason}" : ""),
        'actionUrl' => '/my-requests'
    ];

    send_websocket_notification($user['id'], $notification_data);
}

function send_websocket_notification_to_admins($data) {
    // Send single broadcast notification for all admins
    send_websocket_notification('admin_broadcast', $data);
}

function send_websocket_notification($user_id, $data) {
    // Save notification to database first
    save_notification_to_db($user_id, $data);
    
    // Then send via WebSocket
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

function save_notification_to_db($user_id, $data) {
    global $conn;
    
    $id = generate_uuid();
    $title = $data['title'] ?? 'Notification';
    $message = $data['message'] ?? '';
    $type = $data['type'] ?? 'general';
    $action_url = $data['actionUrl'] ?? null;
    $data_json = json_encode($data);
    
    $sql = "INSERT INTO notifications (id, user_id, title, message, type, data, action_url) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    if ($stmt) {
        $stmt->bind_param('sssssss', $id, $user_id, $title, $message, $type, $data_json, $action_url);
        $stmt->execute();
        $stmt->close();
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
