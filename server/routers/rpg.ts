import { protectedProcedure, router } from "../_core/trpc";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createCharacter,
  getCharactersByUserId,
  getCharacterById,
  updateCharacter,
  deleteCharacter,
  getCharacterAttributes,
  upsertCharacterAttributes,
  getCharacterSkills,
  createCharacterSkill,
  deleteCharacterSkill,
  createDiceRoll,
  getDiceRollsByUserId,
  getMasterCanvasData,
  upsertMasterCanvasData,
  upsertSessionParticipant,
  getSessionParticipants,
  removeSessionParticipant,
  createLobby,
  getLobbyByAccessCode,
  getLobbyById,
  getActiveLobbysByMasterId,
  getAvailableLobbys,
  closeLobby,
  deleteLobby,
  getMasterInLobby,
} from "../db";

const characterSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  classe: z.string().min(1, "Classe é obrigatória"),
  raca: z.string().min(1, "Raça é obrigatória"),
  nivel: z.number().int().min(1).default(1),
  hp: z.number().int().min(0).default(10),
  hpMax: z.number().int().min(0).default(10),
  vigor: z.number().int().min(0).default(0),
  vigorMax: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

const attributeSchema = z.object({
  for: z.number().int().default(0),
  des: z.number().int().default(0),
  con: z.number().int().default(0),
  int: z.number().int().default(0),
  sab: z.number().int().default(0),
  car: z.number().int().default(0),
  sob: z.number().int().default(0),
  sor: z.number().int().default(0),
  fe: z.number().int().default(0),
});

const skillSchema = z.object({
  name: z.string().min(1, "Nome da habilidade é obrigatório"),
  type: z.enum(["passiva", "ativa", "ataque", "especial"]).default("ativa"),
  cost: z.string().optional(),
  damage: z.string().optional(),
  cooldown: z.string().optional(),
  description: z.string().optional(),
});

const diceRollSchema = z.object({
  numDice: z.number().int().min(1),
  diceType: z.number().int(),
  pureResults: z.array(z.number()),
  totalUnitBonus: z.number().int().default(0),
  total: z.number().int(),
  attributeKey: z.string().optional(),
  characterId: z.number().int().optional(),
  isCrit: z.boolean().default(false),
  isFail: z.boolean().default(false),
});

