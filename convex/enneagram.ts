import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveEnneagramResult = mutation({
  args: {
    type: v.number(),
    wing: v.optional(v.number()),
    answers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const enneagramData = getEnneagramData(args.type, args.wing);

    // Verificar se já existe resultado
    const existingResult = await ctx.db
      .query("enneagramResults")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingResult) {
      await ctx.db.patch(existingResult._id, {
        type: args.type,
        wing: args.wing,
        description: enneagramData.description,
        strengths: enneagramData.strengths,
        challenges: enneagramData.challenges,
        growthTips: enneagramData.growthTips,
        completedAt: Date.now(),
      });
      return existingResult._id;
    } else {
      return await ctx.db.insert("enneagramResults", {
        userId,
        type: args.type,
        wing: args.wing,
        description: enneagramData.description,
        strengths: enneagramData.strengths,
        challenges: enneagramData.challenges,
        growthTips: enneagramData.growthTips,
        completedAt: Date.now(),
      });
    }
  },
});

export const getEnneagramResult = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("enneagramResults")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

function getEnneagramData(type: number, wing?: number) {
  const enneagramTypes = {
    1: {
      name: "O Perfeccionista",
      description: "Você busca a perfeição e tem um forte senso de certo e errado. É organizado, responsável e tem altos padrões.",
      strengths: [
        "Organização natural",
        "Atenção aos detalhes",
        "Senso de responsabilidade",
        "Busca por melhoria contínua",
        "Integridade e ética"
      ],
      challenges: [
        "Procrastinação por perfeccionismo",
        "Autocrítica excessiva",
        "Dificuldade em delegar",
        "Rigidez mental",
        "Impaciência com erros"
      ],
      growthTips: [
        "Pratique a regra do 'bom o suficiente' para tarefas menos importantes",
        "Defina prazos realistas e cumpra-os, mesmo que não seja perfeito",
        "Use técnicas de mindfulness para reduzir a autocrítica",
        "Celebre pequenos progressos diariamente",
        "Implemente pausas regulares para evitar burnout"
      ]
    },
    2: {
      name: "O Prestativo",
      description: "Você é naturalmente empático e focado em ajudar outros. Tem facilidade para perceber necessidades alheias.",
      strengths: [
        "Empatia natural",
        "Habilidades interpessoais",
        "Motivação para ajudar",
        "Intuição sobre necessidades dos outros",
        "Capacidade de criar conexões"
      ],
      challenges: [
        "Negligenciar próprias necessidades",
        "Dificuldade em dizer não",
        "Procrastinação em tarefas pessoais",
        "Dependência da aprovação dos outros",
        "Burnout por excesso de compromissos"
      ],
      growthTips: [
        "Agende tempo para suas próprias necessidades diariamente",
        "Pratique dizer não de forma gentil mas firme",
        "Use lembretes para cuidar de si mesmo",
        "Estabeleça limites claros em relacionamentos",
        "Celebre suas conquistas pessoais, não apenas ajuda aos outros"
      ]
    },
    3: {
      name: "O Realizador",
      description: "Você é orientado por objetivos e tem uma forte motivação para alcançar sucesso e reconhecimento.",
      strengths: [
        "Orientação para resultados",
        "Energia e motivação",
        "Adaptabilidade",
        "Liderança natural",
        "Eficiência em tarefas"
      ],
      challenges: [
        "Burnout por excesso de atividades",
        "Dificuldade em relaxar",
        "Foco excessivo na imagem",
        "Impaciência com processos lentos",
        "Negligenciar relacionamentos por trabalho"
      ],
      growthTips: [
        "Agende tempo para descanso como se fosse uma meta importante",
        "Pratique atividades que não sejam orientadas por resultados",
        "Use técnicas de Pomodoro para manter energia sustentável",
        "Celebre o processo, não apenas os resultados finais",
        "Invista tempo em relacionamentos sem agenda específica"
      ]
    },
    4: {
      name: "O Individualista",
      description: "Você é criativo, sensível e busca autenticidade. Tem uma rica vida emocional e aprecia a beleza.",
      strengths: [
        "Criatividade e originalidade",
        "Profundidade emocional",
        "Autenticidade",
        "Sensibilidade estética",
        "Capacidade de inovação"
      ],
      challenges: [
        "Flutuações de humor afetando produtividade",
        "Procrastinação quando não se sente inspirado",
        "Comparação excessiva com outros",
        "Dificuldade com tarefas rotineiras",
        "Tendência à melancolia"
      ],
      growthTips: [
        "Crie rotinas que incluam elementos criativos",
        "Use seu humor como indicador para ajustar atividades",
        "Estabeleça pequenas metas diárias independente da inspiração",
        "Pratique gratidão para equilibrar tendências melancólicas",
        "Conecte tarefas mundanas com seus valores mais profundos"
      ]
    },
    5: {
      name: "O Investigador",
      description: "Você é observador, curioso e busca compreender o mundo através do conhecimento e análise.",
      strengths: [
        "Capacidade analítica",
        "Independência",
        "Curiosidade intelectual",
        "Objetividade",
        "Capacidade de concentração profunda"
      ],
      challenges: [
        "Isolamento social excessivo",
        "Procrastinação por excesso de pesquisa",
        "Dificuldade em tomar decisões",
        "Evitar ação por preferir planejamento",
        "Negligenciar necessidades físicas"
      ],
      growthTips: [
        "Estabeleça limites de tempo para pesquisa antes da ação",
        "Agende interações sociais regulares",
        "Use técnicas de timeboxing para evitar análise paralela",
        "Pratique tomar decisões com informação 'suficiente'",
        "Inclua cuidados físicos básicos em sua rotina diária"
      ]
    },
    6: {
      name: "O Leal",
      description: "Você valoriza segurança e lealdade. É responsável e busca orientação e apoio em sistemas confiáveis.",
      strengths: [
        "Lealdade e confiabilidade",
        "Capacidade de antever problemas",
        "Trabalho em equipe",
        "Responsabilidade",
        "Preparação e planejamento"
      ],
      challenges: [
        "Ansiedade e preocupação excessiva",
        "Procrastinação por medo de errar",
        "Dificuldade em confiar em si mesmo",
        "Paralisia por excesso de cenários negativos",
        "Dependência excessiva de aprovação externa"
      ],
      growthTips: [
        "Pratique técnicas de respiração para gerenciar ansiedade",
        "Crie listas de 'evidências' de suas competências",
        "Estabeleça pequenas metas para construir autoconfiança",
        "Use técnicas de mindfulness para focar no presente",
        "Desenvolva uma rede de apoio confiável"
      ]
    },
    7: {
      name: "O Entusiasta",
      description: "Você é otimista, versátil e busca experiências variadas. Tem energia alta e muitos interesses.",
      strengths: [
        "Otimismo e energia",
        "Criatividade e inovação",
        "Adaptabilidade",
        "Capacidade de motivar outros",
        "Visão de possibilidades"
      ],
      challenges: [
        "Dificuldade em focar em uma tarefa",
        "Procrastinação em tarefas tediosas",
        "Começar muitos projetos sem terminar",
        "Impaciência com detalhes",
        "Evitar emoções negativas"
      ],
      growthTips: [
        "Use técnicas de Pomodoro para manter foco",
        "Limite o número de projetos simultâneos",
        "Gamifique tarefas tediosas para torná-las interessantes",
        "Pratique mindfulness para aceitar emoções difíceis",
        "Estabeleça recompensas para completar tarefas menos prazerosas"
      ]
    },
    8: {
      name: "O Desafiador",
      description: "Você é assertivo, confiante e busca controle. Tem energia forte e gosta de liderar.",
      strengths: [
        "Liderança natural",
        "Determinação e persistência",
        "Capacidade de tomar decisões rápidas",
        "Proteção aos mais vulneráveis",
        "Energia e intensidade"
      ],
      challenges: [
        "Impaciência com processos lentos",
        "Dificuldade em delegar",
        "Tendência ao burnout por intensidade",
        "Conflitos por assertividade excessiva",
        "Negligenciar próprias vulnerabilidades"
      ],
      growthTips: [
        "Pratique paciência através de exercícios de respiração",
        "Desenvolva habilidades de delegação gradualmente",
        "Agende tempo para vulnerabilidade e reflexão",
        "Use sua energia em rajadas com pausas planejadas",
        "Pratique escuta ativa para melhorar relacionamentos"
      ]
    },
    9: {
      name: "O Pacificador",
      description: "Você busca harmonia e paz. É empático, estável e tem facilidade para ver múltiplas perspectivas.",
      strengths: [
        "Capacidade de mediação",
        "Empatia e compreensão",
        "Estabilidade emocional",
        "Visão holística",
        "Criação de ambientes harmoniosos"
      ],
      challenges: [
        "Procrastinação por evitar conflitos",
        "Dificuldade em priorizar",
        "Tendência à inércia",
        "Negligenciar próprias necessidades",
        "Dificuldade em tomar decisões"
      ],
      growthTips: [
        "Use técnicas de body doubling para manter momentum",
        "Estabeleça prioridades claras usando métodos visuais",
        "Crie rotinas que incluam pequenas ações diárias",
        "Pratique assertividade em situações de baixo risco",
        "Use timers para criar senso de urgência saudável"
      ]
    }
  };

  return enneagramTypes[type as keyof typeof enneagramTypes] || enneagramTypes[1];
}

