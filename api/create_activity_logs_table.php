<?php
require_once __DIR__ . '/db.php';

$conn = get_db_connection();

// Create activity_logs table
$sql = "CREATE TABLE IF NOT EXISTS activity_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT NOT NULL,
    related_item_type VARCHAR(50) DEFAULT NULL,
    related_item_id VARCHAR(255) DEFAULT NULL,
    details JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    INDEX idx_related_item (related_item_type, related_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql)) {
    echo "Activity logs table created successfully\n";
} else {
    echo "Error creating activity logs table: " . $conn->error . "\n";
}

$conn->close();
?>
