CREATE TABLE `lobbys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`masterId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`accessCode` varchar(8) NOT NULL,
	`maxPlayers` int NOT NULL DEFAULT 6,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lobbys_id` PRIMARY KEY(`id`),
	CONSTRAINT `lobbys_accessCode_unique` UNIQUE(`accessCode`)
);