export const getEnneagramQuestions = query({
  args: {},
  handler: async () => {
    return [
      {
        id: 1,
        question: "Eu me esforço para fazer as coisas da maneira correta e fico frustrado com erros.",
        type: 1
      },
      {
        id: 2,
        question: "Eu naturalmente percebo as necessidades dos outros e gosto de ajudar.",
        type: 2
      },
      {
        id: 3,
        question: "Eu sou orientado por objetivos e gosto de ser reconhecido pelos meus sucessos.",
        type: 3
      },
      {
        id: 4,
        question: "Eu valorizo a autenticidade e tenho uma rica vida emocional interior.",
        type: 4
      },
      {
        id: 5,
        question: "Eu prefiro observar e analisar antes de agir, e valorizo minha privacidade.",
        type: 5
      },
      {
        id: 6,
        question: "Eu busco segurança e orientação, e sou leal às pessoas e sistemas em que confio.",
        type: 6
      },
      {
        id: 7,
        question: "Eu sou otimista, tenho muitos interesses e gosto de manter minhas opções abertas.",
        type: 7
      },
      {
        id: 8,
        question: "Eu sou direto, assertivo e gosto de estar no controle das situações.",
        type: 8
      },
      {
        id: 9,
        question: "Eu valorizo a harmonia, evito conflitos e tenho facilidade para ver diferentes perspectivas.",
        type: 9
      },
      // Perguntas adicionais para maior precisão
      {
        id: 10,
        question: "Quando estressado, eu tendo a me tornar mais crítico e perfeccionista.",
        type: 1
      },
      {
        id: 11,
        question: "Eu às vezes negligencio minhas próprias necessidades para cuidar dos outros.",
        type: 2
      },
      {
        id: 12,
        question: "Eu me sinto energizado quando estou trabalhando em direção a um objetivo claro.",
        type: 3
      },
      {
        id: 13,
        question: "Eu me sinto diferente dos outros e às vezes incompreendido.",
        type: 4
      },
      {
        id: 14,
        question: "Eu preciso de tempo sozinho para processar informações e recarregar energias.",
        type: 5
      },
      {
        id: 15,
        question: "Eu tendo a antecipar problemas e me preparar para diferentes cenários.",
        type: 6
      },
      {
        id: 16,
        question: "Eu tenho dificuldade em me comprometer com uma única opção por muito tempo.",
        type: 7
      },
      {
        id: 17,
        question: "Eu me sinto confortável tomando decisões difíceis e confrontando problemas.",
        type: 8
      },
      {
        id: 18,
        question: "Eu prefiro evitar conflitos e manter a paz, mesmo que isso signifique não expressar minha opinião.",
        type: 9
      }
    ];
  },
});
