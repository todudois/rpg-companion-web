ALTER TABLE `characterSkills` MODIFY COLUMN `cost` varchar(255);--> statement-breakpoint
ALTER TABLE `characterSkills` ADD `type` enum('passiva','ativa','ataque','especial') DEFAULT 'ativa' NOT NULL;--> statement-breakpoint
ALTER TABLE `characterSkills` ADD `damage` varchar(255);--> statement-breakpoint
ALTER TABLE `characterSkills` ADD `cooldown` varchar(255);--> statement-breakpoint
ALTER TABLE `characterSkills` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;