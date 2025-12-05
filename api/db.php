<?php
require_once __DIR__ . '/config.php';

function get_db_connection(): mysqli {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

    if ($conn->connect_error) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed: ' . $conn->connect_error,
        ]);
        exit;
    }

    $conn->set_charset('utf8mb4');
    return $conn;
}
