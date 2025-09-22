import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

type TimerType = "work" | "short_break" | "long_break";

export function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [timerType, setTimerType] = useState<TimerType>("work");
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tasks = useQuery(api.tasks.getTasks, { status: "todo" }) || [];
  const inProgressTasks = useQuery(api.tasks.getTasks, { status: "in_progress" }) || [];
  const createPomodoroSession = useMutation(api.pomodoro.createPomodoroSession);
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);

  const allAvailableTasks = [...tasks, ...inProgressTasks];

  // Timer durations in minutes
  const durations = {
    work: 25,
    short_break: 5,
    long_break: 15,
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
  }, [timeLeft, isRunning]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    // Play notification sound (browser notification sound)
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/Eeyw');
      }
      audioRef.current.play().catch(() => {
        // Fallback if audio fails
        console.log('Timer completed!');
      });
    } catch (error) {
      console.log('Audio notification failed');
    }

    // Save session to database
    try {
      await createPomodoroSession({
        taskId: selectedTaskId || undefined,
        duration: durations[timerType],
        type: timerType,
      });

      if (timerType === "work") {
        setCompletedPomodoros(prev => prev + 1);
        toast.success("Pomodoro concluído! 🍅");
        
        // Auto-start break
        const nextType = completedPomodoros > 0 && (completedPomodoros + 1) % 4 === 0 
          ? "long_break" 
          : "short_break";
        
        setTimerType(nextType);
        setTimeLeft(durations[nextType] * 60);
        
        // Ask if user wants to start break automatically
        if (confirm(`Pomodoro concluído! Deseja iniciar ${nextType === "long_break" ? "pausa longa" : "pausa curta"}?`)) {
          setIsRunning(true);
        }
      } else {
        toast.success("Pausa concluída! Hora de voltar ao trabalho! 💪");
        setTimerType("work");
        setTimeLeft(durations.work * 60);
      }
    } catch (error) {
      toast.error("Erro ao salvar sessão");
    }
  };

  const startTimer = () => {
    if (timerType === "work" && selectedTaskId) {
      // Update task status to in_progress when starting work session
      updateTaskStatus({ taskId: selectedTaskId, status: "in_progress" });
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[timerType] * 60);
  };

  const switchTimerType = (type: TimerType) => {
    setIsRunning(false);
    setTimerType(type);
    setTimeLeft(durations[type] * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerTypeLabel = (type: TimerType) => {
    switch (type) {
      case "work": return "Trabalho";
      case "short_break": return "Pausa Curta";
      case "long_break": return "Pausa Longa";
    }
  };

  const getTimerColor = (type: TimerType) => {
    switch (type) {
      case "work": return "text-red-600 bg-red-50 border-red-200";
      case "short_break": return "text-green-600 bg-green-50 border-green-200";
      case "long_break": return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const progress = ((durations[timerType] * 60 - timeLeft) / (durations[timerType] * 60)) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Timer Pomodoro</h2>
        <div className="text-sm text-gray-500">
          Pomodoros hoje: {completedPomodoros}
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border mb-6 ${getTimerColor(timerType)}`}>
          <span>
            {timerType === "work" ? "🍅" : timerType === "short_break" ? "☕" : "🛋️"}
          </span>
          {getTimerTypeLabel(timerType)}
        </div>

        {/* Circular Progress */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className={timerType === "work" ? "text-red-500" : timerType === "short_break" ? "text-green-500" : "text-blue-500"}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Timer display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-gray-800">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {Math.floor(timeLeft / 60)} min restantes
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={timerType === "work" && !selectedTaskId}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ▶️ Iniciar
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              ⏸️ Pausar
            </button>
          )}
          
          <button
            onClick={resetTimer}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            🔄 Resetar
          </button>
        </div>

        {timerType === "work" && !selectedTaskId && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Selecione uma tarefa para começar o timer de trabalho
            </p>
          </div>
        )}
      </div>

      {/* Timer Type Selector */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Tipo de Sessão</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["work", "short_break", "long_break"] as TimerType[]).map((type) => (
            <button
              key={type}
              onClick={() => switchTimerType(type)}
              disabled={isRunning}
              className={`p-3 rounded-lg border text-center transition-colors disabled:opacity-50 ${
                timerType === type
                  ? getTimerColor(type)
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className="text-2xl mb-1">
                {type === "work" ? "🍅" : type === "short_break" ? "☕" : "🛋️"}
              </div>
              <div className="text-sm font-medium">{getTimerTypeLabel(type)}</div>
              <div className="text-xs text-gray-500">{durations[type]} min</div>
            </button>
          ))}
        </div>
      </div>

      {/* Task Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Selecionar Tarefa (Opcional)</h3>
        
        {allAvailableTasks.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
              <input
                type="radio"
                id="no-task"
                name="task-selection"
                checked={selectedTaskId === null}
                onChange={() => setSelectedTaskId(null)}
                className="text-blue-500"
              />
              <label htmlFor="no-task" className="text-sm text-gray-600">
                Sessão livre (sem tarefa específica)
              </label>
            </div>
            
            {allAvailableTasks.map((task) => (
              <div key={task._id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50">
                <input
                  type="radio"
                  id={task._id}
                  name="task-selection"
                  checked={selectedTaskId === task._id}
                  onChange={() => setSelectedTaskId(task._id)}
                  className="text-blue-500"
                />
                <label htmlFor={task._id} className="flex-1 text-sm">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-gray-500 text-xs">
                    {task.category && `📁 ${task.category} • `}
                    {task.estimatedMinutes && `⏱️ ${task.estimatedMinutes} min • `}
                    Status: {task.status === "todo" ? "A Fazer" : "Em Progresso"}
                  </div>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <div className="text-3xl mb-2">📝</div>
            <p>Nenhuma tarefa disponível</p>
            <p className="text-sm">Crie algumas tarefas para associar aos seus pomodoros!</p>
          </div>
        )}
      </div>

      {/* Pomodoro Technique Info */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold mb-4 text-red-800">🍅 Técnica Pomodoro</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-red-700 mb-2">Como funciona:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• 25 min de trabalho focado</li>
              <li>• 5 min de pausa curta</li>
              <li>• A cada 4 pomodoros: pausa longa (15 min)</li>
              <li>• Elimine distrações durante o trabalho</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-orange-700 mb-2">Benefícios para TDAH:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Melhora o foco e concentração</li>
              <li>• Reduz a procrastinação</li>
              <li>• Cria senso de urgência saudável</li>
              <li>• Pausas regulares previnem fadiga</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
