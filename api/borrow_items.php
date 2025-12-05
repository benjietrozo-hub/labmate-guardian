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
    $result = $conn->query('SELECT * FROM borrow_items ORDER BY created_at DESC');
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

    $borrower_name = $conn->real_escape_string($input['borrower_name'] ?? '');
    $item = $conn->real_escape_string($input['item'] ?? '');
    $quantity = (int)($input['quantity'] ?? 1);
    $borrow_date = $conn->real_escape_string($input['borrow_date'] ?? '');
    $return_date = $conn->real_escape_string($input['return_date'] ?? null);
    $status = $conn->real_escape_string($input['status'] ?? 'Borrowed');
    $created_by = $conn->real_escape_string($input['created_by'] ?? '');

    $sql = "INSERT INTO borrow_items (id, borrower_name, item, quantity, borrow_date, return_date, status, created_by, created_at) VALUES (UUID(),?,?,?,?,?,?,?,NOW())";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('ssissss', $borrower_name, $item, $quantity, $borrow_date, $return_date, $status, $created_by);

    if (!$stmt->execute()) {
        send_json(['success' => false, 'error' => $stmt->error], 500);
    }

    // Notify admins about new borrow transaction
    send_notification([
        'type' => 'borrow_created',
        'title' => 'New borrow transaction',
        'message' => "A new item was borrowed by {$borrower_name}.",
        'target' => 'admin',
    ]);

    send_json(['success' => true], 201);
}

function handle_put(mysqli $conn): void {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = $query['id'] ?? null;
    if (!$id) {
        send_json(['success' => false, 'error' => 'Missing id'], 400);
    }

    $input = get_json_input();

    $borrower_name = $conn->real_escape_string($input['borrower_name'] ?? '');
    $item = $conn->real_escape_string($input['item'] ?? '');
    $quantity = (int)($input['quantity'] ?? 1);
    $borrow_date = $conn->real_escape_string($input['borrow_date'] ?? '');
    $return_date = $conn->real_escape_string($input['return_date'] ?? null);
    $status = $conn->real_escape_string($input['status'] ?? 'Borrowed');

    $sql = "UPDATE borrow_items SET borrower_name=?, item=?, quantity=?, borrow_date=?, return_date=?, status=? WHERE id=?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(['success' => false, 'error' => $conn->error], 500);
    }

    $stmt->bind_param('ssissss', $borrower_name, $item, $quantity, $borrow_date, $return_date, $status, $id);

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

    $sql = "DELETE FROM borrow_items WHERE id=?";
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
