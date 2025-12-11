-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 10, 2025 at 09:22 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `labmate_guardian`
--

-- --------------------------------------------------------

--
-- Table structure for table `borrow_items`
--

CREATE TABLE `borrow_items` (
  `id` char(36) NOT NULL,
  `request_id` char(36) DEFAULT NULL,
  `borrower_name` varchar(255) NOT NULL,
  `borrower_email` varchar(255) NOT NULL,
  `item` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `borrow_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` enum('borrowed','returned') DEFAULT 'borrowed',
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `borrow_items`
--

INSERT INTO `borrow_items` (`id`, `request_id`, `borrower_name`, `borrower_email`, `item`, `quantity`, `borrow_date`, `return_date`, `status`, `created_at`, `created_by`) VALUES
('11984aeb-b80e-4233-976e-40283a8c9b89', '91a150e9-b1e1-4726-82e4-f9c54624b1f3', 'Test Student User', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-15', 'borrowed', '2025-12-10 15:50:18', '6717'),
('437673f9-3226-428f-af09-edb6c031e50d', '30ead581-5e9a-49c2-a81f-5daf06dc00f4', 'Test User', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-17', 'borrowed', '2025-12-10 15:45:11', '6717'),
('658db51f-9c48-41bd-a3cd-0e3a4ee9a4e6', '40f082b2-5546-497e-9c96-413357c3a23c', 'Jane Student', 'jay@gmail.com', '0', 2, '2025-12-10', '2025-12-15', 'borrowed', '2025-12-10 15:45:31', '6717'),
('7278ddfa-5db0-4855-9df0-ba93f3e9aa5e', 'e0f5f90c-dd59-493d-a8c0-6ae4930b6e5e', 'Test Student', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-13', 'borrowed', '2025-12-10 15:43:36', '6717'),
('80c0d8c9-1aa7-4deb-8fad-1cbda831cf32', 'a1aed99e-e1c6-4007-a631-25242a94a239', 'Test User', 'test@example.com', '0', 2, '2025-12-10', '2025-12-17', 'borrowed', '2025-12-10 14:47:45', '6717'),
('923f0287-9808-4939-b015-88685923511c', '42f5637d-d3b2-4097-a58b-5cbe3c8852f9', 'Test User 2', 'jay@gmail.com', '0', 2, '2025-12-10', '2025-12-15', 'borrowed', '2025-12-10 15:48:24', '6717'),
('955a7738-8961-4f34-a49c-3ff8224d4566', '17d3580b-a528-4831-8daf-e1ba74f1e56e', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '0000-00-00', 'borrowed', '2025-12-10 14:47:51', '6717'),
('a99d4ade-7644-4a23-bfa3-273033561833', '8b468ebe-3c33-438b-93d4-2c69412540f0', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-11', 'borrowed', '2025-12-10 15:37:41', '6717');

-- --------------------------------------------------------

--
-- Table structure for table `borrow_requests`
--

CREATE TABLE `borrow_requests` (
  `id` char(36) NOT NULL,
  `borrower_name` varchar(255) NOT NULL,
  `borrower_email` varchar(255) NOT NULL,
  `item` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `request_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `borrow_requests`
--

INSERT INTO `borrow_requests` (`id`, `borrower_name`, `borrower_email`, `item`, `quantity`, `request_date`, `return_date`, `status`, `approved_by`, `approved_at`, `rejection_reason`, `created_at`, `created_by`) VALUES
('00659a20-9c02-40b2-90f9-0080eaeeeb6a', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-11', 'approved', '6717', '2025-12-10 02:17:04', '', '2025-12-10 10:16:42', '9782'),
('02f7aa2f-73a1-4d85-b2c1-688138961ca7', 'Test User', 'test@example.com', '0', 2, '2025-12-10', '2025-12-17', 'approved', '6717', '2025-12-10 07:44:17', '', '2025-12-10 14:44:17', 'test-user'),
('09856875-4582-4aaf-af31-f1de5ea49980', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-11', 'approved', '6717', '2025-12-10 02:15:26', '', '2025-12-10 10:15:07', '9782'),
('10a8b52b-8e78-49aa-86fa-91102a303313', 'Test User (test@example.com)', 'test@example.com', '0', 1, '2025-12-10', NULL, 'approved', '6717', '2025-12-10 07:24:53', NULL, '2025-12-10 14:24:48', 'test-user'),
('14e2c4da-26b1-47c0-9c67-34156d83e316', 'Test User (test@example.com)', 'test@example.com', '0', 1, '2025-12-10', NULL, 'approved', '6717', '2025-12-10 07:42:05', NULL, '2025-12-10 14:41:55', 'test-user'),
('17d3580b-a528-4831-8daf-e1ba74f1e56e', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '0000-00-00', 'approved', '6717', '2025-12-10 06:47:51', '', '2025-12-10 14:45:02', '9782'),
('30ead581-5e9a-49c2-a81f-5daf06dc00f4', 'Test User', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-17', 'approved', '6717', '2025-12-10 08:45:11', '', '2025-12-10 15:45:11', '9782'),
('3a5e56c0-d810-4cec-aa21-8d2a319d0644', 'Test User', 'test@example.com', '0', 2, '2025-12-10', '2025-12-17', 'approved', '6717', '2025-12-10 07:43:14', '', '2025-12-10 14:43:14', 'test-user'),
('40f082b2-5546-497e-9c96-413357c3a23c', 'Jane Student', 'jay@gmail.com', '0', 2, '2025-12-10', '2025-12-15', 'approved', '6717', '2025-12-10 07:45:31', '', '2025-12-10 15:41:43', '9782'),
('424003eb-1786-41c5-a996-c7a981341c7a', 'Test User 1', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-17', 'rejected', '6717', '2025-12-10 07:39:43', 'its under maintinance ', '2025-12-10 15:30:11', '9782'),
('42f5637d-d3b2-4097-a58b-5cbe3c8852f9', 'Test User 2', 'jay@gmail.com', '0', 2, '2025-12-10', '2025-12-15', 'approved', '6717', '2025-12-10 07:48:24', '', '2025-12-10 15:30:11', '9782'),
('4870be06-9a95-464d-9e32-a50511cc60b2', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-11', 'approved', '6717', '2025-12-10 06:15:21', '', '2025-12-10 14:03:04', '9782'),
('5337172e-1a21-4cde-8734-b8e6d3b8f7fb', 'Liejay Jabines', 'jay@gmail.com', '3', 1, '2025-12-10', '2025-12-11', 'approved', '6717', '2025-12-10 06:39:39', '', '2025-12-10 14:29:47', '9782'),
('54c1d7fc-166a-458e-97e1-540fab119c0c', 'Test User', 'test@example.com', '0', 2, '2025-12-10', '2025-12-17', 'approved', '6717', '2025-12-10 07:42:50', '', '2025-12-10 14:42:50', 'test-user'),
('5fe760f3-9a02-4227-813c-a310d7041d48', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-11', 'approved', '6717', '2025-12-10 06:39:47', '', '2025-12-10 14:27:41', '9782'),
('7c8ccf9f-2bc2-4db6-bf9d-e2614f9ef591', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-11', 'pending', NULL, NULL, NULL, '2025-12-10 14:50:31', '9782'),
('8b468ebe-3c33-438b-93d4-2c69412540f0', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-11', 'approved', '6717', '2025-12-10 07:37:41', '', '2025-12-10 15:32:45', '9782'),
('8bb2bf7a-1cbe-4930-bf56-fa56c0984cc3', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-11', 'pending', NULL, NULL, NULL, '2025-12-10 14:49:48', '9782'),
('8ed7b10a-93e5-4a0d-85e9-dd7ab99fd85a', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-11', 'approved', '6717', '2025-12-10 02:11:26', '', '2025-12-10 10:08:57', '9782'),
('91a150e9-b1e1-4726-82e4-f9c54624b1f3', 'Test Student User', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-15', 'approved', '6717', '2025-12-10 08:50:18', '', '2025-12-10 15:50:18', '9782'),
('a1aed99e-e1c6-4007-a631-25242a94a239', 'Test User', 'test@example.com', '0', 2, '2025-12-10', '2025-12-17', 'approved', '6717', '2025-12-10 07:47:45', '', '2025-12-10 14:47:45', 'test-user'),
('b2c5c8b6-82bf-4462-aea8-4b7a62f7b4a8', 'Liejay Jabines', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-11', 'approved', '6717', '2025-12-10 01:54:59', '', '2025-12-10 09:52:16', '9782'),
('bb0e7214-5b1e-4188-94f6-f16c73cb7110', 'Test Student', 'student@test.com', '0', 1, '2025-12-10', '2025-12-17', 'approved', '6717', '2025-12-10 01:54:47', '', '2025-12-10 09:53:59', NULL),
('bb95f91d-41a2-4c69-a690-7ec96a5dddc3', 'Jane Student', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-13', 'pending', NULL, NULL, NULL, '2025-12-10 15:28:46', '9782'),
('bc776d94-49e2-4182-8008-742ef0dad61c', 'John Student', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-17', 'pending', NULL, NULL, NULL, '2025-12-10 14:51:38', '9782'),
('cb58a715-b05a-4f7a-9105-20773ed20443', 'Test User (test@example.com)', 'test@example.com', '0', 1, '2025-12-10', NULL, 'approved', '6717', '2025-12-10 07:25:29', NULL, '2025-12-10 14:25:13', 'test-user'),
('e0f5f90c-dd59-493d-a8c0-6ae4930b6e5e', 'Test Student', 'jay@gmail.com', '0', 1, '2025-12-10', '2025-12-13', 'approved', '6717', '2025-12-10 08:43:36', '', '2025-12-10 15:43:36', '9782');

-- --------------------------------------------------------

--
-- Table structure for table `incident_reports`
--

CREATE TABLE `incident_reports` (
  `id` char(36) NOT NULL,
  `article` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `date_acquired` date DEFAULT NULL,
  `po_number` varchar(100) DEFAULT NULL,
  `property_number` varchar(100) DEFAULT NULL,
  `new_property_number` varchar(100) DEFAULT NULL,
  `unit_of_measure` varchar(50) DEFAULT NULL,
  `unit_value` decimal(10,2) DEFAULT NULL,
  `balance_per_card_qty` int(11) DEFAULT NULL,
  `on_hand_per_card_qty` int(11) DEFAULT NULL,
  `total_value` decimal(10,2) DEFAULT NULL,
  `accredited_to` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_equipment`
--

CREATE TABLE `inventory_equipment` (
  `id` char(36) NOT NULL,
  `date` date NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `item_type` enum('tool','equipment') NOT NULL DEFAULT 'equipment',
  `item_description` text NOT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `purpose` text DEFAULT NULL,
  `signature` varchar(255) DEFAULT NULL,
  `date_returned` date DEFAULT NULL,
  `condition` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_equipment`
--

INSERT INTO `inventory_equipment` (`id`, `date`, `name`, `category`, `item_type`, `item_description`, `serial_number`, `quantity`, `purpose`, `signature`, `date_returned`, `condition`, `created_at`, `created_by`) VALUES
('0d4a42440675472c37ee6ee5b46e0a5c', '2025-12-05', 'Admin', 'Computer', 'equipment', 'New', '12345', 25, '', NULL, '0000-00-00', 'Excellent', '2025-12-05 17:17:57', '6717'),
('6938fd60ed14c', '2025-12-10', 'Screwdriver Set', 'Tools', 'tool', 'Complete set of Phillips and flathead screwdrivers', 'TL-001', 5, 'General lab work', NULL, NULL, NULL, '2025-12-10 12:56:00', NULL),
('6938fd60ef1bd', '2025-12-10', 'Multimeter', 'Tools', 'tool', 'Digital multimeter for electrical measurements', 'TL-002', 3, 'Electrical testing', NULL, NULL, NULL, '2025-12-10 12:56:00', NULL),
('6938fd60efb4f', '2025-12-10', 'Soldering Iron', 'Tools', 'tool', 'Temperature-controlled soldering station', 'TL-003', 2, 'Electronics work', NULL, NULL, NULL, '2025-12-10 12:56:00', NULL),
('6938fd60f1051', '2025-12-10', 'Wire Stripper', 'Tools', 'tool', 'Automatic wire stripper tool', 'TL-004', 8, 'Cable preparation', NULL, NULL, NULL, '2025-12-10 12:56:00', NULL),
('6938fd60f16f1', '2025-12-10', 'Oscilloscope', 'Tools', 'tool', 'Digital oscilloscope 100MHz', 'TL-005', 1, 'Signal analysis', NULL, NULL, NULL, '2025-12-10 12:56:00', NULL),
('6938fd60f1ec9', '2025-12-10', 'Laptop Computer', 'Computers', 'equipment', 'Dell Latitude laptop with Windows 11', 'EQ-001', 10, 'Student use', NULL, NULL, NULL, '2025-12-10 12:56:00', NULL),
('6938fd60f331c', '2025-12-10', 'Projector', 'AV Equipment', 'equipment', 'Epson HD projector', 'EQ-002', 4, 'Presentations', NULL, NULL, NULL, '2025-12-10 12:56:00', NULL),
('6938fd60f3987', '2025-12-10', 'Microscope', 'Lab Equipment', 'equipment', 'Compound microscope 1000x', 'EQ-003', 6, 'Biology labs', NULL, NULL, NULL, '2025-12-10 12:56:00', NULL),
('6938fd6100c8b', '2025-12-10', '3D Printer', 'Manufacturing', 'equipment', 'Creality Ender 3 3D printer', 'EQ-004', 2, 'Prototyping', NULL, NULL, NULL, '2025-12-10 12:56:01', NULL),
('6938fd6101db1', '2025-12-10', 'VR Headset', 'VR Equipment', 'equipment', 'Oculus Quest 2 VR headset', 'EQ-005', 3, 'Virtual reality training', NULL, NULL, NULL, '2025-12-10 12:56:01', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `lost_found`
--

CREATE TABLE `lost_found` (
  `id` char(36) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `item_description` text NOT NULL,
  `finders_name` varchar(255) NOT NULL,
  `owner_name` varchar(255) DEFAULT NULL,
  `cell_number` varchar(20) DEFAULT NULL,
  `date_claimed` date DEFAULT NULL,
  `signature` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `repair_maintenance`
--

CREATE TABLE `repair_maintenance` (
  `id` char(36) NOT NULL,
  `date` date NOT NULL,
  `equipment_name` varchar(255) NOT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `issue_description` text NOT NULL,
  `action_taken` text DEFAULT NULL,
  `technician_name` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `description`, `updated_at`, `updated_by`) VALUES
(1, 'maintenance_mode', 'false', 'System maintenance mode - when enabled, users cannot login', '2025-12-10 08:38:42', NULL),
(2, 'maintenance_message', 'System is currently under maintenance. Please try again later.', 'Message displayed during maintenance mode', '2025-12-10 08:38:42', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','user','instructor') NOT NULL DEFAULT 'user',
  `avatar_url` varchar(255) DEFAULT NULL,
  `id_number` varchar(9) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `first_name`, `middle_name`, `last_name`, `password_hash`, `role`, `avatar_url`, `id_number`, `created_at`) VALUES
(6717, 'benjie.trozo@csucc.edu.ph', NULL, NULL, NULL, '$2y$10$CMMaW/gtubTZ9O3lLYZDo.dvBkLFXYW01A7lCfKro.SoTq6SB8IQq', 'admin', 'api/uploads/avatars/6717.jpg', '2022-1010', '2025-12-04 16:11:16'),
(9782, 'jay@gmail.com', 'Liejay', '', 'Jabines', '$2y$10$PBpIPDLui4fKwgIcd99e5egXAvHfVpvP6sL1Qf55JB/dnFCuoEoQG', 'user', 'api/uploads/avatars/9782.jpg', '2022-1012', '2025-12-09 21:40:15');

-- --------------------------------------------------------

--
-- Table structure for table `visitor_logs`
--

CREATE TABLE `visitor_logs` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `purpose` text NOT NULL,
  `date` date NOT NULL,
  `time_in` time NOT NULL,
  `time_out` time DEFAULT NULL,
  `signature` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `borrow_items`
--
ALTER TABLE `borrow_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `borrow_requests`
--
ALTER TABLE `borrow_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_borrower_email` (`borrower_email`);

--
-- Indexes for table `incident_reports`
--
ALTER TABLE `incident_reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventory_equipment`
--
ALTER TABLE `inventory_equipment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lost_found`
--
ALTER TABLE `lost_found`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `repair_maintenance`
--
ALTER TABLE `repair_maintenance`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `visitor_logs`
--
ALTER TABLE `visitor_logs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9783;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
