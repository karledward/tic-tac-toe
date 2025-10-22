CREATE TABLE `gameRooms` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`hostId` varchar(64) NOT NULL,
	`guestId` varchar(64),
	`status` enum('waiting','playing','finished') NOT NULL DEFAULT 'waiting',
	`currentTurn` enum('X','O') DEFAULT 'X',
	`boardState` text NOT NULL,
	`winnerId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameRooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `gameRooms` ADD CONSTRAINT `gameRooms_hostId_users_id_fk` FOREIGN KEY (`hostId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gameRooms` ADD CONSTRAINT `gameRooms_guestId_users_id_fk` FOREIGN KEY (`guestId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gameRooms` ADD CONSTRAINT `gameRooms_winnerId_users_id_fk` FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;