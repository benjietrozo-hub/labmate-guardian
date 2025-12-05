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
    case 'DELETE':
        handle_delete($conn);
        break;
    default:
        send_json(['success' => false, 'error' => 'Method not allowed'], 405);
}

function handle_get(mysqli $conn): void {
    $result = $conn->query('SELECT * FROM repair_maintenance ORDER BY created_at DESC');
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

    $date = $conn->real_escape_string($input['date'] ?? '');
    $equipment_name = $conn->real_escape_string($input['equipment_name'] ?? '');
    $serial_number = $conn->real_escape_string($input['serial_number'] ?? '');
    $issue_description = $conn->real_escape_string($input['issue_description'] ?? '');
    $action_taken = $conn->real_escape_string($input['action_taken'] ?? '');
    $technician_name = $conn->real_escape_string($input['technician_name'] ?? '');
    $status = $conn->real_escape_string($input['status'] ?? 'Pending');
    $created_by = $conn->real_escape_string($input['created_by'] ?? '');

    $sql = "INSERT INTO repair_maintenance (id, date, equipment_name, serial_number, issue_description, action_taken, technician_name, status, created_by, created_at) VALUES (UUID(),?,?,?,?,?,?,?,?,NOW())";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('ssssssss', $date, $equipment_name, $serial_number, $issue_description, $action_taken, $technician_name, $status, $created_by);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    send_json(['success' => true], 201);
}

function handle_put(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;
    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    $input = get_json_input();

    $date = $conn->real_escape_string($input['date'] ?? '');
    $equipment_name = $conn->real_escape_string($input['equipment_name'] ?? '');
    $serial_number = $conn->real_escape_string($input['serial_number'] ?? '');
    $issue_description = $conn->real_escape_string($input['issue_description'] ?? '');
    $action_taken = $conn->real_escape_string($input['action_taken'] ?? '');
    $technician_name = $conn->real_escape_string($input['technician_name'] ?? '');
    $status = $conn->real_escape_string($input['status'] ?? 'Pending');

    $sql = "UPDATE repair_maintenance SET date=?, equipment_name=?, serial_number=?, issue_description=?, action_taken=?, technician_name=?, status=? WHERE id=?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('ssssssss', $date, $equipment_name, $serial_number, $issue_description, $action_taken, $technician_name, $status, $id);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    send_json(['success' => true]);
}

function handle_delete(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;
    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    $sql = "DELETE FROM repair_maintenance WHERE id=?";
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
