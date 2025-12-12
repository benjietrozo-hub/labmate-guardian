<?php
require_once __DIR__ . '/db.php';

$conn = get_db_connection();

// Create repair_maintenance table
$sql = "CREATE TABLE IF NOT EXISTS repair_maintenance (
    id CHAR(36) NOT NULL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    item_id VARCHAR(255) DEFAULT NULL,
    item_type VARCHAR(50) NOT NULL,
    condition_status ENUM('damaged', 'needs_repair') NOT NULL,
    description TEXT DEFAULT NULL,
    reported_by CHAR(36) NOT NULL,
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    assigned_to CHAR(36) DEFAULT NULL,
    assigned_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    completion_notes TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_reported_by (reported_by),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_reported_at (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql)) {
    echo "Repair maintenance table created successfully\n";
} else {
    echo "Error creating repair maintenance table: " . $conn->error . "\n";
}

$conn->close();
?>
