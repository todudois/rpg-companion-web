ALTER TABLE `sessionParticipants` ADD `lobbyId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sessionParticipants` DROP COLUMN `masterId`;