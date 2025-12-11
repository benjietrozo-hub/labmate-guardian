-- Add instructor role to the users table ENUM
-- Run this script to update the existing database

ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user','instructor') NOT NULL DEFAULT 'user';
