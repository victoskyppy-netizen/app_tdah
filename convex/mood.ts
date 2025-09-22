import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createMoodEntry = mutation({
  args: {
    mood: v.union(v.literal("very_low"), v.literal("low"), v.literal("neutral"), v.literal("good"), v.literal("excellent")),
    energy: v.union(v.literal("very_low"), v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("very_high")),
    focus: v.union(v.literal("very_low"), v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("very_high")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    // Verificar se já existe entrada para hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const existingEntry = await ctx.db
      .query("moodEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", todayTimestamp))
      .first();

    if (existingEntry) {
      // Atualizar entrada existente
      await ctx.db.patch(existingEntry._id, {
        mood: args.mood,
        energy: args.energy,
        focus: args.focus,
        notes: args.notes,
      });
      return existingEntry._id;
    } else {
      // Criar nova entrada
      return await ctx.db.insert("moodEntries", {
        userId,
        mood: args.mood,
        energy: args.energy,
        focus: args.focus,
        notes: args.notes,
        date: todayTimestamp,
      });
    }
  },
});

export const getMoodEntries = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const days = args.days || 30;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    return await ctx.db
      .query("moodEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), startDate))
      .order("desc")
      .collect();
  },
});

export const getTodayMoodEntry = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return await ctx.db
      .query("moodEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", todayTimestamp))
      .first();
  },
});
