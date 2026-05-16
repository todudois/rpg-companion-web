CREATE TABLE `characterAttributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`characterId` int NOT NULL,
	`for` int NOT NULL DEFAULT 0,
	`des` int NOT NULL DEFAULT 0,
	`con` int NOT NULL DEFAULT 0,
	`int` int NOT NULL DEFAULT 0,
	`sab` int NOT NULL DEFAULT 0,
	`car` int NOT NULL DEFAULT 0,
	`sob` int NOT NULL DEFAULT 0,
	`sor` int NOT NULL DEFAULT 0,
	`fe` int NOT NULL DEFAULT 0,
	CONSTRAINT `characterAttributes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `characterSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`characterId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`cost` int NOT NULL DEFAULT 0,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `characterSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`classe` varchar(255) NOT NULL,
	`raca` varchar(255) NOT NULL,
	`nivel` int NOT NULL DEFAULT 1,
	`hp` int NOT NULL DEFAULT 10,
	`hpMax` int NOT NULL DEFAULT 10,
	`vigor` int NOT NULL DEFAULT 0,
	`vigorMax` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `characters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diceRolls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`characterId` int,
	`numDice` int NOT NULL,
	`diceType` int NOT NULL,
	`pureResults` json NOT NULL,
	`totalUnitBonus` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`attributeKey` varchar(64),
	`isCrit` boolean NOT NULL DEFAULT false,
	`isFail` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diceRolls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `masterCanvasData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`canvasData` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `masterCanvasData_id` PRIMARY KEY(`id`)
);
