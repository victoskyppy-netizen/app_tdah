import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getSmartSuggestions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Buscar dados do usuário
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const recentMoods = await ctx.db
      .query("moodEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(3);

    const enneagramResult = await ctx.db
      .query("enneagramResults")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const activePlan = await ctx.db
      .query("transformationPlan")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .first();

    // Gerar sugestões baseadas nos dados
    const suggestions = [];

    // Sugestão baseada em tarefas
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');
    const urgentTasks = incompleteTasks.filter(t => t.priority === 'urgent');
    
    if (urgentTasks.length > 3) {
      suggestions.push({
        icon: "🚨",
        title: "Muitas tarefas urgentes",
        description: "Você tem muitas tarefas urgentes. Que tal usar a técnica Pomodoro para focar em uma de cada vez?",
        action: "pomodoro"
      });
    }

    // Sugestão baseada no humor
    if (recentMoods.length > 0) {
      const avgMood = recentMoods.reduce((sum, mood) => {
        const moodValue = { very_low: 1, low: 2, neutral: 3, good: 4, excellent: 5 }[mood.mood];
        return sum + moodValue;
      }, 0) / recentMoods.length;

      if (avgMood < 2.5) {
        suggestions.push({
          icon: "🌱",
          title: "Humor baixo detectado",
          description: "Que tal fazer uma pausa de 5 minutos para respirar ou dar uma caminhada rápida?",
          action: "mood_boost"
        });
      }
    }

    // Sugestão baseada no Eneagrama
    if (enneagramResult) {
      const typeAdvice = getEnneagramAdvice(enneagramResult.type);
      suggestions.push({
        icon: "🎯",
        title: `Dica para Tipo ${enneagramResult.type}`,
        description: typeAdvice,
        action: "enneagram_tip"
      });
    }

    // Sugestão baseada no plano de transformação
    if (activePlan && activePlan.currentWeek <= 4) {
      suggestions.push({
        icon: "🚀",
        title: "Plano de Transformação",
        description: `Você está na semana ${activePlan.currentWeek} do seu plano. Continue firme!`,
        action: "transformation_plan"
      });
    }

    // Sugestão de rotina baseada no horário
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 10) {
      suggestions.push({
        icon: "🌅",
        title: "Rotina Matinal",
        description: "Bom dia! Que tal começar com sua rotina matinal para ter um dia mais produtivo?",
        action: "morning_routine"
      });
    }

    return suggestions.slice(0, 6); // Máximo 6 sugestões
  },
});

function getEnneagramAdvice(type: number): string {
  const advice = {
    1: "Lembre-se: 'bom o suficiente' é melhor que perfeito e atrasado. Foque no progresso, não na perfeição.",
    2: "Reserve 15 minutos hoje só para você. Suas necessidades também são importantes!",
    3: "Que tal agendar uma pausa sem objetivos? Descansar também é produtivo.",
    4: "Conecte suas tarefas com seus valores pessoais. Isso pode aumentar sua motivação.",
    5: "Defina um limite de tempo para pesquisa. Às vezes, informação 'suficiente' é melhor que perfeita.",
    6: "Confie em si mesmo! Você já tomou boas decisões antes. Liste suas conquistas recentes.",
    7: "Foque em uma tarefa por vez hoje. Use um timer para manter o foco em blocos menores.",
    8: "Pratique delegar uma pequena tarefa hoje. Você não precisa fazer tudo sozinho.",
    9: "Identifique sua tarefa mais importante e comece por ela, mesmo que seja só por 10 minutos."
  };

  return advice[type as keyof typeof advice] || advice[1];
}

export const getProductivityInsights = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // Buscar dados dos últimos 7 dias
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("_creationTime"), last7Days))
      .collect();

    const moodEntries = await ctx.db
      .query("moodEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), last7Days))
      .collect();

    const pomodoroSessions = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("completedAt"), last7Days))
      .collect();

    // Calcular insights
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const avgMood = moodEntries.length > 0 
      ? moodEntries.reduce((sum, mood) => {
          const moodValue = { very_low: 1, low: 2, neutral: 3, good: 4, excellent: 5 }[mood.mood];
          return sum + moodValue;
        }, 0) / moodEntries.length
      : 0;

    const totalPomodoroMinutes = pomodoroSessions
      .filter(s => s.type === 'work')
      .reduce((sum, session) => sum + session.duration, 0);

    return {
      completionRate: Math.round(completionRate),
      avgMood: Math.round(avgMood * 10) / 10,
      totalFocusTime: totalPomodoroMinutes,
      totalTasks: completedTasks,
      trend: completionRate > 70 ? 'up' : completionRate > 40 ? 'stable' : 'down'
    };
  },
});
