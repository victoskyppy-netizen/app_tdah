import { v } from "convex/values";
import { mutation, query, action, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const sendMessage = mutation({
  args: {
    message: v.string(),
    type: v.union(v.literal("general"), v.literal("routine"), v.literal("task"), v.literal("mood"), v.literal("enneagram")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    // Salvar mensagem temporariamente
    const messageId = await ctx.db.insert("chatMessages", {
      userId,
      message: args.message,
      response: "Processando...",
      type: args.type,
      timestamp: Date.now(),
    });

    // Agendar processamento da resposta
    await ctx.scheduler.runAfter(0, internal.chat.processMessage, {
      messageId,
      userId,
      message: args.message,
      type: args.type,
    });

    return messageId;
  },
});

export const processMessage = internalAction({
  args: {
    messageId: v.id("chatMessages"),
    userId: v.id("users"),
    message: v.string(),
    type: v.union(v.literal("general"), v.literal("routine"), v.literal("task"), v.literal("mood"), v.literal("enneagram")),
  },
  handler: async (ctx, args) => {
    // Buscar contexto do usuário
    const userContext = await ctx.runQuery(internal.chat.getUserContext, {
      userId: args.userId,
    });

    // Gerar resposta com IA
    const response = await generateAIResponse(args.message, args.type, userContext);

    // Atualizar mensagem com a resposta
    await ctx.runMutation(internal.chat.updateMessageResponse, {
      messageId: args.messageId,
      response,
    });
  },
});

export const getUserContext = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Buscar dados do usuário para contexto
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const routines = await ctx.db
      .query("routines")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const recentMoods = await ctx.db
      .query("moodEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(7);

    const enneagramResult = await ctx.db
      .query("enneagramResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const activePlan = await ctx.db
      .query("transformationPlan")
      .withIndex("by_user_status", (q) => q.eq("userId", args.userId).eq("status", "active"))
      .first();

    return {
      tasksCount: tasks.length,
      completedTasks: tasks.filter(t => t.status === "completed").length,
      routinesCount: routines.length,
      recentMoodAverage: recentMoods.length > 0 
        ? recentMoods.reduce((sum, mood) => {
            const moodValue = { very_low: 1, low: 2, neutral: 3, good: 4, excellent: 5 }[mood.mood];
            return sum + moodValue;
          }, 0) / recentMoods.length
        : 3,
      enneagramType: enneagramResult?.type,
      hasActivePlan: !!activePlan,
      currentWeek: activePlan?.currentWeek || 0,
    };
  },
});

export const updateMessageResponse = internalMutation({
  args: {
    messageId: v.id("chatMessages"),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      response: args.response,
    });
  },
});

export const getChatHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 20);
  },
});

async function generateAIResponse(message: string, type: string, userContext: any): Promise<string> {
  const systemPrompt = `Você é um assistente especializado em TDAH e produtividade pessoal. 
  
  Contexto do usuário:
  - Tarefas totais: ${userContext.tasksCount}
  - Tarefas concluídas: ${userContext.completedTasks}
  - Rotinas criadas: ${userContext.routinesCount}
  - Humor médio recente: ${userContext.recentMoodAverage}/5
  - Tipo do Eneagrama: ${userContext.enneagramType || "Não definido"}
  - Plano ativo: ${userContext.hasActivePlan ? `Sim (Semana ${userContext.currentWeek})` : "Não"}

  Diretrizes:
  - Seja empático e compreensivo com os desafios do TDAH
  - Ofereça dicas práticas e específicas
  - Use linguagem positiva e motivadora
  - Mantenha respostas concisas mas úteis
  - Adapte suas sugestões ao tipo do Eneagrama quando disponível
  - Foque em soluções pequenas e implementáveis`;

  try {
    // Usar a IA integrada do Convex
    const response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content || "Desculpe, não consegui processar sua mensagem no momento.";
  } catch (error) {
    console.error('Erro ao gerar resposta da IA:', error);
    return getDefaultResponse(type, message);
  }
}

function getDefaultResponse(type: string, message: string): string {
  const responses = {
    general: "Entendo sua situação. Para pessoas com TDAH, é importante quebrar tarefas grandes em pequenas etapas. Que tal começarmos organizando uma tarefa específica?",
    routine: "Rotinas são fundamentais para o TDAH! Sugiro começar com uma rotina matinal simples: acordar, tomar água, fazer 5 minutos de exercício e planejar o dia.",
    task: "Para gerenciar tarefas com TDAH, use a regra dos 2 minutos: se leva menos de 2 minutos, faça agora. Para tarefas maiores, divida em subtarefas de 15-25 minutos.",
    mood: "Acompanhar o humor é muito importante. Percebo que você está prestando atenção aos seus padrões emocionais - isso já é um grande passo!",
    enneagram: "O Eneagrama pode ajudar muito a entender seus padrões de comportamento e motivações. Cada tipo tem estratégias específicas que funcionam melhor."
  };

  return responses[type as keyof typeof responses] || responses.general;
}
