<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

class AnalyticsAPI {
    private $conn;
    
    public function __construct() {
        $this->conn = get_db_connection();
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        switch ($method) {
            case 'GET':
                $this->getAnalytics();
                break;
            default:
                $this->sendResponse(['error' => 'Method not allowed'], 405);
        }
    }
    
    private function getAnalytics() {
        $type = $_GET['type'] ?? 'overview';
        $date_range = $_GET['date_range'] ?? '30';
        $equipment_id = $_GET['equipment_id'] ?? null;
        $user_id = $_GET['user_id'] ?? null;
        
        switch ($type) {
            case 'overview':
                $this->getOverviewStats();
                break;
            case 'equipment_usage':
                $this->getEquipmentUsage($equipment_id);
                break;
            case 'peak_times':
                $this->getPeakTimes($date_range);
                break;
            case 'user_patterns':
                $this->getUserPatterns($date_range);
                break;
            case 'trends':
                $this->getTrends($date_range);
                break;
            case 'user_analytics':
                $this->getUserAnalytics($user_id, $date_range);
                break;
            default:
                $this->sendResponse(['error' => 'Invalid analytics type'], 400);
        }
    }
    
    private function getOverviewStats() {
        $stats = [];
        
        // Total reservations
        $sql = "SELECT COUNT(*) as total FROM equipment_reservations";
        $result = $this->conn->query($sql);
        $stats['total_reservations'] = $result->fetch_assoc()['total'];
        
        // Approved reservations
        $sql = "SELECT COUNT(*) as approved FROM equipment_reservations WHERE status = 'approved'";
        $result = $this->conn->query($sql);
        $stats['approved_reservations'] = $result->fetch_assoc()['approved'];
        
        // Pending reservations
        $sql = "SELECT COUNT(*) as pending FROM equipment_reservations WHERE status = 'pending'";
        $result = $this->conn->query($sql);
        $stats['pending_reservations'] = $result->fetch_assoc()['pending'];
        
        // Total equipment items
        $sql = "SELECT COUNT(*) as total FROM inventory_equipment";
        $result = $this->conn->query($sql);
        $stats['total_equipment'] = $result->fetch_assoc()['total'];
        
        // Equipment with reservations
        $sql = "SELECT COUNT(DISTINCT equipment_id) as reserved FROM equipment_reservations";
        $result = $this->conn->query($sql);
        $stats['equipment_with_reservations'] = $result->fetch_assoc()['reserved'];
        
        // Average reservation duration (in hours)
        $sql = "SELECT AVG(TIMESTAMPDIFF(HOUR, CONCAT(reservation_date, ' ', start_time), CONCAT(reservation_date, ' ', end_time))) as avg_duration FROM equipment_reservations WHERE status IN ('approved', 'completed')";
        $result = $this->conn->query($sql);
        $stats['avg_reservation_duration'] = round($result->fetch_assoc()['avg_duration'], 1);
        
        // Most popular equipment
        $sql = "SELECT ie.name, COUNT(*) as reservation_count 
                FROM equipment_reservations er 
                JOIN inventory_equipment ie ON er.equipment_id = ie.id 
                GROUP BY er.equipment_id, ie.name 
                ORDER BY reservation_count DESC 
                LIMIT 5";
        $result = $this->conn->query($sql);
        $stats['popular_equipment'] = [];
        while ($row = $result->fetch_assoc()) {
            $stats['popular_equipment'][] = [
                'name' => $row['name'],
                'count' => $row['reservation_count']
            ];
        }
        
        // Recent activity
        $sql = "SELECT er.*, u.first_name, u.last_name, ie.name as equipment_name 
                FROM equipment_reservations er 
                LEFT JOIN users u ON er.user_id = u.id 
                LEFT JOIN inventory_equipment ie ON er.equipment_id = ie.id 
                ORDER BY er.created_at DESC 
                LIMIT 10";
        $result = $this->conn->query($sql);
        $stats['recent_activity'] = [];
        while ($row = $result->fetch_assoc()) {
            $stats['recent_activity'][] = [
                'id' => $row['id'],
                'equipment_name' => $row['equipment_name'],
                'user_name' => trim($row['first_name'] . ' ' . $row['last_name']),
                'status' => $row['status'],
                'reservation_date' => $row['reservation_date'],
                'created_at' => $row['created_at']
            ];
        }
        
        $this->sendResponse(['stats' => $stats]);
    }
    
