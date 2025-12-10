<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';
require_once 'helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'error' => 'Method not allowed'], 405);
    return;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['user_id']) || !isset($data['current_password']) || !isset($data['new_password'])) {
    send_json(['success' => false, 'error' => 'Missing required fields'], 400);
    return;
}

$user_id = $data['user_id'];
$current_password = $data['current_password'];
$new_password = $data['new_password'];

if (strlen($new_password) < 6) {
    send_json(['success' => false, 'error' => 'Password must be at least 6 characters long'], 400);
    return;
}

try {
    $conn = get_db_connection();
    
    // Get current user data
    $sql = "SELECT password FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        send_json(['success' => false, 'error' => 'User not found'], 404);
        return;
    }
    
    $user = $result->fetch_assoc();
    
    // Verify current password
    if (!password_verify($current_password, $user['password'])) {
        send_json(['success' => false, 'error' => 'Current password is incorrect'], 400);
        return;
    }
    
    // Hash new password
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Update password
    $update_sql = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param('ss', $hashed_password, $user_id);
    
    if ($update_stmt->execute()) {
        send_json(['success' => true, 'message' => 'Password reset successfully']);
    } else {
        send_json(['success' => false, 'error' => 'Failed to update password'], 500);
    }
    
    $stmt->close();
    $update_stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    send_json(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
