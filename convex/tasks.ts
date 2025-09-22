import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    estimatedMinutes: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    return await ctx.db.insert("tasks", {
      userId,
      title: args.title,
      description: args.description,
      priority: args.priority,
      status: "todo",
      estimatedMinutes: args.estimatedMinutes,
      dueDate: args.dueDate,
      category: args.category,
    });
  },
});

export const getTasks = query({
  args: {
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let query = ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId));
    
    if (args.status) {
      query = ctx.db.query("tasks").withIndex("by_user_status", (q) => 
        q.eq("userId", userId).eq("status", args.status!)
      );
    }

    return await query.order("desc").collect();
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Tarefa não encontrada");
    }

    const updates: any = { status: args.status };
    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.taskId, updates);
  },
});

export const addSubtask = mutation({
  args: {
    taskId: v.id("tasks"),
    subtaskTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Tarefa não encontrada");
    }

    const subtasks = task.subtasks || [];
    const newSubtask = {
      id: crypto.randomUUID(),
      title: args.subtaskTitle,
      completed: false,
    };

    await ctx.db.patch(args.taskId, {
      subtasks: [...subtasks, newSubtask],
    });
  },
});

export const toggleSubtask = mutation({
  args: {
    taskId: v.id("tasks"),
    subtaskId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Tarefa não encontrada");
    }

    const subtasks = task.subtasks || [];
    const updatedSubtasks = subtasks.map(subtask =>
      subtask.id === args.subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );

    await ctx.db.patch(args.taskId, {
      subtasks: updatedSubtasks,
    });
  },
});

export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Tarefa não encontrada");
    }

    await ctx.db.delete(args.taskId);
  },
});
