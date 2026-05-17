import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, characters, characterAttributes, characterSkills, diceRolls, masterCanvasData, sessionParticipants, lobbys, Character, CharacterAttribute, CharacterSkill, DiceRoll, InsertCharacter, InsertCharacterAttribute, InsertCharacterSkill, InsertDiceRoll, InsertMasterCanvasData, SessionParticipant, InsertSessionParticipant, Lobby, InsertLobby } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Character queries
export async function createCharacter(userId: number, data: Omit<InsertCharacter, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(characters).values({
    ...data,
    userId,
  });
  
  // Fetch the created character to get its ID
  const result = await db.select().from(characters).where(eq(characters.userId, userId)).orderBy(desc(characters.id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getCharactersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(characters).where(eq(characters.userId, userId));
}

export async function getCharacterById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(characters).where(eq(characters.id, id));
  return result.length > 0 ? result[0] : null;
}

export async function updateCharacter(id: number, data: Partial<InsertCharacter>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(characters).set(data).where(eq(characters.id, id));
}

export async function deleteCharacter(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related data first
  await db.delete(characterAttributes).where(eq(characterAttributes.characterId, id));
  await db.delete(characterSkills).where(eq(characterSkills.characterId, id));
  await db.delete(diceRolls).where(eq(diceRolls.characterId, id));
  
  return db.delete(characters).where(eq(characters.id, id));
}

// Character attributes queries
export async function getCharacterAttributes(characterId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(characterAttributes).where(eq(characterAttributes.characterId, characterId));
  return result.length > 0 ? result[0] : null;
}

export async function upsertCharacterAttributes(characterId: number, data: Omit<InsertCharacterAttribute, 'characterId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getCharacterAttributes(characterId);
  
  if (existing) {
    return db.update(characterAttributes).set(data).where(eq(characterAttributes.characterId, characterId));
  } else {
    return db.insert(characterAttributes).values({
      ...data,
      characterId,
    });
  }
}

// Character skills queries
export async function getCharacterSkills(characterId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(characterSkills).where(eq(characterSkills.characterId, characterId));
}

export async function createCharacterSkill(characterId: number, data: Omit<InsertCharacterSkill, 'characterId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(characterSkills).values({
    ...data,
    characterId,
  });
}

export async function deleteCharacterSkill(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(characterSkills).where(eq(characterSkills.id, id));
}

// Dice rolls queries
export async function createDiceRoll(userId: number, data: Omit<InsertDiceRoll, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(diceRolls).values({
    ...data,
    userId,
  });
}

export async function getDiceRollsByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(diceRolls)
    .where(eq(diceRolls.userId, userId))
    .orderBy(desc(diceRolls.createdAt))
    .limit(limit);
}

// Master canvas queries
export async function getMasterCanvasData(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(masterCanvasData).where(eq(masterCanvasData.userId, userId));
  return result.length > 0 ? result[0] : null;
}

export async function upsertMasterCanvasData(userId: number, canvasData: string, imagesData?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getMasterCanvasData(userId);
  
  if (existing) {
    const updateData: any = { canvasData };
    if (imagesData !== undefined) {
      updateData.imagesData = imagesData;
    }
    return db.update(masterCanvasData).set(updateData).where(eq(masterCanvasData.userId, userId));
  } else {
    return db.insert(masterCanvasData).values({
      userId,
      canvasData,
      imagesData: imagesData || null,
    });
  }
}


// Session participant queries
export async function upsertSessionParticipant(userId: number, lobbyId: number, characterId: number | null, role: "mestre" | "jogador" | "espectador" | "indefinido") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(sessionParticipants)
    .where(eq(sessionParticipants.userId, userId));
  
  if (existing.length > 0) {
    return db.update(sessionParticipants)
      .set({ lobbyId, characterId, role })
      .where(eq(sessionParticipants.userId, userId));
  } else {
    return db.insert(sessionParticipants).values({
      userId,
      lobbyId,
      characterId,
      role,
    });
  }
}

export async function getSessionParticipants(lobbyId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: sessionParticipants.id,
    userId: sessionParticipants.userId,
    characterId: sessionParticipants.characterId,
    role: sessionParticipants.role,
    userName: users.name,
    characterName: characters.name,
  })
    .from(sessionParticipants)
    .leftJoin(users, eq(sessionParticipants.userId, users.id))
    .leftJoin(characters, eq(sessionParticipants.characterId, characters.id))
    .where(eq(sessionParticipants.lobbyId, lobbyId));
}

export async function removeSessionParticipant(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  return db.delete(sessionParticipants).where(eq(sessionParticipants.userId, userId));
}


// Lobby queries
export async function createLobby(masterId: number, name: string, passwordHash: string, accessCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(lobbys).values({
    masterId,
    name,
    passwordHash,
    accessCode,
  });
  
  // Retornar o lobby criado
  const result = await db.select().from(lobbys).where(eq(lobbys.accessCode, accessCode));
  return result.length > 0 ? result[0] : null;
}

export async function getLobbyByAccessCode(accessCode: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(lobbys).where(eq(lobbys.accessCode, accessCode));
  return result.length > 0 ? result[0] : null;
}

export async function getLobbyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(lobbys).where(eq(lobbys.id, id));
  return result.length > 0 ? result[0] : null;
}

export async function getActiveLobbysByMasterId(masterId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(lobbys)
    .where(eq(lobbys.masterId, masterId))
    .orderBy(desc(lobbys.createdAt));
}

export async function getAvailableLobbys() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: lobbys.id,
    name: lobbys.name,
    accessCode: lobbys.accessCode,
    maxPlayers: lobbys.maxPlayers,
    masterName: users.name,
  })
    .from(lobbys)
    .leftJoin(users, eq(lobbys.masterId, users.id))
    .where(eq(lobbys.isActive, true))
    .orderBy(desc(lobbys.createdAt));
}

export async function closeLobby(id: number) {
  const db = await getDb();
  if (!db) return;
  
  return db.update(lobbys).set({ isActive: false }).where(eq(lobbys.id, id));
}

export async function deleteLobby(id: number) {
  const db = await getDb();
  if (!db) return;
  
  // Deletar participantes primeiro
  await db.delete(sessionParticipants).where(eq(sessionParticipants.lobbyId, id));
  
  // Deletar lobby
  return db.delete(lobbys).where(eq(lobbys.id, id));
}

export async function getMasterInLobby(lobbyId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(sessionParticipants)
    .where(and(eq(sessionParticipants.lobbyId, lobbyId), eq(sessionParticipants.role, "mestre")));
  
  return result.length > 0 ? result[0] : null;
}
