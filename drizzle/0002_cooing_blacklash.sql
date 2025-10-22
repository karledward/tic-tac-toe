ALTER TABLE `users` RENAME COLUMN `loginMethod` TO `passwordHash`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `passwordHash` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);