export const rpgRouter = router({
  // Character procedures
  characters: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getCharactersByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const character = await getCharacterById(input.id);
        if (!character) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (character.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const skills = await getCharacterSkills(input.id);
        return { ...character, skills };
      }),

    create: protectedProcedure
      .input(characterSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await createCharacter(ctx.user.id, input);
        return result;
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: characterSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacterById(input.id);
        if (!character) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (character.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return updateCharacter(input.id, input.data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacterById(input.id);
        if (!character) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (character.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return deleteCharacter(input.id);
      }),
  }),

  // Character attributes procedures
  attributes: router({
    get: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Se characterId eh 0 ou negativo, retornar null (personagem nao vinculado)
        if (input.characterId <= 0) {
          return null;
        }
        const character = await getCharacterById(input.characterId);
        if (!character) {
          return null; // Retornar null em vez de lancar erro
        }
        if (character.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getCharacterAttributes(input.characterId);
      }),

    upsert: protectedProcedure
      .input(z.object({ characterId: z.number(), data: attributeSchema }))
      .mutation(async ({ ctx, input }) => {
        // Validar que characterId eh valido
        if (input.characterId <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid character ID" });
        }
        const character = await getCharacterById(input.characterId);
        if (!character) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (character.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return upsertCharacterAttributes(input.characterId, input.data);
      }),
  }),

  // Character skills procedures
  skills: router({
    list: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .query(async ({ ctx, input }) => {
        const character = await getCharacterById(input.characterId);
        if (!character) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (character.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getCharacterSkills(input.characterId);
      }),

    create: protectedProcedure
      .input(z.object({ characterId: z.number(), data: skillSchema }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacterById(input.characterId);
        if (!character) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (character.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return createCharacterSkill(input.characterId, input.data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteCharacterSkill(input.id);
      }),
  }),

  // Dice rolls procedures
  diceRolls: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
      .query(async ({ ctx, input }) => {
        return getDiceRollsByUserId(ctx.user.id, input?.limit || 50);
      }),

    create: protectedProcedure
      .input(diceRollSchema)
      .mutation(async ({ ctx, input }) => {
        if (input.characterId) {
          const character = await getCharacterById(input.characterId);
          if (!character) {
            throw new TRPCError({ code: "NOT_FOUND" });
          }
          if (character.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }
        return createDiceRoll(ctx.user.id, input);
      }),
  }),

  // Master canvas procedures - shared canvas for master and players
  masterCanvas: router({
    get: protectedProcedure
      .input(z.object({ masterId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        // If masterId is provided, get the master's canvas (for players viewing)
        // Otherwise, get the current user's canvas (for the master)
        const userId = input?.masterId || ctx.user.id;
        return getMasterCanvasData(userId);
      }),

    save: protectedProcedure
      .input(z.object({ canvasData: z.string(), imagesData: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        // Only the user can save their own canvas
        return upsertMasterCanvasData(ctx.user.id, input.canvasData, input.imagesData);
      }),
  }),

  session: router({
    join: protectedProcedure
      .input(z.object({ lobbyId: z.number(), characterId: z.number().optional(), role: z.enum(["mestre", "jogador"]) }))
      .mutation(async ({ ctx, input }) => {
        return upsertSessionParticipant(ctx.user.id, input.lobbyId, input.characterId || null, input.role);
      }),

    getUsers: protectedProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getSessionParticipants(input.lobbyId);
      }),

    leave: protectedProcedure.mutation(async ({ ctx }) => {
      return removeSessionParticipant(ctx.user.id);
    }),

    updateRole: protectedProcedure
      .input(z.object({ lobbyId: z.number(), role: z.enum(["mestre", "jogador", "espectador", "indefinido"]) }))
      .mutation(async ({ ctx, input }) => {
        if (input.role === "mestre") {
          const existingMaster = await getMasterInLobby(input.lobbyId);
          if (existingMaster && existingMaster.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Já existe um Mestre neste lobby" });
          }
        }
        return upsertSessionParticipant(ctx.user.id, input.lobbyId, null, input.role);
      }),
  }),

  lobby: router({
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1), password: z.string().min(4), maxPlayers: z.number().int().min(2).max(10).default(6) }))
      .mutation(async ({ ctx, input }) => {
        const passwordHash = await hash(input.password, 10);
        const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const lobby = await createLobby(ctx.user.id, input.name, passwordHash, accessCode);
        if (lobby?.id) {
          await upsertSessionParticipant(ctx.user.id, lobby.id, null, "mestre");
        }
        return { ...lobby, masterId: ctx.user.id };
      }),

    getAvailable: protectedProcedure.query(async () => {
      return getAvailableLobbys();
    }),

    getMyLobbys: protectedProcedure.query(async ({ ctx }) => {
      return getActiveLobbysByMasterId(ctx.user.id);
    }),

    join: protectedProcedure
      .input(z.object({ accessCode: z.string(), password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const lobby = await getLobbyByAccessCode(input.accessCode);
        if (!lobby) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lobby não encontrado" });
        }
        if (!lobby.isActive) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Lobby foi fechado" });
        }
        const passwordMatch = await compare(input.password, lobby.passwordHash);
        if (!passwordMatch) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Senha incorreta" });
        }
        await upsertSessionParticipant(ctx.user.id, lobby.id, null, "jogador");
        // Get the master user ID for this lobby
        const master = await getMasterInLobby(lobby.id);
        return { ...lobby, masterId: master?.userId || null };
      }),

    close: protectedProcedure
      .input(z.object({ lobbyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const lobby = await getLobbyById(input.lobbyId);
        if (!lobby) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (lobby.masterId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o Mestre pode fechar o lobby" });
        }
        return closeLobby(input.lobbyId);
      }),

    delete: protectedProcedure
      .input(z.object({ lobbyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const lobby = await getLobbyById(input.lobbyId);
        if (!lobby) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (lobby.masterId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o criador pode deletar o lobby" });
        }
        return deleteLobby(input.lobbyId);
      }),

    getMasterStatus: protectedProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(async ({ input }) => {
        return getMasterInLobby(input.lobbyId);
      }),
  }),
});
