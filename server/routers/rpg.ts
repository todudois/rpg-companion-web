import { protectedProcedure, router } from "../_core/trpc";
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
  cost: z.number().int().min(0).default(0),
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
        return character;
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
        const character = await getCharacterById(input.characterId);
        if (!character) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (character.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getCharacterAttributes(input.characterId);
      }),

    upsert: protectedProcedure
      .input(z.object({ characterId: z.number(), data: attributeSchema }))
      .mutation(async ({ ctx, input }) => {
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
      .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
      .query(async ({ ctx, input }) => {
        return getDiceRollsByUserId(ctx.user.id, input.limit);
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
      .input(z.object({ canvasData: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Only the user can save their own canvas
        return upsertMasterCanvasData(ctx.user.id, input.canvasData);
      }),
  }),
});
