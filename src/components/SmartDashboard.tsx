import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { QuickCapture } from "./QuickCapture";
import { toast } from "sonner";

export function SmartDashboard() {
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const tasks = useQuery(api.tasks.getTasks, {});
  const todayMood = useQuery(api.mood.getTodayMoodEntry);
  const routines = useQuery(api.routines.getRoutines, {});
  const smartSuggestions = useQuery(api.ai.getSmartSuggestions);
  const enneagramResult = useQuery(api.enneagram.getEnneagramResult);

  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Atalho de teclado para captura rápida
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickCapture(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const getCurrentPeriod = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  };

  const getPeriodGreeting = () => {
    const period = getCurrentPeriod();
    const greetings = {
      morning: "🌅 Bom dia!",
      afternoon: "☀️ Boa tarde!",
      evening: "🌆 Boa noite!",
      night: "🌙 Boa madrugada!"
    };
    return greetings[period];
  };

  const getPriorityTasks = () => {
    if (!tasks) return [];
    return tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 3);
  };

  const getCurrentRoutine = () => {
    if (!routines) return null;
    const period = getCurrentPeriod();
    return routines.find(r => r.timeOfDay === period && r.isActive);
  };

  const getMoodColor = () => {
    if (!todayMood) return 'bg-gray-100';
    const colors = {
      very_low: 'bg-red-100',
      low: 'bg-orange-100',
      neutral: 'bg-yellow-100',
      good: 'bg-green-100',
      excellent: 'bg-blue-100'
    };
    return colors[todayMood.mood];
  };

  const handleQuickTaskComplete = async (taskId: string) => {
    try {
      await updateTaskStatus({ taskId: taskId as any, status: 'completed' });
      toast.success("Tarefa concluída! 🎉");
    } catch (error) {
      toast.error("Erro ao completar tarefa");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com saudação e captura rápida */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{getPeriodGreeting()}</h1>
            <p className="text-gray-600">
              {currentTime.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
          
          <button
            onClick={() => setShowQuickCapture(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg"
          >
            <span className="text-xl">⚡</span>
            Captura Rápida
            <span className="text-xs opacity-75">(Ctrl+K)</span>
          </button>
        </div>

        {/* Humor do dia */}
        {todayMood && (
          <div className={`mt-4 p-3 rounded-lg ${getMoodColor()}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {todayMood.mood === 'excellent' ? '😄' :
                 todayMood.mood === 'good' ? '😊' :
                 todayMood.mood === 'neutral' ? '😐' :
                 todayMood.mood === 'low' ? '😕' : '😢'}
              </span>
              <span className="font-medium">
                Humor: {todayMood.mood === 'excellent' ? 'Excelente' :
                        todayMood.mood === 'good' ? 'Bom' :
                        todayMood.mood === 'neutral' ? 'Neutro' :
                        todayMood.mood === 'low' ? 'Baixo' : 'Muito Baixo'}
              </span>
              <span className="text-sm text-gray-600">
                • Energia: {todayMood.energy} • Foco: {todayMood.focus}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tarefas prioritárias */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🎯 Tarefas Prioritárias</h2>
            <span className="text-sm text-gray-500">Top 3 do dia</span>
          </div>
          
          <div className="space-y-3">
            {getPriorityTasks().map((task) => (
              <div key={task._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <button
                  onClick={() => handleQuickTaskComplete(task._id)}
                  className="w-6 h-6 border-2 border-gray-300 rounded-full hover:border-green-500 hover:bg-green-50 transition-colors"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{task.title}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority === 'urgent' ? '🔴 Urgente' :
                       task.priority === 'high' ? '🟠 Alta' :
                       task.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                    </span>
                  </div>
                  {task.estimatedMinutes && (
                    <span className="text-sm text-gray-500">⏱️ {task.estimatedMinutes} min</span>
                  )}
                </div>
              </div>
            ))}
            
            {getPriorityTasks().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎉</div>
                <p>Todas as tarefas prioritárias concluídas!</p>
                <p className="text-sm">Que tal adicionar uma nova?</p>
              </div>
            )}
          </div>
        </div>

        {/* Rotina atual */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🌟 Rotina Atual</h2>
          
          {getCurrentRoutine() ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCurrentRoutine()?.icon}</span>
                <span className="font-medium">{getCurrentRoutine()?.name}</span>
              </div>
              
              <div className="space-y-2">
                {getCurrentRoutine()?.tasks.slice(0, 3).map((task, index) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">{index + 1}.</span>
                    <span>{task.title}</span>
                  </div>
                ))}
              </div>
              
              <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                Executar Rotina
              </button>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <div className="text-3xl mb-2">💤</div>
              <p className="text-sm">Nenhuma rotina para este período</p>
            </div>
          )}
        </div>
      </div>

      {/* Sugestões inteligentes */}
      {smartSuggestions && smartSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
          <h2 className="text-lg font-semibold text-purple-800 mb-4">🤖 Sugestões Inteligentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {smartSuggestions.slice(0, 4).map((suggestion, index) => (
              <div key={index} className="bg-white p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{suggestion.icon}</span>
                  <span className="font-medium text-gray-800">{suggestion.title}</span>
                </div>
                <p className="text-sm text-gray-600">{suggestion.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dicas do Eneagrama */}
      {enneagramResult && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
          <h2 className="text-lg font-semibold text-indigo-800 mb-4">
            🎯 Dica do Dia - Tipo {enneagramResult.type}
          </h2>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-gray-700">
              {enneagramResult.growthTips[Math.floor(Math.random() * enneagramResult.growthTips.length)]}
            </p>
          </div>
        </div>
      )}

      {/* Modal de captura rápida */}
      {showQuickCapture && (
        <QuickCapture onClose={() => setShowQuickCapture(false)} />
      )}
    </div>
  );
}
