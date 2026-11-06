-- QueueSmart schema (MySQL)

CREATE TABLE `UserCredentials` (
  `user_id` char(36) NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` char(128) NOT NULL,
  `password_salt` char(32) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `UserProfile` (
  `user_id` char(36) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_profile_user` FOREIGN KEY (`user_id`) REFERENCES `UserCredentials` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Service` (
  `service_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `expected_duration` int NOT NULL,
  `priority_level` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`service_id`),
  UNIQUE KEY `name` (`name`),
  CONSTRAINT `Service_chk_1` CHECK ((`expected_duration` > 0)),
  CONSTRAINT `Service_chk_2` CHECK ((`priority_level` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `MenuItem` (
  `menu_item_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `category` enum('food','drink') NOT NULL DEFAULT 'food',
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(2048) DEFAULT NULL,
  `expected_duration_minutes` int NOT NULL DEFAULT '5',
  `addons` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`menu_item_id`),
  CONSTRAINT `chk_menu_duration` CHECK ((`expected_duration_minutes` between 1 and 60)),
  CONSTRAINT `chk_menu_price` CHECK ((`price` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Queue` (
  `queue_id` int unsigned NOT NULL AUTO_INCREMENT,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `service_id` int unsigned NOT NULL,
  PRIMARY KEY (`queue_id`),
  KEY `fk_queue_service` (`service_id`),
  CONSTRAINT `fk_queue_service` FOREIGN KEY (`service_id`) REFERENCES `Service` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `CustomerOrder` (
  `order_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` char(36) NOT NULL,
  `notes` varchar(200) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `fk_order_user` (`user_id`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `UserCredentials` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `OrderItem` (
  `order_item_id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `menu_item_id` int unsigned NOT NULL,
  `item_name` varchar(50) NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `prep_minutes` int NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `fk_orderitem_order` (`order_id`),
  KEY `fk_orderitem_menu` (`menu_item_id`),
  CONSTRAINT `fk_orderitem_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `MenuItem` (`menu_item_id`),
  CONSTRAINT `fk_orderitem_order` FOREIGN KEY (`order_id`) REFERENCES `CustomerOrder` (`order_id`),
  CONSTRAINT `chk_orderitem_prep` CHECK ((`prep_minutes` between 1 and 60)),
  CONSTRAINT `chk_orderitem_price` CHECK ((`unit_price` >= 0)),
  CONSTRAINT `chk_orderitem_quantity` CHECK ((`quantity` between 1 and 20))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `QueueEntry` (
  `entry_id` int unsigned NOT NULL AUTO_INCREMENT,
  `queue_id` int unsigned NOT NULL,
  `order_id` int unsigned NOT NULL,
  `position` int DEFAULT NULL,
  `priority` enum('normal','high') NOT NULL DEFAULT 'normal',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('waiting','served','canceled') NOT NULL DEFAULT 'waiting',
  `finished_at` timestamp NULL DEFAULT NULL,
  `near_notified` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`entry_id`),
  UNIQUE KEY `uq_queueentry_order` (`order_id`),
  KEY `idx_queueentry_waiting` (`queue_id`,`status`,`priority`,`joined_at`),
  CONSTRAINT `fk_queueentry_order` FOREIGN KEY (`order_id`) REFERENCES `CustomerOrder` (`order_id`),
  CONSTRAINT `fk_queueentry_queue` FOREIGN KEY (`queue_id`) REFERENCES `Queue` (`queue_id`),
  CONSTRAINT `chk_queueentry_position` CHECK (((`position` is null) or (`position` >= 1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Notification` (
  `notification_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` char(36) NOT NULL,
  `entry_id` int unsigned DEFAULT NULL,
  `type` enum('JOINED','NEAR_FRONT','SERVED') NOT NULL,
  `message` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('sent','viewed') NOT NULL DEFAULT 'sent',
  PRIMARY KEY (`notification_id`),
  KEY `fk_notification_entry` (`entry_id`),
  KEY `idx_notification_user` (`user_id`,`created_at`),
  CONSTRAINT `fk_notification_entry` FOREIGN KEY (`entry_id`) REFERENCES `QueueEntry` (`entry_id`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `UserCredentials` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

