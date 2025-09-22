import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  tasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed")),
    estimatedMinutes: v.optional(v.number()),
    actualMinutes: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    category: v.optional(v.string()),
    subtasks: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      completed: v.boolean()
    }))),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_priority", ["userId", "priority"]),

  pomodoroSessions: defineTable({
    userId: v.id("users"),
    taskId: v.optional(v.id("tasks")),
    duration: v.number(), // em minutos
    type: v.union(v.literal("work"), v.literal("short_break"), v.literal("long_break")),
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_task", ["taskId"]),

  moodEntries: defineTable({
    userId: v.id("users"),
    mood: v.union(v.literal("very_low"), v.literal("low"), v.literal("neutral"), v.literal("good"), v.literal("excellent")),
    energy: v.union(v.literal("very_low"), v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("very_high")),
    focus: v.union(v.literal("very_low"), v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("very_high")),
    notes: v.optional(v.string()),
    date: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  routines: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    timeOfDay: v.union(v.literal("morning"), v.literal("afternoon"), v.literal("evening"), v.literal("night")),
    tasks: v.array(v.object({
      id: v.string(),
      title: v.string(),
      estimatedMinutes: v.optional(v.number()),
      completed: v.boolean(),
      order: v.number()
    })),
    isActive: v.boolean(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  routineExecutions: defineTable({
    userId: v.id("users"),
    routineId: v.id("routines"),
    date: v.number(),
    completedTasks: v.array(v.string()),
    totalTasks: v.number(),
    completionRate: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_routine", ["routineId"])
    .index("by_user_date", ["userId", "date"]),

  chatMessages: defineTable({
    userId: v.id("users"),
    message: v.string(),
    response: v.string(),
    type: v.union(v.literal("general"), v.literal("routine"), v.literal("task"), v.literal("mood"), v.literal("enneagram")),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  enneagramResults: defineTable({
    userId: v.id("users"),
    type: v.number(), // 1-9
    wing: v.optional(v.number()),
    description: v.string(),
    strengths: v.array(v.string()),
    challenges: v.array(v.string()),
    growthTips: v.array(v.string()),
    completedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  transformationPlan: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("paused")),
    weeks: v.array(v.object({
      weekNumber: v.number(),
      theme: v.string(),
      goals: v.array(v.string()),
      habits: v.array(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        frequency: v.string(), // daily, weekly, etc
        completed: v.boolean()
      })),
      reflections: v.optional(v.string())
    })),
    currentWeek: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  habitTracking: defineTable({
    userId: v.id("users"),
    planId: v.id("transformationPlan"),
    habitId: v.string(),
    date: v.number(),
    completed: v.boolean(),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_plan", ["planId"])
    .index("by_user_date", ["userId", "date"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