    private function getEquipmentUsage($equipment_id = null) {
        $sql = "SELECT ie.name, ie.category, COUNT(*) as reservation_count,
                SUM(er.quantity_reserved) as total_quantity,
                AVG(TIMESTAMPDIFF(HOUR, CONCAT(er.reservation_date, ' ', er.start_time), CONCAT(er.reservation_date, ' ', er.end_time))) as avg_duration
                FROM inventory_equipment ie 
                LEFT JOIN equipment_reservations er ON ie.id = er.equipment_id AND er.status IN ('approved', 'completed')";
        
        if ($equipment_id) {
            $sql .= " WHERE ie.id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $equipment_id);
        } else {
            $sql .= " GROUP BY ie.id, ie.name, ie.category";
            $stmt = $this->conn->prepare($sql);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $usage_data = [];
        
        while ($row = $result->fetch_assoc()) {
            $usage_data[] = [
                'equipment_name' => $row['name'],
                'category' => $row['category'],
                'reservation_count' => (int)$row['reservation_count'],
                'total_quantity' => (int)$row['total_quantity'],
                'avg_duration' => round($row['avg_duration'], 1)
            ];
        }
        
        $this->sendResponse(['usage_data' => $usage_data]);
    }
    
    private function getPeakTimes($date_range = '30') {
        $sql = "SELECT DAYOFWEEK(reservation_date) as day_of_week, 
                HOUR(start_time) as hour,
                COUNT(*) as reservation_count
                FROM equipment_reservations 
                WHERE reservation_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
                AND status IN ('approved', 'completed')
                GROUP BY DAYOFWEEK(reservation_date), HOUR(start_time)
                ORDER BY day_of_week, hour";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $date_range);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $peak_times = [];
        while ($row = $result->fetch_assoc()) {
            $peak_times[] = [
                'day_of_week' => (int)$row['day_of_week'],
                'hour' => (int)$row['hour'],
                'reservation_count' => (int)$row['reservation_count']
            ];
        }
        
        $this->sendResponse(['peak_times' => $peak_times]);
    }
    
    private function getUserPatterns($date_range = '30') {
        $sql = "SELECT u.first_name, u.last_name, u.email, COUNT(*) as reservation_count,
                SUM(er.quantity_reserved) as total_quantity
                FROM users u 
                LEFT JOIN equipment_reservations er ON u.id = er.user_id 
                AND er.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY u.id, u.first_name, u.last_name, u.email
                HAVING reservation_count > 0
                ORDER BY reservation_count DESC
                LIMIT 20";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $date_range);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $user_patterns = [];
        while ($row = $result->fetch_assoc()) {
            $user_patterns[] = [
                'user_name' => trim($row['first_name'] . ' ' . $row['last_name']),
                'email' => $row['email'],
                'reservation_count' => (int)$row['reservation_count'],
                'total_quantity' => (int)$row['total_quantity']
            ];
        }
        
        $this->sendResponse(['user_patterns' => $user_patterns]);
    }
    
    private function getTrends($date_range = '30') {
        $sql = "SELECT DATE(reservation_date) as date, 
                COUNT(*) as daily_count,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
                FROM equipment_reservations 
                WHERE reservation_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
                GROUP BY DATE(reservation_date)
                ORDER BY date";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $date_range);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $trends = [];
        while ($row = $result->fetch_assoc()) {
            $trends[] = [
                'date' => $row['date'],
                'daily_count' => (int)$row['daily_count'],
                'approved_count' => (int)$row['approved_count'],
                'pending_count' => (int)$row['pending_count']
            ];
        }
        
        $this->sendResponse(['trends' => $trends]);
    }
    
    private function getUserAnalytics($user_id, $date_range = '30') {
        if (!$user_id) {
            $this->sendResponse(['error' => 'User ID required'], 400);
            return;
        }
        
        // User statistics
        $sql = "SELECT 
                COUNT(*) as total_reservations,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reservations,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reservations,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_reservations,
                AVG(TIMESTAMPDIFF(HOUR, CONCAT(reservation_date, ' ', start_time), CONCAT(reservation_date, ' ', end_time))) as avg_duration
                FROM equipment_reservations 
                WHERE user_id = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $user_id, $date_range);
        $stmt->execute();
        $result = $stmt->get_result();
        $stats = $result->fetch_assoc();
        
        // Favorite equipment
        $sql = "SELECT ie.name, COUNT(*) as count 
                FROM equipment_reservations er 
                JOIN inventory_equipment ie ON er.equipment_id = ie.id 
                WHERE er.user_id = ? 
                AND er.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY er.equipment_id, ie.name 
                ORDER BY count DESC 
                LIMIT 5";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $user_id, $date_range);
        $stmt->execute();
        $result = $stmt->get_result();
        $favorite_equipment = [];
        while ($row = $result->fetch_assoc()) {
            $favorite_equipment[] = [
                'name' => $row['name'],
                'count' => (int)$row['count']
            ];
        }
        
        // Upcoming reservations
        $sql = "SELECT er.id, ie.name as equipment_name, er.reservation_date, er.start_time, er.end_time, er.status
                FROM equipment_reservations er 
                JOIN inventory_equipment ie ON er.equipment_id = ie.id 
                WHERE er.user_id = ? 
                AND er.reservation_date >= CURRENT_DATE 
                AND er.status IN ('approved', 'pending')
                ORDER BY er.reservation_date, er.start_time";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $upcoming_reservations = [];
        while ($row = $result->fetch_assoc()) {
            $upcoming_reservations[] = [
                'id' => $row['id'],
                'equipment_name' => $row['equipment_name'],
                'reservation_date' => $row['reservation_date'],
                'start_time' => $row['start_time'],
                'end_time' => $row['end_time'],
                'status' => $row['status']
            ];
        }
        
        // Usage patterns
        $sql = "SELECT HOUR(start_time) as hour, COUNT(*) as count
                FROM equipment_reservations 
                WHERE user_id = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY HOUR(start_time)
                ORDER BY count DESC
                LIMIT 8";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $user_id, $date_range);
        $stmt->execute();
        $result = $stmt->get_result();
        $preferred_time_slots = [];
        while ($row = $result->fetch_assoc()) {
            $preferred_time_slots[] = [
                'hour' => (int)$row['hour'],
                'count' => (int)$row['count']
            ];
        }
        
        $sql = "SELECT DAYNAME(reservation_date) as day, COUNT(*) as count
                FROM equipment_reservations 
                WHERE user_id = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DAYNAME(reservation_date)
                ORDER BY count DESC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $user_id, $date_range);
        $stmt->execute();
        $result = $stmt->get_result();
        $preferred_days = [];
        while ($row = $result->fetch_assoc()) {
            $preferred_days[] = [
                'day' => $row['day'],
                'count' => (int)$row['count']
            ];
        }
        
