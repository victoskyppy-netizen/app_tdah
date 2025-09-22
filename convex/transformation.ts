import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTransformationPlan = mutation({
  args: {
    enneagramType: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const planData = generatePersonalizedPlan(args.enneagramType);
    
    return await ctx.db.insert("transformationPlan", {
      userId,
      title: "Plano de Transformação de 30 Dias",
      description: "Um plano personalizado para desenvolver hábitos saudáveis e melhorar sua qualidade de vida com TDAH",
      startDate: Date.now(),
      endDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
      status: "active",
      weeks: planData.weeks,
      currentWeek: 1,
    });
  },
});

export const getActivePlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("transformationPlan")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .first();
  },
});

export const updateWeekProgress = mutation({
  args: {
    planId: v.id("transformationPlan"),
    weekNumber: v.number(),
    reflections: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== userId) {
      throw new Error("Plano não encontrado");
    }

    const updatedWeeks = plan.weeks.map(week => 
      week.weekNumber === args.weekNumber 
        ? { ...week, reflections: args.reflections }
        : week
    );

    await ctx.db.patch(args.planId, {
      weeks: updatedWeeks,
      currentWeek: Math.min(args.weekNumber + 1, 4)
    });
  },
});

export const trackHabit = mutation({
  args: {
    planId: v.id("transformationPlan"),
    habitId: v.string(),
    completed: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Verificar se já existe registro para hoje
    const existingTracking = await ctx.db
      .query("habitTracking")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", todayTimestamp))
      .filter((q) => q.eq(q.field("habitId"), args.habitId))
      .first();

    if (existingTracking) {
      await ctx.db.patch(existingTracking._id, {
        completed: args.completed,
        notes: args.notes,
      });
      return existingTracking._id;
    } else {
      return await ctx.db.insert("habitTracking", {
        userId,
        planId: args.planId,
        habitId: args.habitId,
        date: todayTimestamp,
        completed: args.completed,
        notes: args.notes,
      });
    }
  },
});

export const getHabitStats = query({
  args: {
    planId: v.id("transformationPlan"),
    habitId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const trackings = await ctx.db
      .query("habitTracking")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .filter((q) => q.eq(q.field("habitId"), args.habitId))
      .filter((q) => q.gte(q.field("date"), last30Days))
      .collect();

    const completedDays = trackings.filter(t => t.completed).length;
    const totalDays = trackings.length;
    const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

    // Calcular streak atual
    const sortedTrackings = trackings
      .sort((a, b) => b.date - a.date)
      .filter(t => t.completed);

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = today.getTime();

    for (const tracking of sortedTrackings) {
      if (tracking.date === checkDate) {
        currentStreak++;
        checkDate -= 24 * 60 * 60 * 1000;
      } else {
        break;
      }
    }

    return {
      completedDays,
      totalDays,
      completionRate: Math.round(completionRate),
      currentStreak,
      recentTrackings: trackings.slice(-7)
    };
  },
});

function generatePersonalizedPlan(enneagramType?: number) {
  const baseWeeks = [
    {
      weekNumber: 1,
      theme: "Fundação e Autoconhecimento",
      goals: [
        "Estabelecer rotina matinal básica",
        "Começar acompanhamento de humor diário",
        "Identificar principais desafios do TDAH"
      ],
      habits: [
        {
          id: "morning-routine",
          name: "Rotina Matinal",
          description: "Acordar no mesmo horário e fazer 3 ações básicas: beber água, fazer cama, planejar o dia",
          frequency: "Diário",
          completed: false
        },
        {
          id: "mood-tracking",
          name: "Registro de Humor",
          description: "Anotar humor, energia e foco uma vez por dia",
          frequency: "Diário",
          completed: false
        },
        {
          id: "mindfulness",
          name: "Mindfulness",
          description: "5 minutos de respiração consciente ou meditação",
          frequency: "Diário",
          completed: false
        }
      ]
    },
    {
      weekNumber: 2,
      theme: "Organização e Estrutura",
      goals: [
        "Implementar sistema de organização de tarefas",
        "Criar ambiente físico organizado",
        "Estabelecer limites saudáveis"
      ],
      habits: [
        {
          id: "task-planning",
          name: "Planejamento de Tarefas",
          description: "Planejar 3 tarefas principais do dia na noite anterior",
          frequency: "Diário",
          completed: false
        },
        {
          id: "declutter",
          name: "Organização do Espaço",
          description: "Organizar uma área pequena da casa por 15 minutos",
          frequency: "Diário",
          completed: false
        },
        {
          id: "digital-boundaries",
          name: "Limites Digitais",
          description: "Estabelecer horário para verificar redes sociais (máximo 2x por dia)",
          frequency: "Diário",
          completed: false
        }
      ]
    },
    {
      weekNumber: 3,
      theme: "Energia e Bem-estar Físico",
      goals: [
        "Incorporar movimento regular",
        "Melhorar qualidade do sono",
        "Estabelecer hábitos alimentares regulares"
      ],
      habits: [
        {
          id: "exercise",
          name: "Movimento Diário",
          description: "20 minutos de caminhada, dança ou exercício leve",
          frequency: "Diário",
          completed: false
        },
        {
          id: "sleep-routine",
          name: "Rotina do Sono",
          description: "Ir para cama no mesmo horário, sem telas 1h antes",
          frequency: "Diário",
          completed: false
        },
        {
          id: "hydration",
          name: "Hidratação",
          description: "Beber pelo menos 6 copos de água ao longo do dia",
          frequency: "Diário",
          completed: false
        }
      ]
    },
    {
      weekNumber: 4,
      theme: "Conexão e Crescimento",
      goals: [
        "Fortalecer relacionamentos importantes",
        "Desenvolver habilidades de comunicação",
        "Planejar próximos passos de crescimento"
      ],
      habits: [
        {
          id: "social-connection",
          name: "Conexão Social",
          description: "Ter uma conversa significativa com alguém importante",
          frequency: "Diário",
          completed: false
        },
        {
          id: "gratitude",
          name: "Gratidão",
          description: "Escrever 3 coisas pelas quais você é grato",
          frequency: "Diário",
          completed: false
        },
        {
          id: "learning",
          name: "Aprendizado",
          description: "Dedicar 15 minutos para aprender algo novo relacionado ao TDAH ou desenvolvimento pessoal",
          frequency: "Diário",
          completed: false
        }
      ]
    }
  ];

  // Personalizar baseado no tipo do Eneagrama
  if (enneagramType) {
    return personalizeForEnneagram(baseWeeks, enneagramType);
  }

  return { weeks: baseWeeks };
}

