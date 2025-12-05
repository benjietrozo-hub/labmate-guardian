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
    $result = $conn->query('SELECT * FROM incident_reports ORDER BY created_at DESC');
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

    $article = $conn->real_escape_string($input['article'] ?? '');
    $description = $conn->real_escape_string($input['description'] ?? '');
    $serial_number = $conn->real_escape_string($input['serial_number'] ?? '');
    $date_acquired = $conn->real_escape_string($input['date_acquired'] ?? null);
    $po_number = $conn->real_escape_string($input['po_number'] ?? '');
    $property_number = $conn->real_escape_string($input['property_number'] ?? '');
    $new_property_number = $conn->real_escape_string($input['new_property_number'] ?? '');
    $unit_of_measure = $conn->real_escape_string($input['unit_of_measure'] ?? '');
    $unit_value = $input['unit_value'] !== null ? (float)$input['unit_value'] : null;
    $balance_per_card_qty = $input['balance_per_card_qty'] !== null ? (int)$input['balance_per_card_qty'] : null;
    $on_hand_per_card_qty = $input['on_hand_per_card_qty'] !== null ? (int)$input['on_hand_per_card_qty'] : null;
    $total_value = $input['total_value'] !== null ? (float)$input['total_value'] : null;
    $accredited_to = $conn->real_escape_string($input['accredited_to'] ?? '');
    $remarks = $conn->real_escape_string($input['remarks'] ?? '');
    $created_by = $conn->real_escape_string($input['created_by'] ?? '');

    $sql = "INSERT INTO incident_reports (id, article, description, serial_number, date_acquired, po_number, property_number, new_property_number, unit_of_measure, unit_value, balance_per_card_qty, on_hand_per_card_qty, total_value, accredited_to, remarks, created_by, created_at) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('sssssss sdd i i d ss s', $article, $description, $serial_number, $date_acquired, $po_number, $property_number, $new_property_number, $unit_of_measure, $unit_value, $balance_per_card_qty, $on_hand_per_card_qty, $total_value, $accredited_to, $remarks, $created_by);

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

    $article = $conn->real_escape_string($input['article'] ?? '');
    $description = $conn->real_escape_string($input['description'] ?? '');
    $serial_number = $conn->real_escape_string($input['serial_number'] ?? '');
    $date_acquired = $conn->real_escape_string($input['date_acquired'] ?? null);
    $po_number = $conn->real_escape_string($input['po_number'] ?? '');
    $property_number = $conn->real_escape_string($input['property_number'] ?? '');
    $new_property_number = $conn->real_escape_string($input['new_property_number'] ?? '');
    $unit_of_measure = $conn->real_escape_string($input['unit_of_measure'] ?? '');
    $unit_value = $input['unit_value'] !== null ? (float)$input['unit_value'] : null;
    $balance_per_card_qty = $input['balance_per_card_qty'] !== null ? (int)$input['balance_per_card_qty'] : null;
    $on_hand_per_card_qty = $input['on_hand_per_card_qty'] !== null ? (int)$input['on_hand_per_card_qty'] : null;
    $total_value = $input['total_value'] !== null ? (float)$input['total_value'] : null;
    $accredited_to = $conn->real_escape_string($input['accredited_to'] ?? '');
    $remarks = $conn->real_escape_string($input['remarks'] ?? '');

    $sql = "UPDATE incident_reports SET article=?, description=?, serial_number=?, date_acquired=?, po_number=?, property_number=?, new_property_number=?, unit_of_measure=?, unit_value=?, balance_per_card_qty=?, on_hand_per_card_qty=?, total_value=?, accredited_to=?, remarks=? WHERE id=?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('sssssss d i i d ss s', $article, $description, $serial_number, $date_acquired, $po_number, $property_number, $new_property_number, $unit_of_measure, $unit_value, $balance_per_card_qty, $on_hand_per_card_qty, $total_value, $accredited_to, $remarks, $id);

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

    $sql = "DELETE FROM incident_reports WHERE id=?";
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