        // Monthly trends
        $sql = "SELECT DATE_FORMAT(reservation_date, '%Y-%m') as month, COUNT(*) as count
                FROM equipment_reservations 
                WHERE user_id = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE_FORMAT(reservation_date, '%Y-%m')
                ORDER BY month";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $user_id, $date_range);
        $stmt->execute();
        $result = $stmt->get_result();
        $monthly_trends = [];
        while ($row = $result->fetch_assoc()) {
            $monthly_trends[] = [
                'month' => $row['month'],
                'count' => (int)$row['count']
            ];
        }
        
        // Generate personalized recommendations
        $recommendations = $this->generateUserRecommendations($stats, $favorite_equipment, $preferred_time_slots);
        
        $user_stats = [
            'total_reservations' => (int)$stats['total_reservations'],
            'approved_reservations' => (int)$stats['approved_reservations'],
            'pending_reservations' => (int)$stats['pending_reservations'],
            'cancelled_reservations' => (int)$stats['cancelled_reservations'],
            'avg_reservation_duration' => round($stats['avg_duration'], 1),
            'favorite_equipment' => $favorite_equipment,
            'upcoming_reservations' => $upcoming_reservations,
            'usage_patterns' => [
                'preferred_time_slots' => $preferred_time_slots,
                'preferred_days' => $preferred_days,
                'monthly_trends' => $monthly_trends
            ],
            'recommendations' => $recommendations
        ];
        
        $this->sendResponse(['success' => true, 'stats' => $user_stats]);
    }
    
    private function generateUserRecommendations($stats, $favorite_equipment, $preferred_time_slots) {
        $recommendations = [];
        
        // High cancellation rate recommendation
        if ($stats['total_reservations'] > 0 && ($stats['cancelled_reservations'] / $stats['total_reservations']) > 0.3) {
            $recommendations[] = [
                'type' => 'efficiency',
                'title' => 'Reduce Cancellations',
                'description' => 'Consider booking only when certain to improve your approval rate and equipment availability.',
                'priority' => 'high'
            ];
        }
        
        // Peak time recommendation
        if (!empty($preferred_time_slots) && $preferred_time_slots[0]['count'] > 5) {
            $recommendations[] = [
                'type' => 'time',
                'title' => 'Try Off-Peak Hours',
                'description' => "You often book at {$preferred_time_slots[0]['hour']}:00. Try earlier or later slots for better availability.",
                'priority' => 'medium'
            ];
        }
        
        // Equipment variety recommendation
        if (count($favorite_equipment) <= 2 && $stats['total_reservations'] > 5) {
            $recommendations[] = [
                'type' => 'equipment',
                'title' => 'Explore New Equipment',
                'description' => 'Try exploring different equipment types to expand your lab experience and skills.',
                'priority' => 'low'
            ];
        }
        
        // Success rate recommendation
        if ($stats['total_reservations'] > 0 && ($stats['approved_reservations'] / $stats['total_reservations']) > 0.8) {
            $recommendations[] = [
                'type' => 'efficiency',
                'title' => 'Great Success Rate!',
                'description' => 'Your reservation approval rate is excellent. Keep up the good planning!',
                'priority' => 'low'
            ];
        }
        
        return $recommendations;
    }
    
    private function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }
}

$analytics = new AnalyticsAPI();
$analytics->handleRequest();
?>
