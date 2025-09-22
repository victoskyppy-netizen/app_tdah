import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createPomodoroSession = mutation({
  args: {
    taskId: v.optional(v.id("tasks")),
    duration: v.number(),
    type: v.union(v.literal("work"), v.literal("short_break"), v.literal("long_break")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    return await ctx.db.insert("pomodoroSessions", {
      userId,
      taskId: args.taskId,
      duration: args.duration,
      type: args.type,
      completedAt: Date.now(),
    });
  },
});

export const getPomodoroStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { totalSessions: 0, totalMinutes: 0, workSessions: 0 };

    const days = args.days || 7;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    const sessions = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("completedAt"), startDate))
      .collect();

    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    const workSessions = sessions.filter(session => session.type === "work").length;

    return { totalSessions, totalMinutes, workSessions };
  },
});
