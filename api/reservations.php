<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

class ReservationsAPI {
    private $conn;
    
    public function __construct() {
        $this->conn = get_db_connection();
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        switch ($method) {
            case 'GET':
                $this->getReservations();
                break;
            case 'POST':
                $this->createReservation();
                break;
            case 'PUT':
                $this->updateReservation();
                break;
            case 'DELETE':
                $this->deleteReservation();
                break;
            default:
                $this->sendResponse(['error' => 'Method not allowed'], 405);
        }
    }
    
    private function getReservations() {
        $equipment_id = $_GET['equipment_id'] ?? null;
        $date = $_GET['date'] ?? null;
        $user_id = $_GET['user_id'] ?? null;
        $status = $_GET['status'] ?? null;
        
        $sql = "SELECT r.*, u.first_name, u.last_name, ie.name as equipment_name 
                FROM equipment_reservations r 
                LEFT JOIN users u ON r.user_id = u.id 
                LEFT JOIN inventory_equipment ie ON r.equipment_id = ie.id 
                WHERE 1=1";
        
        $params = [];
        $types = "";
        
        if ($equipment_id) {
            $sql .= " AND r.equipment_id = ?";
            $params[] = $equipment_id;
            $types .= "s";
        }
        
        if ($date) {
            $sql .= " AND r.reservation_date = ?";
            $params[] = $date;
            $types .= "s";
        }
        
        if ($user_id) {
            $sql .= " AND r.user_id = ?";
            $params[] = $user_id;
            $types .= "i";
        }
        
        if ($status) {
            $sql .= " AND r.status = ?";
            $params[] = $status;
            $types .= "s";
        }
        
        $sql .= " ORDER BY r.reservation_date, r.start_time";
        
        $stmt = $this->conn->prepare($sql);
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $reservations = [];
        
        while ($row = $result->fetch_assoc()) {
            $reservations[] = [
                'id' => $row['id'],
                'equipment_id' => $row['equipment_id'],
                'user_id' => $row['user_id'],
                'reservation_date' => $row['reservation_date'],
                'start_time' => $row['start_time'],
                'end_time' => $row['end_time'],
                'quantity_reserved' => $row['quantity_reserved'],
                'purpose' => $row['purpose'],
                'status' => $row['status'],
                'approved_by' => $row['approved_by'],
                'approved_at' => $row['approved_at'],
                'rejection_reason' => $row['rejection_reason'],
                'notes' => $row['notes'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'user_name' => trim($row['first_name'] . ' ' . $row['last_name']),
                'equipment_name' => $row['equipment_name']
            ];
        }
        
        $this->sendResponse(['reservations' => $reservations]);
    }
    
    private function createReservation() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            $this->sendResponse(['error' => 'Invalid JSON data'], 400);
            return;
        }
        
