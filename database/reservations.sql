-- Equipment Reservation System Tables
-- Add these to your existing labmate_guardian database

-- Equipment Reservations Table
CREATE TABLE `equipment_reservations` (
  `id` char(36) NOT NULL,
  `equipment_id` char(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reservation_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `quantity_reserved` int(11) NOT NULL DEFAULT 1,
  `purpose` text DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled','completed') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  FOREIGN KEY (`equipment_id`) REFERENCES `inventory_equipment`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reservation Waiting List Table
CREATE TABLE `reservation_waiting_list` (
  `id` char(36) NOT NULL,
  `equipment_id` char(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `quantity_needed` int(11) NOT NULL DEFAULT 1,
  `preferred_date` date DEFAULT NULL,
  `preferred_start_time` time DEFAULT NULL,
  `preferred_end_time` time DEFAULT NULL,
  `purpose` text DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('waiting','notified','fulfilled','cancelled') DEFAULT 'waiting',
  `notified_at` datetime DEFAULT NULL,
  `fulfilled_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  FOREIGN KEY (`equipment_id`) REFERENCES `inventory_equipment`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reservation Schedule Conflicts Index
CREATE INDEX `idx_reservation_schedule` ON `equipment_reservations` (`equipment_id`, `reservation_date`, `start_time`, `end_time`, `status`);
CREATE INDEX `idx_user_reservations` ON `equipment_reservations` (`user_id`, `status`);
CREATE INDEX `idx_waiting_list_equipment` ON `reservation_waiting_list` (`equipment_id`, `status`, `priority`);

-- Add reservation settings to system_settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('reservation_advance_days', '7', 'Maximum days in advance users can make reservations'),
('reservation_max_duration_hours', '4', 'Maximum reservation duration in hours'),
('reservation_auto_approve', 'false', 'Automatically approve reservations if no conflicts'),
('reservation_require_approval', 'true', 'Require admin approval for all reservations');

-- Sample Reservation Data for Testing
INSERT INTO `equipment_reservations` (`id`, `equipment_id`, `user_id`, `reservation_date`, `start_time`, `end_time`, `quantity_reserved`, `purpose`, `status`, `created_at`) VALUES
('550e8400-e29b-41d4-a716-446655440000', '6938fd60ed14c', 9782, '2025-12-11', '09:00:00', '11:00:00', 1, 'Electronics project work', 'approved', '2025-12-10 16:00:00'),
('550e8400-e29b-41d4-a716-446655440001', '6938fd60ef1bd', 9782, '2025-12-11', '14:00:00', '16:00:00', 1, 'Circuit testing', 'pending', '2025-12-10 16:30:00'),
('550e8400-e29b-41d4-a716-446655440002', '6938fd60f3987', 6717, '2025-12-12', '10:00:00', '12:00:00', 2, 'Biology lab session', 'approved', '2025-12-10 15:00:00'),
('550e8400-e29b-41d4-a716-446655440003', '6938fd60f1051', 9782, '2025-12-13', '13:00:00', '15:00:00', 3, 'Network cable preparation', 'approved', '2025-12-10 14:00:00'),
('550e8400-e29b-41d4-a716-446655440004', '6938fd60f16f1', 6717, '2025-12-11', '08:00:00', '10:00:00', 1, 'Signal analysis research', 'rejected', '2025-12-10 13:00:00');

-- Sample Waiting List Data
INSERT INTO `reservation_waiting_list` (`id`, `equipment_id`, `user_id`, `quantity_needed`, `preferred_date`, `preferred_start_time`, `preferred_end_time`, `purpose`, `priority`, `status`, `created_at`) VALUES
('660e8400-e29b-41d4-a716-446655440000', '6938fd60f16f1', 9782, 1, '2025-12-11', '10:00:00', '12:00:00', 'Urgent signal analysis', 'high', 'waiting', '2025-12-10 17:00:00'),
('660e8400-e29b-41d4-a716-446655440001', '6938fd6100c8b', 9782, 1, '2025-12-12', '09:00:00', '11:00:00', 'Student project work', 'medium', 'waiting', '2025-12-10 16:45:00');
