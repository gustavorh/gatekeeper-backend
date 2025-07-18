ALTER TABLE `users` DROP INDEX `users_username_unique`;--> statement-breakpoint
ALTER TABLE `users` ADD `rut` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `nombre` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `apellido_paterno` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `apellido_materno` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_rut_unique` UNIQUE(`rut`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `username`;