import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AdaptiveTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<"work" | "break">("work");
  const [adaptiveDuration, setAdaptiveDuration] = useState(25);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const todayMood = useQuery(api.mood.getTodayMoodEntry);
  const recentSessions = useQuery(api.pomodoro.getPomodoroStats, { days: 7 });
  const createSession = useMutation(api.pomodoro.createPomodoroSession);

  useEffect(() => {
    // Calcular duração adaptativa baseada no humor e histórico
    if (todayMood && recentSessions) {
      const moodMultiplier = {
        very_low: 0.6,   // 15 min
        low: 0.8,        // 20 min
        neutral: 1.0,    // 25 min
        good: 1.2,       // 30 min
        excellent: 1.4   // 35 min
      }[todayMood.mood];

      const energyMultiplier = {
        very_low: 0.7,
        low: 0.85,
        medium: 1.0,
        high: 1.15,
        very_high: 1.3
      }[todayMood.energy];

      const focusMultiplier = {
        very_low: 0.6,
        low: 0.8,
        medium: 1.0,
        high: 1.2,
        very_high: 1.4
      }[todayMood.focus];

      // Calcular duração baseada no humor atual
      const baseDuration = 25;
      const adaptedDuration = Math.round(
        baseDuration * moodMultiplier * energyMultiplier * focusMultiplier
      );

      // Limitar entre 15 e 45 minutos
      const finalDuration = Math.max(15, Math.min(45, adaptedDuration));
      
      setAdaptiveDuration(finalDuration);
      setTimeLeft(finalDuration * 60);
    }
  }, [todayMood, recentSessions]);

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

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }
  }, [timeLeft, isRunning]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    // Notificação sonora
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/Eeyw');
      audio.play().catch(() => console.log('Audio failed'));
    } catch (error) {
      console.log('Audio notification failed');
    }

    // Salvar sessão
    try {
      await createSession({
        duration: adaptiveDuration,
        type: sessionType === "work" ? "work" : "short_break",
      });

      if (sessionType === "work") {
        toast.success(`Sessão de ${adaptiveDuration} min concluída! 🎉`);
        // Sugerir pausa adaptativa
        const breakDuration = Math.max(5, Math.round(adaptiveDuration * 0.2));
        setSessionType("break");
        setTimeLeft(breakDuration * 60);
        
        if (confirm(`Ótimo trabalho! Que tal uma pausa de ${breakDuration} minutos?`)) {
          setIsRunning(true);
        }
      } else {
        toast.success("Pausa concluída! Hora de voltar ao foco! 💪");
        setSessionType("work");
        setTimeLeft(adaptiveDuration * 60);
      }
    } catch (error) {
      toast.error("Erro ao salvar sessão");
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    
    // Bloquear notificações de outras abas (se possível)
    if ('Notification' in window && Notification.permission === 'granted') {
      // Silenciar outras notificações durante o foco
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(adaptiveDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((adaptiveDuration * 60 - timeLeft) / (adaptiveDuration * 60)) * 100;

  const getSuggestion = () => {
    if (!todayMood) return null;
    
    const suggestions = {
      very_low: "💧 Que tal beber água e fazer 3 respirações profundas?",
      low: "🚶 Uma caminhada rápida pode ajudar a recarregar as energias",
      neutral: "🧘 Momento perfeito para uma pausa mindful",
      good: "🌟 Você está indo bem! Continue assim!",
      excellent: "🚀 Energia alta! Aproveite este momento de foco!"
    };

    return suggestions[todayMood.mood];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">⚡ Timer Adaptativo</h2>
        <div className="text-sm text-gray-500">
          Duração: {adaptiveDuration} min (adaptado ao seu humor)
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border mb-6 ${
          sessionType === "work" 
            ? "bg-red-50 text-red-600 border-red-200" 
            : "bg-green-50 text-green-600 border-green-200"
        }`}>
          <span>{sessionType === "work" ? "🎯" : "☕"}</span>
          {sessionType === "work" ? "Sessão de Foco" : "Pausa"}
        </div>

        {/* Circular Progress */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className={sessionType === "work" ? "text-red-500" : "text-green-500"}
              strokeLinecap="round"
            />
          </svg>
          
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
        <div className="flex justify-center gap-4 mb-4">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
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

        {/* Sugestão inteligente */}
        {getSuggestion() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">{getSuggestion()}</p>
          </div>
        )}
      </div>

      {/* Adaptação explicada */}
      {todayMood && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold mb-4 text-purple-800">🧠 Por que {adaptiveDuration} minutos?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <div className="font-medium text-purple-700 mb-1">Humor: {todayMood.mood}</div>
              <div className="text-gray-600">Influencia duração base da sessão</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="font-medium text-blue-700 mb-1">Energia: {todayMood.energy}</div>
              <div className="text-gray-600">Ajusta capacidade de concentração</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="font-medium text-green-700 mb-1">Foco: {todayMood.focus}</div>
              <div className="text-gray-600">Define intensidade da sessão</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
