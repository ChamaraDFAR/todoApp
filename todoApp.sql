-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 12, 2026 at 12:54 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.1.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `todoApp`
--

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `todo_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`id`, `todo_id`, `original_name`, `filename`, `created_at`) VALUES
(1, 1, '20231224_162729_jpg.rf.34a7e098f946b3fb0c4a426eed15b2e0.jpg', '1770356089369-905390636.jpg', '2026-02-06 05:34:49');

-- --------------------------------------------------------

--
-- Table structure for table `lists`
--

CREATE TABLE `lists` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT 'Untitled list',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lists`
--

INSERT INTO `lists` (`id`, `owner_id`, `name`, `created_at`) VALUES
(1, 2, 'test list', '2026-02-16 05:56:10');

-- --------------------------------------------------------

--
-- Table structure for table `list_members`
--

CREATE TABLE `list_members` (
  `list_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('editor','viewer') NOT NULL DEFAULT 'editor',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `list_members`
--

INSERT INTO `list_members` (`list_id`, `user_id`, `role`, `created_at`) VALUES
(1, 3, 'editor', '2026-02-16 05:58:12');

-- --------------------------------------------------------

--
-- Table structure for table `todos`
--

CREATE TABLE `todos` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `list_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'Untitled',
  `description` text DEFAULT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `todos`
--

INSERT INTO `todos` (`id`, `user_id`, `list_id`, `title`, `description`, `completed`, `created_at`, `updated_at`) VALUES
(1, 2, NULL, 'send the general docs to testUser', 'send to test user', 0, '2026-02-06 05:34:49', '2026-03-03 05:09:47'),
(2, 2, 1, 'Beatae dolorum fugit', 'In repellendus Eum', 0, '2026-02-16 05:58:32', '2026-02-16 05:58:32'),
(3, 2, 1, 'sdfsafa', 'sfasfasfasfa', 0, '2026-02-16 05:58:42', '2026-02-16 06:18:31'),
(4, 2, 1, 'dsfsaf', 'sfasfas', 0, '2026-02-16 05:58:59', '2026-02-16 06:18:29');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `name` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `created_at`, `name`, `avatar`) VALUES
(1, 'migrate@local', 'migrate', '2026-02-06 04:56:09', NULL, NULL),
(2, 'chamara.dfar@gmail.com', '$2b$10$R6mJSJ1oMsjM1qDSxRQR8.TWdA/Xxj58.ddIozlQ9Mf1HqDDye/sy', '2026-02-06 05:00:02', NULL, NULL),
(3, 'test@gmail.com', '$2b$10$VJ6eMERoJLj57yEsx3JMNuRZMkIuT3o5Ww3JY9Sz3dgZT1IRtiXqC', '2026-02-16 05:57:30', NULL, '1771391245758-622003465.png');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_todo_id` (`todo_id`);

--
-- Indexes for table `lists`
--
ALTER TABLE `lists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `list_members`
--
ALTER TABLE `list_members`
  ADD PRIMARY KEY (`list_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `todos`
--
ALTER TABLE `todos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_list_id` (`list_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `lists`
--
ALTER TABLE `lists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `todos`
--
ALTER TABLE `todos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`todo_id`) REFERENCES `todos` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lists`
--
ALTER TABLE `lists`
  ADD CONSTRAINT `lists_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `list_members`
--
ALTER TABLE `list_members`
  ADD CONSTRAINT `list_members_ibfk_1` FOREIGN KEY (`list_id`) REFERENCES `lists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `list_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `todos`
--
ALTER TABLE `todos`
  ADD CONSTRAINT `todos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `todos_ibfk_2` FOREIGN KEY (`list_id`) REFERENCES `lists` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
