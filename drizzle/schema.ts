import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal, unique } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { longtext } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Characters table - stores all player characters
 */
export const characters = mysqlTable("characters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  classe: varchar("classe", { length: 255 }).notNull(),
  raca: varchar("raca", { length: 255 }).notNull(),
  nivel: int("nivel").default(1).notNull(),
  hp: int("hp").default(10).notNull(),
  hpMax: int("hpMax").default(10).notNull(),
  vigor: int("vigor").default(0).notNull(),
  vigorMax: int("vigorMax").default(0).notNull(),
  vigorType: mysqlEnum("vigorType", ["vigor", "mana"]).default("vigor").notNull(),
  notes: text("notes"),
  imageUrl: text("imageUrl"), // URL to character portrait/avatar image
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;

/**
 * Character attributes - stores bonuses for each character
 */
export const characterAttributes = mysqlTable("characterAttributes", {
  id: int("id").autoincrement().primaryKey(),
  characterId: int("characterId").notNull(),
  for: int("for").default(0).notNull(), // Força
  des: int("des").default(0).notNull(), // Destreza
  con: int("con").default(0).notNull(), // Constituição
  int: int("int").default(0).notNull(), // Inteligência
  sab: int("sab").default(0).notNull(), // Sabedoria
  car: int("car").default(0).notNull(), // Carisma
  sob: int("sob").default(0).notNull(), // Sobrevivência
  sor: int("sor").default(0).notNull(), // Sorte
  fe: int("fe").default(0).notNull(), // Fé
});

export type CharacterAttribute = typeof characterAttributes.$inferSelect;
export type InsertCharacterAttribute = typeof characterAttributes.$inferInsert;

/**
 * Character skills - stores abilities for each character
 */
export const characterSkills = mysqlTable("characterSkills", {
  id: int("id").autoincrement().primaryKey(),
  characterId: int("characterId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["passiva", "ativa", "ataque", "especial"]).default("ativa").notNull(),
  cost: varchar("cost", { length: 255 }),
  damage: varchar("damage", { length: 255 }),
  cooldown: varchar("cooldown", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CharacterSkill = typeof characterSkills.$inferSelect;
export type InsertCharacterSkill = typeof characterSkills.$inferInsert;

/**
 * Dice rolls history - stores all dice rolls for persistence
 */
export const diceRolls = mysqlTable("diceRolls", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  characterId: int("characterId"),
  numDice: int("numDice").notNull(),
  diceType: int("diceType").notNull(),
  pureResults: json("pureResults").$type<number[]>().notNull(),
  totalUnitBonus: int("totalUnitBonus").default(0).notNull(),
  total: int("total").notNull(),
  attributeKey: varchar("attributeKey", { length: 64 }),
  isCrit: boolean("isCrit").default(false).notNull(),
  isFail: boolean("isFail").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DiceRoll = typeof diceRolls.$inferSelect;
export type InsertDiceRoll = typeof diceRolls.$inferInsert;

/**
 * Master canvas data - stores drawing data for the master's screen
 */
// Image metadata stored in imagesData JSON: {id, url, x, y, width, height, zIndex}
export const masterCanvasData = mysqlTable("masterCanvasData", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lobbyId: int("lobbyId").notNull(), // Canvas is unique per lobby
  canvasData: longtext("canvasData").notNull(), // Base64 encoded canvas image (longtext for large images)
  imagesData: longtext("imagesData"), // JSON array of image metadata {id, url, x, y, width, height, zIndex}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueUserLobby: unique().on(table.userId, table.lobbyId),
}));

export type MasterCanvasData = typeof masterCanvasData.$inferSelect;
export type InsertMasterCanvasData = typeof masterCanvasData.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  diceRolls: many(diceRolls),
  masterCanvasData: many(masterCanvasData),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  attributes: one(characterAttributes, {
    fields: [characters.id],
    references: [characterAttributes.characterId],
  }),
  skills: many(characterSkills),
  diceRolls: many(diceRolls),
}));

export const characterAttributesRelations = relations(characterAttributes, ({ one }) => ({
  character: one(characters, {
    fields: [characterAttributes.characterId],
    references: [characters.id],
  }),
}));

export const characterSkillsRelations = relations(characterSkills, ({ one }) => ({
  character: one(characters, {
    fields: [characterSkills.characterId],
    references: [characters.id],
  }),
}));

export const diceRollsRelations = relations(diceRolls, ({ one }) => ({
  user: one(users, {
    fields: [diceRolls.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [diceRolls.characterId],
    references: [characters.id],
  }),
}));

export const masterCanvasDataRelations = relations(masterCanvasData, ({ one }) => ({
  user: one(users, {
    fields: [masterCanvasData.userId],
    references: [users.id],
  }),
}));


/**
 * Session participants - tracks who is in a session and their role/character
 */
export const sessionParticipants = mysqlTable("sessionParticipants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lobbyId: int("lobbyId").notNull(),
  characterId: int("characterId"),
  role: mysqlEnum("role", ["mestre", "jogador", "espectador", "indefinido"]).notNull().default("indefinido"),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionParticipant = typeof sessionParticipants.$inferSelect;
export type InsertSessionParticipant = typeof sessionParticipants.$inferInsert;

export const sessionParticipantsRelations = relations(sessionParticipants, ({ one }) => ({
  user: one(users, {
    fields: [sessionParticipants.userId],
    references: [users.id],
  }),
  lobby: one(lobbys, {
    fields: [sessionParticipants.lobbyId],
    references: [lobbys.id],
  }),
  character: one(characters, {
    fields: [sessionParticipants.characterId],
    references: [characters.id],
  }),
}));


/**
 * Game lobbys - stores game sessions that players can join
 */
export const lobbys = mysqlTable("lobbys", {
  id: int("id").autoincrement().primaryKey(),
  masterId: int("masterId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  accessCode: varchar("accessCode", { length: 8 }).notNull().unique(),
  maxPlayers: int("maxPlayers").default(6).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lobby = typeof lobbys.$inferSelect;
export type InsertLobby = typeof lobbys.$inferInsert;

export const lobbysRelations = relations(lobbys, ({ one, many }) => ({
  master: one(users, {
    fields: [lobbys.masterId],
    references: [users.id],
  }),
  participants: many(sessionParticipants),
}));
