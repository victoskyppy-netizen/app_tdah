import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createRoutine = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    timeOfDay: v.union(v.literal("morning"), v.literal("afternoon"), v.literal("evening"), v.literal("night")),
    tasks: v.array(v.object({
      title: v.string(),
      estimatedMinutes: v.optional(v.number()),
      order: v.number()
    })),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const tasksWithIds = args.tasks.map(task => ({
      id: crypto.randomUUID(),
      title: task.title,
      estimatedMinutes: task.estimatedMinutes,
      completed: false,
      order: task.order
    }));

    return await ctx.db.insert("routines", {
      userId,
      name: args.name,
      description: args.description,
      timeOfDay: args.timeOfDay,
      tasks: tasksWithIds,
      isActive: true,
      color: args.color || "#3B82F6",
      icon: args.icon || "🌟",
    });
  },
});

export const getRoutines = query({
  args: {
    timeOfDay: v.optional(v.union(v.literal("morning"), v.literal("afternoon"), v.literal("evening"), v.literal("night"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let query = ctx.db.query("routines").withIndex("by_user", (q) => q.eq("userId", userId));
    
    const routines = await query.collect();
    
    if (args.timeOfDay) {
      return routines.filter(r => r.timeOfDay === args.timeOfDay);
    }
    
    return routines;
  },
});

export const executeRoutine = mutation({
  args: {
    routineId: v.id("routines"),
    completedTaskIds: v.array(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const routine = await ctx.db.get(args.routineId);
    if (!routine || routine.userId !== userId) {
      throw new Error("Rotina não encontrada");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const totalTasks = routine.tasks.length;
    const completionRate = totalTasks > 0 ? (args.completedTaskIds.length / totalTasks) * 100 : 0;

    // Verificar se já existe execução para hoje
    const existingExecution = await ctx.db
      .query("routineExecutions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", todayTimestamp))
      .filter((q) => q.eq(q.field("routineId"), args.routineId))
      .first();

    if (existingExecution) {
      await ctx.db.patch(existingExecution._id, {
        completedTasks: args.completedTaskIds,
        completionRate,
        notes: args.notes,
      });
      return existingExecution._id;
    } else {
      return await ctx.db.insert("routineExecutions", {
        userId,
        routineId: args.routineId,
        date: todayTimestamp,
        completedTasks: args.completedTaskIds,
        totalTasks,
        completionRate,
        notes: args.notes,
      });
    }
  },
});

export const getRoutineStats = query({
  args: {
    routineId: v.id("routines"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const days = args.days || 30;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    const executions = await ctx.db
      .query("routineExecutions")
      .withIndex("by_routine", (q) => q.eq("routineId", args.routineId))
      .filter((q) => q.gte(q.field("date"), startDate))
      .collect();

    const totalExecutions = executions.length;
    const averageCompletion = totalExecutions > 0 
      ? executions.reduce((sum, exec) => sum + exec.completionRate, 0) / totalExecutions 
      : 0;

    const streak = calculateStreak(executions);

    return {
      totalExecutions,
      averageCompletion: Math.round(averageCompletion),
      streak,
      recentExecutions: executions.slice(-7)
    };
  },
});

function calculateStreak(executions: any[]): number {
  if (executions.length === 0) return 0;
  
  // Ordenar por data (mais recente primeiro)
  const sortedExecutions = executions
    .sort((a, b) => b.date - a.date)
    .filter(exec => exec.completionRate >= 70); // Considerar 70%+ como sucesso

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let currentDate = today.getTime();

  for (const execution of sortedExecutions) {
    if (execution.date === currentDate) {
      streak++;
      currentDate -= 24 * 60 * 60 * 1000; // Voltar um dia
    } else {
      break;
    }
  }

  return streak;
}

export const updateRoutine = mutation({
  args: {
    routineId: v.id("routines"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tasks: v.optional(v.array(v.object({
      id: v.optional(v.string()),
      title: v.string(),
      estimatedMinutes: v.optional(v.number()),
      order: v.number()
    }))),
    isActive: v.optional(v.boolean()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const routine = await ctx.db.get(args.routineId);
    if (!routine || routine.userId !== userId) {
      throw new Error("Rotina não encontrada");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.color !== undefined) updates.color = args.color;
    if (args.icon !== undefined) updates.icon = args.icon;

    if (args.tasks !== undefined) {
      const tasksWithIds = args.tasks.map(task => ({
        id: task.id || crypto.randomUUID(),
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
        completed: false,
        order: task.order
      }));
      updates.tasks = tasksWithIds;
    }

    await ctx.db.patch(args.routineId, updates);
  },
});

export const deleteRoutine = mutation({
  args: {
    routineId: v.id("routines"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const routine = await ctx.db.get(args.routineId);
    if (!routine || routine.userId !== userId) {
      throw new Error("Rotina não encontrada");
    }

    await ctx.db.delete(args.routineId);
  },
});