        $required_fields = ['equipment_id', 'user_id', 'reservation_date', 'start_time', 'end_time', 'quantity_reserved'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $this->sendResponse(['error' => "Missing required field: $field"], 400);
                return;
            }
        }
        
        // Check for conflicts
        if ($this->hasConflicts($data)) {
            $this->sendResponse(['error' => 'Reservation conflicts with existing bookings'], 409);
            return;
        }
        
        // Check equipment availability
        if (!$this->checkEquipmentAvailability($data['equipment_id'], $data['reservation_date'], $data['start_time'], $data['end_time'], $data['quantity_reserved'])) {
            $this->sendResponse(['error' => 'Insufficient equipment quantity available'], 409);
            return;
        }
        
        // Get system settings
        $auto_approve = $this->getSetting('reservation_auto_approve') === 'true';
        $require_approval = $this->getSetting('reservation_require_approval') === 'true';
        
        $status = 'pending';
        if ($auto_approve && !$require_approval) {
            $status = 'approved';
        }
        
        $id = $this->generateUUID();
        
        $sql = "INSERT INTO equipment_reservations (id, equipment_id, user_id, reservation_date, start_time, end_time, quantity_reserved, purpose, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ssississs", 
            $id, 
            $data['equipment_id'], 
            $data['user_id'], 
            $data['reservation_date'], 
            $data['start_time'], 
            $data['end_time'], 
            $data['quantity_reserved'], 
            $data['purpose'] ?? null, 
            $status
        );
        
        if ($stmt->execute()) {
            $reservation = $this->getReservationById($id);
            $this->sendResponse(['success' => true, 'reservation' => $reservation], 201);
        } else {
            $this->sendResponse(['error' => 'Failed to create reservation'], 500);
        }
    }
    
    private function updateReservation() {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            $this->sendResponse(['error' => 'Reservation ID required'], 400);
            return;
        }
        
        if (!$data) {
            $this->sendResponse(['error' => 'Invalid JSON data'], 400);
            return;
        }
        
        $allowed_fields = ['status', 'approved_by', 'rejection_reason', 'notes'];
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
        
        // Add approved_at if status is being changed to approved
        if (isset($data['status']) && $data['status'] === 'approved') {
            $updates[] = "approved_at = NOW()";
        }
        
        $params[] = $id;
        $types .= "s";
        
        $sql = "UPDATE equipment_reservations SET " . implode(', ', $updates) . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            $reservation = $this->getReservationById($id);
            $this->sendResponse(['success' => true, 'reservation' => $reservation]);
        } else {
            $this->sendResponse(['error' => 'Failed to update reservation'], 500);
        }
    }
    
    private function deleteReservation() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            $this->sendResponse(['error' => 'Reservation ID required'], 400);
            return;
        }
        
        $sql = "DELETE FROM equipment_reservations WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $id);
        
        if ($stmt->execute()) {
            $this->sendResponse(['success' => true, 'message' => 'Reservation deleted']);
        } else {
            $this->sendResponse(['error' => 'Failed to delete reservation'], 500);
        }
    }
    
    private function hasConflicts($data) {
        $sql = "SELECT COUNT(*) as count FROM equipment_reservations 
                WHERE equipment_id = ? AND reservation_date = ? AND status = 'approved'
                AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ssssssss", 
            $data['equipment_id'], 
            $data['reservation_date'], 
            $data['start_time'], 
            $data['start_time'], 
            $data['end_time'], 
            $data['end_time'], 
            $data['start_time'], 
            $data['end_time']
        );
        
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        return $row['count'] > 0;
    }
    
    private function checkEquipmentAvailability($equipment_id, $date, $start_time, $end_time, $quantity) {
        // Get total equipment quantity
        $sql = "SELECT quantity FROM inventory_equipment WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $equipment_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $equipment = $result->fetch_assoc();
        
        if (!$equipment) {
            return false;
        }
        
        // Get total reserved quantity for the time slot
        $sql = "SELECT SUM(quantity_reserved) as total_reserved FROM equipment_reservations 
                WHERE equipment_id = ? AND reservation_date = ? AND status = 'approved'
                AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ssssssss", 
            $equipment_id, 
            $date, 
            $start_time, 
            $start_time, 
            $end_time, 
            $end_time, 
            $start_time, 
            $end_time
        );
        
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        $total_reserved = $row['total_reserved'] ?? 0;
        
        return ($total_reserved + $quantity) <= $equipment['quantity'];
    }
    
    private function getReservationById($id) {
        $sql = "SELECT r.*, u.first_name, u.last_name, ie.name as equipment_name 
                FROM equipment_reservations r 
                LEFT JOIN users u ON r.user_id = u.id 
                LEFT JOIN inventory_equipment ie ON r.equipment_id = ie.id 
                WHERE r.id = ?";
        
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
                'reservation_date' => $row['reservation_date'],
                'start_time' => $row['start_time'],
                'end_time' => $row['end_time'],
                'quantity_reserved' => $row['quantity_reserved'],
                'purpose' => $row['purpose'],
                'status' => $row['status'],
                'approved_by' => $row['approved_by'],
                'approved_at' => $row['approved_at'],
                'rejection_reason' => $row['rejection_reason'],
                'notes' => $row['notes'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'user_name' => trim($row['first_name'] . ' ' . $row['last_name']),
                'equipment_name' => $row['equipment_name']
            ];
        }
        
        return null;
    }
    
    private function getSetting($key) {
        $sql = "SELECT setting_value FROM system_settings WHERE setting_key = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $key);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        return $row['setting_value'] ?? null;
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

$api = new ReservationsAPI();
$api->handleRequest();
?>
