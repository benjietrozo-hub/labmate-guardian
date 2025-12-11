<?php
require_once 'api/db.php';

$conn = get_db_connection();

try {
    // Add missing columns if they don't exist
    $result = $conn->query("SHOW COLUMNS FROM borrow_items LIKE 'approved_by'");
    if ($result->num_rows == 0) {
        $conn->query('ALTER TABLE borrow_items ADD COLUMN approved_by varchar(36) DEFAULT NULL AFTER status');
        echo "Added approved_by column\n";
    }
    
    $result = $conn->query("SHOW COLUMNS FROM borrow_items LIKE 'approved_at'");
    if ($result->num_rows == 0) {
        $conn->query('ALTER TABLE borrow_items ADD COLUMN approved_at datetime DEFAULT NULL AFTER approved_by');
        echo "Added approved_at column\n";
    }
    
    $result = $conn->query("SHOW COLUMNS FROM borrow_items LIKE 'rejection_reason'");
    if ($result->num_rows == 0) {
        $conn->query('ALTER TABLE borrow_items ADD COLUMN rejection_reason text DEFAULT NULL AFTER approved_at');
        echo "Added rejection_reason column\n";
    }
    
    // Update status column default
    $conn->query('ALTER TABLE borrow_items MODIFY COLUMN status varchar(20) DEFAULT "pending"');
    echo "Updated status column default\n";
    
    echo "Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$conn = null;
?>
