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
    $result = $conn->query('SELECT * FROM inventory_equipment ORDER BY created_at DESC');

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
    $name = $conn->real_escape_string($input['name'] ?? '');
    $category = $conn->real_escape_string($input['category'] ?? '');
    $item_description = $conn->real_escape_string($input['item_description'] ?? '');
    $serial_number = $conn->real_escape_string($input['serial_number'] ?? '');
    $quantity = (int)($input['quantity'] ?? 0);
    $purpose = $conn->real_escape_string($input['purpose'] ?? '');
    $date_returned = $conn->real_escape_string($input['date_returned'] ?? '');
    $condition = $conn->real_escape_string($input['condition'] ?? '');
    $created_by = $conn->real_escape_string($input['created_by'] ?? '');

    // Generate an ID for the new record (32-char hex string)
    $id = bin2hex(random_bytes(16));

    $sql = "INSERT INTO inventory_equipment (id, date, name, category, item_description, serial_number, quantity, purpose, date_returned, `condition`, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    // id (s), date (s), name (s), category (s), item_description (s), serial_number (s), quantity (i), purpose (s), date_returned (s), condition (s), created_by (s)
    $stmt->bind_param('ssssssissss', $id, $date, $name, $category, $item_description, $serial_number, $quantity, $purpose, $date_returned, $condition, $created_by);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    send_json(['success' => true, 'id' => $id], 201);
}

function handle_put(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;

    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    $input = get_json_input();

    $date = $conn->real_escape_string($input['date'] ?? '');
    $name = $conn->real_escape_string($input['name'] ?? '');
    $category = $conn->real_escape_string($input['category'] ?? '');
    $item_description = $conn->real_escape_string($input['item_description'] ?? '');
    $serial_number = $conn->real_escape_string($input['serial_number'] ?? '');
    $quantity = (int)($input['quantity'] ?? 0);
    $purpose = $conn->real_escape_string($input['purpose'] ?? '');
    $date_returned = $conn->real_escape_string($input['date_returned'] ?? '');
    $condition = $conn->real_escape_string($input['condition'] ?? '');

    $sql = "UPDATE inventory_equipment SET date=?, name=?, category=?, item_description=?, serial_number=?, quantity=?, purpose=?, date_returned=?, `condition`=? WHERE id=?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('sssssisesss', $date, $name, $category, $item_description, $serial_number, $quantity, $purpose, $date_returned, $condition, $id);

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

    $id = $conn->real_escape_string($id);
    $sql = "DELETE FROM inventory_equipment WHERE id = ?";

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
