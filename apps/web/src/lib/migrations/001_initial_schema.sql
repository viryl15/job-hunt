-- Migration 001: Initial Database Schema
-- Created: 2025-10-05
-- Description: Creates all base tables for the job hunt application
-- Users table (main user table)
CREATE TABLE IF NOT EXISTS `users` (
    `id` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL,
    `phone` varchar(20) DEFAULT NULL,
    `name` varchar(255) DEFAULT NULL,
    `image` text,
    `provider` varchar(50) NOT NULL DEFAULT 'google',
    `providerId` varchar(255) DEFAULT NULL,
    `lastLoginAt` timestamp NULL DEFAULT NULL,
    `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`),
    KEY `idx_users_email` (`email`)
) ENGINE = MyISAM DEFAULT CHARSET = utf8mb3 COLLATE = utf8mb3_unicode_ci;
-- User table (alternative/Prisma format)
CREATE TABLE IF NOT EXISTS `user` (
    `id` varchar(191) NOT NULL,
    `name` varchar(100) DEFAULT NULL,
    `email` varchar(191) NOT NULL,
    `emailVerified` datetime(3) DEFAULT NULL,
    `image` varchar(500) DEFAULT NULL,
    `skills` json NOT NULL,
    `locations` json NOT NULL,
    `preferences` json DEFAULT NULL,
    `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` datetime(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `User_email_key` (`email`)
) ENGINE = MyISAM DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Account table (OAuth accounts)
CREATE TABLE IF NOT EXISTS `account` (
    `id` varchar(191) NOT NULL,
    `userId` varchar(191) NOT NULL,
    `type` varchar(50) NOT NULL,
    `provider` varchar(50) NOT NULL,
    `providerAccountId` varchar(100) NOT NULL,
    `refresh_token` text,
    `access_token` text,
    `expires_at` int DEFAULT NULL,
    `token_type` varchar(50) DEFAULT NULL,
    `scope` varchar(500) DEFAULT NULL,
    `id_token` text,
    `session_state` varchar(100) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `Account_provider_providerAccountId_key` (`provider`, `providerAccountId`),
    KEY `Account_userId_fkey` (`userId`)
) ENGINE = MyISAM DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Session table (user sessions)
CREATE TABLE IF NOT EXISTS `session` (
    `id` varchar(191) NOT NULL,
    `sessionToken` varchar(191) NOT NULL,
    `userId` varchar(191) NOT NULL,
    `expires` datetime(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `Session_sessionToken_key` (`sessionToken`),
    KEY `Session_userId_fkey` (`userId`)
) ENGINE = MyISAM DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Verification token table
CREATE TABLE IF NOT EXISTS `verificationtoken` (
    `identifier` varchar(100) NOT NULL,
    `token` varchar(100) NOT NULL,
    `expires` datetime(3) NOT NULL,
    UNIQUE KEY `VerificationToken_token_key` (`token`),
    UNIQUE KEY `VerificationToken_identifier_token_key` (`identifier`, `token`)
) ENGINE = MyISAM DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Job board configuration table
CREATE TABLE IF NOT EXISTS `job_board_config` (
    `id` varchar(50) NOT NULL,
    `userId` varchar(50) NOT NULL,
    `boardName` varchar(100) NOT NULL,
    `boardUrl` varchar(255) NOT NULL,
    `credentials` text NOT NULL,
    `preferences` text NOT NULL,
    `applicationSettings` text NOT NULL,
    `isActive` tinyint(1) DEFAULT '1',
    `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = MyISAM DEFAULT CHARSET = utf8mb3 COLLATE = utf8mb3_unicode_ci;
-- Job table
CREATE TABLE IF NOT EXISTS `job` (
    `id` varchar(191) NOT NULL,
    `source` varchar(50) NOT NULL,
    `sourceId` varchar(100) DEFAULT NULL,
    `title` varchar(500) NOT NULL,
    `company` varchar(200) NOT NULL,
    `locations` json NOT NULL,
    `remote` tinyint(1) NOT NULL DEFAULT '0',
    `url` varchar(191) NOT NULL,
    `description` text,
    `salaryMin` int DEFAULT NULL,
    `salaryMax` int DEFAULT NULL,
    `currency` varchar(191) DEFAULT NULL,
    `tags` json NOT NULL,
    `postedAt` datetime(3) DEFAULT NULL,
    `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` datetime(3) NOT NULL,
    `score` int NOT NULL DEFAULT '0',
    `hidden` tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY (`id`),
    UNIQUE KEY `Job_url_key` (`url`),
    KEY `Job_score_postedAt_idx` (`score`, `postedAt`),
    KEY `Job_source_sourceId_idx` (`source`, `sourceId`)
) ENGINE = MyISAM DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Application table
CREATE TABLE IF NOT EXISTS `application` (
    `id` varchar(50) NOT NULL,
    `jobId` varchar(50) NOT NULL,
    `userId` varchar(50) NOT NULL,
    `status` enum(
        'LEAD',
        'APPLIED',
        'FAILED',
        'SCREEN',
        'TECH',
        'ONSITE',
        'OFFER',
        'HIRED',
        'REJECTED'
    ) NOT NULL DEFAULT 'LEAD',
    `channel` enum('EMAIL', 'FORM', 'REFERRAL') NOT NULL DEFAULT 'EMAIL',
    `resumePath` varchar(500) DEFAULT NULL,
    `coverText` text,
    `emailId` varchar(100) DEFAULT NULL,
    `threadId` varchar(100) DEFAULT NULL,
    `notes` text,
    `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` datetime(3) NOT NULL,
    `followupAt` datetime(3) DEFAULT NULL,
    `contactEmail` varchar(191) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `Application_userId_jobId_key` (`userId`, `jobId`),
    KEY `Application_jobId_fkey` (`jobId`)
) ENGINE = MyISAM DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Application log table
CREATE TABLE IF NOT EXISTS `application_log` (
    `id` varchar(50) NOT NULL,
    `jobId` varchar(50) NOT NULL,
    `jobBoardConfigId` varchar(50) NOT NULL,
    `status` enum(
        'pending',
        'applied',
        'failed',
        'rejected',
        'interview',
        'offer'
    ) NOT NULL,
    `appliedAt` datetime DEFAULT NULL,
    `response` text,
    `followUpRequired` tinyint(1) DEFAULT '0',
    `followUpDate` datetime DEFAULT NULL,
    `notes` text,
    `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `jobBoardConfigId` (`jobBoardConfigId`)
) ENGINE = MyISAM DEFAULT CHARSET = utf8mb3 COLLATE = utf8mb3_unicode_ci;
-- Migration tracking table
CREATE TABLE IF NOT EXISTS `migrations` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `executed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `name` (`name`)
) ENGINE = MyISAM DEFAULT CHARSET = utf8mb3 COLLATE = utf8mb3_unicode_ci;
-- Record this migration
INSERT INTO `migrations` (`name`)
VALUES ('001_initial_schema') ON DUPLICATE KEY
UPDATE `name` = `name`;