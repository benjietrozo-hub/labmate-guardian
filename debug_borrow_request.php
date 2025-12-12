<?php
require_once __DIR__ . '/api/db.php';
require_once __DIR__ . '/api/helpers.php';

// Enable error logging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Log the incoming request
error_log("=== DEBUG BORROW REQUEST ===");
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Request data: " . file_get_contents('php://input'));

// Get the input data
$input = get_json_input();
error_log("Parsed input: " . json_encode($input));

// Check if item field is set and what type it is
if (isset($input['item'])) {
    error_log("Item field type: " . gettype($input['item']));
    error_log("Item field value: " . var_export($input['item'], true));
} else {
    error_log("Item field is NOT set!");
}

// Check all fields
foreach ($input as $key => $value) {
    error_log("Field '$key' = " . var_export($value, true) . " (type: " . gettype($value) . ")");
}

// Try to create a test borrow request with proper item name
$test_data = [
    'borrower_name' => 'Debug Test User',
    'borrower_email' => 'debug@test.com',
    'item' => 'Test Item Name - Debug',
    'quantity' => 1,
    'request_date' => date('Y-m-d'),
    'return_date' => date('Y-m-d', strtotime('+7 days')),
    'message' => 'Debug test message',
    'status' => 'pending',
    'created_by' => 'debug-user'
];

error_log("Creating test borrow request with data: " . json_encode($test_data));

$conn = get_db_connection();

// Generate UUID
$id = generate_uuid();

// Prepare and execute the insert
$sql = "INSERT INTO borrow_requests (id, borrower_name, borrower_email, item, quantity, request_date, return_date, message, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    error_log("Prepare failed: " . $conn->error);
    echo json_encode(['success' => false, 'error' => $conn->error]);
    exit;
}

$stmt->bind_param('sssissssss', 
    $id, 
    $test_data['borrower_name'], 
    $test_data['borrower_email'], 
    $test_data['item'], 
    $test_data['quantity'], 
    $test_data['request_date'], 
    $test_data['return_date'], 
    $test_data['message'], 
    $test_data['status'], 
    $test_data['created_by']
);

if ($stmt->execute()) {
    error_log("Test borrow request created successfully with ID: $id");
    
    // Read it back to verify
    $result = $conn->query("SELECT * FROM borrow_requests WHERE id = '$id'");
    $row = $result->fetch_assoc();
    error_log("Retrieved test request: " . json_encode($row));
    
    echo json_encode(['success' => true, 'test_data' => $row]);
} else {
    error_log("Execute failed: " . $stmt->error);
    echo json_encode(['success' => false, 'error' => $stmt->error]);
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
?>
