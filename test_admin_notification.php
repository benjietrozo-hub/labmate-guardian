<?php
require_once __DIR__ . '/api/db.php';
require_once __DIR__ . '/api/helpers.php';

// Test data for a new borrow request
$test_request = [
    'borrower_name' => 'Test User (test@example.com)',
    'borrower_email' => 'test@example.com',
    'item' => 'Test Equipment',
    'quantity' => 2,
    'request_date' => date('Y-m-d'),
    'return_date' => date('Y-m-d', strtotime('+7 days')),
    'message' => 'Test notification message',
    'status' => 'pending',
    'created_by' => 'test-user-id'
];

// Simulate sending a borrow request notification
$conn = get_db_connection();

// Generate UUID for the test request
$id = generate_uuid();

// Insert test borrow request
$sql = "INSERT INTO borrow_requests (id, borrower_name, borrower_email, item, quantity, request_date, return_date, message, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param('sssissssss', $id, $test_request['borrower_name'], $test_request['borrower_email'], $test_request['item'], $test_request['quantity'], $test_request['request_date'], $test_request['return_date'], $test_request['message'], $test_request['status'], $test_request['created_by']);

if ($stmt->execute()) {
    echo "Test borrow request created successfully.\n";
    
    // Test the notification function
    send_consolidated_borrow_notifications($id, $test_request['borrower_name'], $test_request['borrower_email'], $test_request['item'], $test_request['quantity']);
    
    echo "Admin notification sent to WebSocket server.\n";
    echo "Check the WebSocket server console output to verify the notification includes title and message fields.\n";
    
    // Clean up - delete the test request
    $delete_sql = "DELETE FROM borrow_requests WHERE id=?";
    $delete_stmt = $conn->prepare($delete_sql);
    $delete_stmt->bind_param('s', $id);
    $delete_stmt->execute();
    
    echo "Test request cleaned up.\n";
} else {
    echo "Error creating test request: " . $stmt->error . "\n";
}

$stmt->close();
$conn->close();

function generate_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
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
    
    if (!$user) {
        echo "User not found for email: $borrower_email\n";
        return;
    }

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
    
    echo "Notification data prepared:\n";
    print_r($admin_notification_data);
    
    send_websocket_notification_to_admins($admin_notification_data);
}

function send_websocket_notification_to_admins($data) {
    // Send single broadcast notification for all admins
    send_websocket_notification('admin_broadcast', $data);
}

function send_websocket_notification($user_id, $data) {
    $ch = curl_init();
    
    $notification = [
        'user_id' => $user_id,
        'data' => $data
    ];
    
    echo "Sending notification to WebSocket server:\n";
    echo "URL: http://localhost:8081/notify\n";
    echo "Payload: " . json_encode($notification, JSON_PRETTY_PRINT) . "\n";
    
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:8081/notify');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($notification));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    echo "WebSocket server response: $response\n";
    echo "HTTP status code: $http_code\n";
    
    if (curl_errno($ch)) {
        echo "Curl error: " . curl_error($ch) . "\n";
    }
    
    curl_close($ch);
}
?>
