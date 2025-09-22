import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Stats() {
  const tasks = useQuery(api.tasks.getTasks, {});
  const pomodoroStats = useQuery(api.pomodoro.getPomodoroStats, { days: 7 });
  const moodEntries = useQuery(api.mood.getMoodEntries, { days: 7 });

  // Task Statistics
  const taskStats = tasks ? {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    todo: tasks.filter(t => t.status === "todo").length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100) : 0
  } : null;

  // Priority distribution
  const priorityStats = tasks ? {
    urgent: tasks.filter(t => t.priority === "urgent").length,
    high: tasks.filter(t => t.priority === "high").length,
    medium: tasks.filter(t => t.priority === "medium").length,
    low: tasks.filter(t => t.priority === "low").length,
  } : null;

  // Mood trends
  const moodStats = moodEntries ? {
    averageMood: calculateAverageMood(moodEntries),
    averageEnergy: calculateAverageEnergy(moodEntries),
    averageFocus: calculateAverageFocus(moodEntries),
    totalEntries: moodEntries.length
  } : null;

  function calculateAverageMood(entries: any[]) {
    if (entries.length === 0) return 0;
    const moodValues = { very_low: 1, low: 2, neutral: 3, good: 4, excellent: 5 };
    const sum = entries.reduce((acc, entry) => acc + moodValues[entry.mood as keyof typeof moodValues], 0);
    return Math.round((sum / entries.length) * 10) / 10;
  }

  function calculateAverageEnergy(entries: any[]) {
    if (entries.length === 0) return 0;
    const energyValues = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
    const sum = entries.reduce((acc, entry) => acc + energyValues[entry.energy as keyof typeof energyValues], 0);
    return Math.round((sum / entries.length) * 10) / 10;
  }

  function calculateAverageFocus(entries: any[]) {
    if (entries.length === 0) return 0;
    const focusValues = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
    const sum = entries.reduce((acc, entry) => acc + focusValues[entry.focus as keyof typeof focusValues], 0);
    return Math.round((sum / entries.length) * 10) / 10;
  }

  function getMoodEmoji(average: number) {
    if (average >= 4.5) return "😄";
    if (average >= 3.5) return "😊";
    if (average >= 2.5) return "😐";
    if (average >= 1.5) return "😕";
    return "😢";
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Estatísticas</h2>
        <div className="text-sm text-gray-500">Últimos 7 dias</div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tarefas Totais</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats?.total || 0}</p>
            </div>
            <div className="text-3xl">📝</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
              <p className="text-2xl font-bold text-green-600">{taskStats?.completionRate || 0}%</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sessões Pomodoro</p>
              <p className="text-2xl font-bold text-red-600">{pomodoroStats?.workSessions || 0}</p>
            </div>
            <div className="text-3xl">🍅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Focado</p>
              <p className="text-2xl font-bold text-blue-600">{pomodoroStats?.totalMinutes || 0}min</p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>
      </div>

      {/* Task Status Distribution */}
      {taskStats && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Tarefas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
              <div className="text-sm text-gray-600">Em Progresso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{taskStats.todo}</div>
              <div className="text-sm text-gray-600">A Fazer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{taskStats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Priority Distribution */}
      {priorityStats && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Prioridades das Tarefas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{priorityStats.urgent}</div>
              <div className="text-sm text-gray-600">Urgente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{priorityStats.high}</div>
              <div className="text-sm text-gray-600">Alta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{priorityStats.medium}</div>
              <div className="text-sm text-gray-600">Média</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{priorityStats.low}</div>
              <div className="text-sm text-gray-600">Baixa</div>
            </div>
          </div>
        </div>
      )}

      {/* Mood Statistics */}
      {moodStats && moodStats.totalEntries > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Acompanhamento de Humor</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">{getMoodEmoji(moodStats.averageMood)}</div>
              <div className="text-lg font-bold text-gray-800">{moodStats.averageMood}/5</div>
              <div className="text-sm text-gray-600">Humor Médio</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-lg font-bold text-green-600">{moodStats.averageEnergy}/5</div>
              <div className="text-sm text-gray-600">Energia Média</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-lg font-bold text-purple-600">{moodStats.averageFocus}/5</div>
              <div className="text-sm text-gray-600">Foco Médio</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-lg font-bold text-blue-600">{moodStats.totalEntries}</div>
              <div className="text-sm text-gray-600">Registros</div>
            </div>
          </div>
        </div>
      )}

      {/* Pomodoro Details */}
      {pomodoroStats && pomodoroStats.totalSessions > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Detalhes do Pomodoro</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{pomodoroStats.workSessions}</div>
              <div className="text-sm text-gray-600">Sessões de Trabalho</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{pomodoroStats.totalSessions}</div>
              <div className="text-sm text-gray-600">Total de Sessões</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((pomodoroStats.totalMinutes / 60) * 10) / 10}h
              </div>
              <div className="text-sm text-gray-600">Tempo Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Tips for ADHD */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">💡 Dicas para TDAH</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">📝 Organização</h4>
            <p className="text-gray-600">Divida tarefas grandes em pequenas etapas. Use prioridades visuais para focar no que é mais importante.</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-green-700 mb-2">🍅 Foco</h4>
            <p className="text-gray-600">Use a técnica Pomodoro para manter o foco. 25 minutos de trabalho seguidos de 5 minutos de pausa.</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-purple-700 mb-2">😊 Bem-estar</h4>
            <p className="text-gray-600">Monitore seu humor e energia. Identifique padrões para otimizar sua produtividade.</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-orange-700 mb-2">🎯 Consistência</h4>
            <p className="text-gray-600">Pequenos progressos diários são melhores que grandes esforços esporádicos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
