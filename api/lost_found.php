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
    $result = $conn->query('SELECT * FROM lost_found ORDER BY created_at DESC');
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
    $time = $conn->real_escape_string($input['time'] ?? '');
    $item_description = $conn->real_escape_string($input['item_description'] ?? '');
    $finders_name = $conn->real_escape_string($input['finders_name'] ?? '');
    $owner_name = $conn->real_escape_string($input['owner_name'] ?? '');
    $cell_number = $conn->real_escape_string($input['cell_number'] ?? '');
    $date_claimed = $conn->real_escape_string($input['date_claimed'] ?? null);
    $signature = $conn->real_escape_string($input['signature'] ?? '');
    $created_by = $conn->real_escape_string($input['created_by'] ?? '');

    $sql = "INSERT INTO lost_found (id, date, time, item_description, finders_name, owner_name, cell_number, date_claimed, signature, created_by, created_at) VALUES (UUID(),?,?,?,?,?,?,?,?,?,NOW())";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('sssssssss', $date, $time, $item_description, $finders_name, $owner_name, $cell_number, $date_claimed, $signature, $created_by);

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
    $time = $conn->real_escape_string($input['time'] ?? '');
    $item_description = $conn->real_escape_string($input['item_description'] ?? '');
    $finders_name = $conn->real_escape_string($input['finders_name'] ?? '');
    $owner_name = $conn->real_escape_string($input['owner_name'] ?? '');
    $cell_number = $conn->real_escape_string($input['cell_number'] ?? '');
    $date_claimed = $conn->real_escape_string($input['date_claimed'] ?? null);
    $signature = $conn->real_escape_string($input['signature'] ?? '');

    $sql = "UPDATE lost_found SET date=?, time=?, item_description=?, finders_name=?, owner_name=?, cell_number=?, date_claimed=?, signature=? WHERE id=?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('sssssssss', $date, $time, $item_description, $finders_name, $owner_name, $cell_number, $date_claimed, $signature, $id);

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

    $sql = "DELETE FROM lost_found WHERE id=?";
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
