CREATE TABLE `sessionParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`masterId` int NOT NULL,
	`characterId` int,
	`role` enum('mestre','jogador') NOT NULL,
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessionParticipants_id` PRIMARY KEY(`id`)
);
