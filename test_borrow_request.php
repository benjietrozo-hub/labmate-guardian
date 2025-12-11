<?php
// Test creating a real borrow request to trigger admin notifications
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Starting test...\n";

require_once __DIR__ . '/api/db.php';
echo "Database connection loaded\n";

$conn = get_db_connection();
if ($conn->connect_error) {
    echo "Database connection failed: " . $conn->connect_error . "\n";
    exit;
}
echo "Database connected\n";

// Simulate creating a borrow request
$borrower_name = 'Test Student (test@student.com)';
$item = 'Laptop';
$quantity = 1;
$borrow_id = 'test-borrow-' . date('Y-m-d-H-i-s');

echo "Creating borrow request: $borrow_id\n";

// Insert a test borrow request
$sql = "INSERT INTO borrow_items (id, borrower_name, item, quantity, borrow_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
if ($stmt) {
    $borrow_date = date('Y-m-d');
    $status = 'pending';
    $created_by = 'test-user-id';
    
    $stmt->bind_param('sssisss', $borrow_id, $borrower_name, $item, $quantity, $borrow_date, $status, $created_by);
    
    if ($stmt->execute()) {
        echo "Test borrow request created successfully\n";
        
        // Now trigger the admin notification (this is what happens automatically)
        echo "Loading borrow_items.php functions...\n";
        require_once __DIR__ . '/api/borrow_items.php';
        
        // Call the admin notification function
        echo "Calling send_admin_notification...\n";
        send_admin_notification($conn, $borrower_name, $item, $quantity, $borrow_id);
        
        echo "Admin notification sent\n";
    } else {
        echo "Failed to create test borrow request: " . $stmt->error . "\n";
    }
    $stmt->close();
} else {
    echo "Failed to prepare statement: " . $conn->error . "\n";
}

$conn->close();
echo "Test completed\n";
?>