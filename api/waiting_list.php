<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

class WaitingListAPI {
    private $conn;
    
    public function __construct() {
        $this->conn = get_db_connection();
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        switch ($method) {
            case 'GET':
                $this->getWaitingList();
                break;
            case 'POST':
                $this->createWaitingListEntry();
                break;
            case 'PUT':
                $this->updateWaitingListEntry();
                break;
            case 'DELETE':
                $this->deleteWaitingListEntry();
                break;
            default:
                $this->sendResponse(['error' => 'Method not allowed'], 405);
        }
    }
    
    private function getWaitingList() {
        $equipment_id = $_GET['equipment_id'] ?? null;
        $user_id = $_GET['user_id'] ?? null;
        $status = $_GET['status'] ?? null;
        
        $sql = "SELECT w.*, u.first_name, u.last_name, ie.name as equipment_name 
                FROM reservation_waiting_list w 
                LEFT JOIN users u ON w.user_id = u.id 
                LEFT JOIN inventory_equipment ie ON w.equipment_id = ie.id 
                WHERE 1=1";
        
        $params = [];
        $types = "";
        
        if ($equipment_id) {
            $sql .= " AND w.equipment_id = ?";
            $params[] = $equipment_id;
            $types .= "s";
        }
        
        if ($user_id) {
            $sql .= " AND w.user_id = ?";
            $params[] = $user_id;
            $types .= "i";
        }
        
        if ($status) {
            $sql .= " AND w.status = ?";
            $params[] = $status;
            $types .= "s";
        }
        
        $sql .= " ORDER BY w.priority DESC, w.created_at ASC";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $entries = [];
        
        while ($row = $result->fetch_assoc()) {
            $entries[] = [
                'id' => $row['id'],
                'equipment_id' => $row['equipment_id'],
                'user_id' => $row['user_id'],
                'quantity_needed' => $row['quantity_needed'],
                'preferred_date' => $row['preferred_date'],
                'preferred_start_time' => $row['preferred_start_time'],
                'preferred_end_time' => $row['preferred_end_time'],
                'purpose' => $row['purpose'],
                'priority' => $row['priority'],
                'status' => $row['status'],
                'notified_at' => $row['notified_at'],
                'fulfilled_at' => $row['fulfilled_at'],
                'notes' => $row['notes'],
                'created_at' => $row['created_at'],
                'user_name' => trim($row['first_name'] . ' ' . $row['last_name']),
                'equipment_name' => $row['equipment_name']
            ];
        }
        
        $this->sendResponse(['entries' => $entries]);
    }
    
    private function createWaitingListEntry() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            $this->sendResponse(['error' => 'Invalid JSON data'], 400);
            return;
        }
        
        $required_fields = ['equipment_id', 'user_id', 'quantity_needed'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $this->sendResponse(['error' => "Missing required field: $field"], 400);
                return;
            }
        }
        
        // Check if user already has a waiting list entry for this equipment
        if ($this->hasExistingEntry($data['equipment_id'], $data['user_id'])) {
            $this->sendResponse(['error' => 'You already have a waiting list entry for this equipment'], 409);
            return;
        }
        
        $id = $this->generateUUID();
        
        $sql = "INSERT INTO reservation_waiting_list (id, equipment_id, user_id, quantity_needed, preferred_date, preferred_start_time, preferred_end_time, purpose, priority, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ssisssssss", 
            $id, 
            $data['equipment_id'], 
            $data['user_id'], 
            $data['quantity_needed'], 
            $data['preferred_date'] ?? null, 
            $data['preferred_start_time'] ?? null, 
            $data['preferred_end_time'] ?? null, 
            $data['purpose'] ?? null, 
            $data['priority'] ?? 'medium', 
            $data['status'] ?? 'waiting'
        );
        
        if ($stmt->execute()) {
            $entry = $this->getWaitingListEntryById($id);
            $this->sendResponse(['success' => true, 'entry' => $entry], 201);
        } else {
            $this->sendResponse(['error' => 'Failed to create waiting list entry'], 500);
        }
    }
    
    private function updateWaitingListEntry() {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            $this->sendResponse(['error' => 'Entry ID required'], 400);
            return;
        }
        
        if (!$data) {
            $this->sendResponse(['error' => 'Invalid JSON data'], 400);
            return;
        }
        
        $allowed_fields = ['status', 'notified_at', 'fulfilled_at', 'notes'];
        $updates = [];
        $params = [];
        $types = "";
        
        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
                $types .= "s";
            }
        }
        
        if (empty($updates)) {
            $this->sendResponse(['error' => 'No valid fields to update'], 400);
            return;
        }
        
        // Add timestamps for status changes
        if (isset($data['status'])) {
            if ($data['status'] === 'notified' && !isset($data['notified_at'])) {
                $updates[] = "notified_at = NOW()";
            }
            if ($data['status'] === 'fulfilled' && !isset($data['fulfilled_at'])) {
                $updates[] = "fulfilled_at = NOW()";
            }
        }
        
        $params[] = $id;
        $types .= "s";
        
        $sql = "UPDATE reservation_waiting_list SET " . implode(', ', $updates) . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            $entry = $this->getWaitingListEntryById($id);
            $this->sendResponse(['success' => true, 'entry' => $entry]);
        } else {
            $this->sendResponse(['error' => 'Failed to update waiting list entry'], 500);
        }
    }
    
    private function deleteWaitingListEntry() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            $this->sendResponse(['error' => 'Entry ID required'], 400);
            return;
        }
        
        $sql = "DELETE FROM reservation_waiting_list WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $id);
        
        if ($stmt->execute()) {
            $this->sendResponse(['success' => true, 'message' => 'Waiting list entry deleted']);
        } else {
            $this->sendResponse(['error' => 'Failed to delete waiting list entry'], 500);
        }
    }
    
    private function hasExistingEntry($equipment_id, $user_id) {
        $sql = "SELECT COUNT(*) as count FROM reservation_waiting_list 
                WHERE equipment_id = ? AND user_id = ? AND status IN ('waiting', 'notified')";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("si", $equipment_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        return $row['count'] > 0;
    }
    
    private function getWaitingListEntryById($id) {
        $sql = "SELECT w.*, u.first_name, u.last_name, ie.name as equipment_name 
                FROM reservation_waiting_list w 
                LEFT JOIN users u ON w.user_id = u.id 
                LEFT JOIN inventory_equipment ie ON w.equipment_id = ie.id 
                WHERE w.id = ?";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row) {
            return [
                'id' => $row['id'],
                'equipment_id' => $row['equipment_id'],
                'user_id' => $row['user_id'],
                'quantity_needed' => $row['quantity_needed'],
                'preferred_date' => $row['preferred_date'],
                'preferred_start_time' => $row['preferred_start_time'],
                'preferred_end_time' => $row['preferred_end_time'],
                'purpose' => $row['purpose'],
                'priority' => $row['priority'],
                'status' => $row['status'],
                'notified_at' => $row['notified_at'],
                'fulfilled_at' => $row['fulfilled_at'],
                'notes' => $row['notes'],
                'created_at' => $row['created_at'],
                'user_name' => trim($row['first_name'] . ' ' . $row['last_name']),
                'equipment_name' => $row['equipment_name']
            ];
        }
        
        return null;
    }
    
    private function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    private function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }
}

$api = new WaitingListAPI();
$api->handleRequest();
?>
