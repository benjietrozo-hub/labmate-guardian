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
    default:
        send_json(['success' => false, 'error' => 'Method not allowed'], 405);
}

function handle_get(mysqli $conn): void {
    $result = $conn->query("SELECT setting_key, setting_value, description FROM system_settings");
    if (!$result) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $settings = [];
    while ($row = $result->fetch_assoc()) {
        $settings[$row['setting_key']] = [
            'value' => $row['setting_value'],
            'description' => $row['description']
        ];
    }

    send_json(['success' => true, 'data' => $settings]);
}

function handle_post(mysqli $conn): void {
    $input = get_json_input();
    
    $setting_key = $input['setting_key'] ?? '';
    $setting_value = $input['setting_value'] ?? '';
    $description = $input['description'] ?? '';

    if ($setting_key === '') {
        send_json(['success' => false, 'error' => 'Setting key is required'], 400);
    }

    $stmt = $conn->prepare('INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, description = ?');
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }
    
    $stmt->bind_param('sssss', $setting_key, $setting_value, $description, $setting_value, $description);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    send_json(['success' => true, 'message' => 'Setting saved successfully']);
}

function handle_put(mysqli $conn): void {
    $input = get_json_input();
    
    foreach ($input as $setting_key => $data) {
        if (!isset($data['value'])) {
            continue;
        }
        
        $setting_value = $data['value'];
        $description = $data['description'] ?? null;
        
        $stmt = $conn->prepare('INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, description = ?, updated_at = CURRENT_TIMESTAMP');
        if (!$stmt) {
            send_json(['success' => false, 'error' => $conn->error], 500);
        }
        
        $stmt->bind_param('sssss', $setting_key, $setting_value, $description, $setting_value, $description);
        
        if (!$stmt->execute()) {
            send_json(['success' => false, 'error' => $stmt->error], 500);
        }
    }

    send_json(['success' => true, 'message' => 'Settings updated successfully']);
}
