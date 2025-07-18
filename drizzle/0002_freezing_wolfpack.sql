CREATE TABLE `time_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`entry_type` enum('clock_in','clock_out','start_lunch','resume_shift') NOT NULL,
	`timestamp` datetime NOT NULL,
	`date` date NOT NULL,
	`is_valid` boolean DEFAULT true,
	`validation_notes` text,
	`timezone` varchar(50) DEFAULT 'America/Santiago',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `time_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `validation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rule_name` varchar(100) NOT NULL,
	`rule_type` enum('time_limit','sequence','legal_compliance') NOT NULL,
	`description` text,
	`is_active` boolean DEFAULT true,
	`min_work_minutes` int DEFAULT 60,
	`max_lunch_minutes` int DEFAULT 120,
	`lunch_start_hour` int DEFAULT 12,
	`lunch_end_hour` int DEFAULT 20,
	`max_daily_hours` decimal(3,1) DEFAULT '10.0',
	`max_weekly_hours` decimal(4,1) DEFAULT '45.0',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `validation_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`date` date NOT NULL,
	`clock_in_time` datetime,
	`clock_out_time` datetime,
	`lunch_start_time` datetime,
	`lunch_end_time` datetime,
	`total_work_minutes` int DEFAULT 0,
	`total_lunch_minutes` int DEFAULT 0,
	`total_work_hours` decimal(5,2) DEFAULT '0.00',
	`status` enum('active','on_lunch','completed','overtime_pending') DEFAULT 'active',
	`is_overtime_day` boolean DEFAULT false,
	`overtime_minutes` int DEFAULT 0,
	`is_valid_session` boolean DEFAULT true,
	`validation_errors` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_statistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`week_start_date` date NOT NULL,
	`month_start_date` date NOT NULL,
	`total_hours_week` decimal(6,2) DEFAULT '0.00',
	`total_days_week` int DEFAULT 0,
	`overtime_hours_week` decimal(5,2) DEFAULT '0.00',
	`total_hours_month` decimal(7,2) DEFAULT '0.00',
	`total_days_month` int DEFAULT 0,
	`overtime_hours_month` decimal(6,2) DEFAULT '0.00',
	`average_entry_time` time,
	`average_exit_time` time,
	`average_lunch_duration` int,
	`compliance_score` decimal(3,2) DEFAULT '100.00',
	`law_violations` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_statistics_id` PRIMARY KEY(`id`)
);
