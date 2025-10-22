CREATE TABLE `games` (
	`id` varchar(64) NOT NULL,
	`playerXId` varchar(64) NOT NULL,
	`playerOId` varchar(64) NOT NULL,
	`winnerId` varchar(64),
	`result` enum('X','O','draw') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_playerXId_users_id_fk` FOREIGN KEY (`playerXId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_playerOId_users_id_fk` FOREIGN KEY (`playerOId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_winnerId_users_id_fk` FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;