function personalizeForEnneagram(weeks: any[], type: number) {
  const personalizations = {
    1: {
      additionalHabits: [
        {
          id: "progress-celebration",
          name: "Celebrar Progresso",
          description: "Reconhecer e celebrar pequenos progressos, mesmo que não sejam perfeitos",
          frequency: "Diário",
          completed: false
        }
      ],
      modifiedGoals: ["Praticar autocompaixão e aceitar 'bom o suficiente'"]
    },
    2: {
      additionalHabits: [
        {
          id: "self-care",
          name: "Autocuidado",
          description: "Fazer algo apenas para você, sem ajudar ninguém",
          frequency: "Diário",
          completed: false
        }
      ],
      modifiedGoals: ["Estabelecer limites saudáveis e priorizar suas próprias necessidades"]
    },
    3: {
      additionalHabits: [
        {
          id: "rest-time",
          name: "Tempo de Descanso",
          description: "15 minutos de descanso sem produtividade ou objetivos",
          frequency: "Diário",
          completed: false
        }
      ],
      modifiedGoals: ["Equilibrar conquistas com bem-estar pessoal"]
    },
    4: {
      additionalHabits: [
        {
          id: "creative-expression",
          name: "Expressão Criativa",
          description: "Dedicar tempo para uma atividade criativa que você goste",
          frequency: "Diário",
          completed: false
        }
      ],
      modifiedGoals: ["Conectar tarefas rotineiras com seus valores pessoais"]
    },
    5: {
      additionalHabits: [
        {
          id: "social-interaction",
          name: "Interação Social",
          description: "Ter pelo menos uma interação social significativa",
          frequency: "Diário",
          completed: false
        }
      ],
      modifiedGoals: ["Equilibrar tempo sozinho com conexões sociais necessárias"]
    },
    6: {
      additionalHabits: [
        {
          id: "confidence-building",
          name: "Construção de Confiança",
          description: "Tomar uma pequena decisão independente sem buscar aprovação",
          frequency: "Diário",
          completed: false
        }
      ],
      modifiedGoals: ["Desenvolver autoconfiança e reduzir ansiedade"]
    },
    7: {
      additionalHabits: [
        {
          id: "single-focus",
          name: "Foco Único",
          description: "Dedicar 25 minutos ininterruptos a uma única tarefa",
          frequency: "Diário",
          completed: false
        }
      ],
      modifiedGoals: ["Desenvolver capacidade de foco e completar projetos iniciados"]
    },
    8: {
      additionalHabits: [
        {
          id: "vulnerability-practice",
          name: "Prática de Vulnerabilidade",
          description: "Compartilhar um sentimento ou dificuldade com alguém de confiança",
          frequency: "Semanal",
          completed: false
        }
      ],
      modifiedGoals: ["Equilibrar força com vulnerabilidade e autocuidado"]
    },
    9: {
      additionalHabits: [
        {
          id: "priority-action",
          name: "Ação Prioritária",
          description: "Completar a tarefa mais importante do dia, mesmo que pequena",
          frequency: "Diário",
          completed: false
        }
      ],
      modifiedGoals: ["Desenvolver momentum e assertividade pessoal"]
    }
  };

  const personalization = personalizations[type as keyof typeof personalizations];
  
  if (personalization) {
    // Adicionar hábitos personalizados à segunda semana
    weeks[1].habits.push(...personalization.additionalHabits);
    
    // Adicionar objetivos personalizados à terceira semana
    weeks[2].goals.push(...personalization.modifiedGoals);
  }

  return { weeks };
}
