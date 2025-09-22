import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function TransformationPlan() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const activePlan = useQuery(api.transformation.getActivePlan);
  const enneagramResult = useQuery(api.enneagram.getEnneagramResult);
  const createPlan = useMutation(api.transformation.createTransformationPlan);
  const updateWeekProgress = useMutation(api.transformation.updateWeekProgress);
  const trackHabit = useMutation(api.transformation.trackHabit);

  const handleCreatePlan = async () => {
    try {
      await createPlan({
        enneagramType: enneagramResult?.type,
      });
      toast.success("Plano de transformação criado!");
      setShowCreateForm(false);
    } catch (error) {
      toast.error("Erro ao criar plano");
    }
  };

  const handleTrackHabit = async (planId: Id<"transformationPlan">, habitId: string, completed: boolean) => {
    try {
      await trackHabit({
        planId,
        habitId,
        completed,
      });
      toast.success(completed ? "Hábito marcado como concluído!" : "Hábito desmarcado");
    } catch (error) {
      toast.error("Erro ao atualizar hábito");
    }
  };

  const handleWeekReflection = async (planId: Id<"transformationPlan">, weekNumber: number, reflections: string) => {
    try {
      await updateWeekProgress({
        planId,
        weekNumber,
        reflections,
      });
      toast.success("Reflexões salvas!");
    } catch (error) {
      toast.error("Erro ao salvar reflexões");
    }
  };

  if (!activePlan && !showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Plano de Transformação de 30 Dias</h2>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-lg border border-green-200 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Transforme sua vida em 30 dias!
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Crie um plano personalizado baseado no seu tipo do Eneagrama e nas melhores práticas para pessoas com TDAH. 
            Desenvolva hábitos saudáveis de forma gradual e sustentável.
          </p>
          
          {enneagramResult ? (
            <div className="mb-6 p-4 bg-white rounded-lg inline-block">
              <p className="text-sm text-gray-600 mb-2">Seu plano será personalizado para:</p>
              <div className="flex items-center gap-2 justify-center">
                <span className="text-2xl">
                  {getTypeIcon(enneagramResult.type)}
                </span>
                <span className="font-semibold text-gray-800">
                  Tipo {enneagramResult.type} - {getTypeName(enneagramResult.type)}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 Recomendamos fazer o teste do Eneagrama primeiro para um plano mais personalizado!
              </p>
            </div>
          )}

          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all text-lg font-semibold"
          >
            Criar Meu Plano de Transformação
          </button>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="text-3xl mb-3">📅</div>
            <h4 className="font-semibold mb-2">4 Semanas Estruturadas</h4>
            <p className="text-sm text-gray-600">Cada semana com tema específico e objetivos claros</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="text-3xl mb-3">🎯</div>
            <h4 className="font-semibold mb-2">Hábitos Personalizados</h4>
            <p className="text-sm text-gray-600">Baseados no seu tipo do Eneagrama e necessidades do TDAH</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="text-3xl mb-3">📊</div>
            <h4 className="font-semibold mb-2">Acompanhamento Diário</h4>
            <p className="text-sm text-gray-600">Marque hábitos concluídos e veja seu progresso</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="text-3xl mb-3">💭</div>
            <h4 className="font-semibold mb-2">Reflexões Semanais</h4>
            <p className="text-sm text-gray-600">Espaço para refletir sobre aprendizados e ajustes</p>
          </div>
        </div>

        {/* Create Plan Confirmation */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Confirmar Criação do Plano</h3>
            <p className="text-gray-600 mb-6">
              Seu plano de transformação será criado com base nas melhores práticas para TDAH
              {enneagramResult && ` e personalizado para o Tipo ${enneagramResult.type} do Eneagrama`}.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={handleCreatePlan}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Confirmar e Criar Plano
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activePlan) {
    return <ActivePlanView plan={activePlan} onTrackHabit={handleTrackHabit} onWeekReflection={handleWeekReflection} />;
  }

  return null;
}

function ActivePlanView({ plan, onTrackHabit, onWeekReflection }: any) {
  const [reflectionText, setReflectionText] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(plan.currentWeek);

  const currentWeek = plan.weeks.find((w: any) => w.weekNumber === plan.currentWeek);
  const daysRemaining = Math.ceil((plan.endDate - Date.now()) / (1000 * 60 * 60 * 24));
  const progress = ((plan.currentWeek - 1) / 4) * 100;

  const handleSaveReflection = () => {
    if (reflectionText.trim()) {
      onWeekReflection(plan._id, selectedWeek, reflectionText);
      setReflectionText("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{plan.title}</h2>
          <p className="text-gray-600">Semana {plan.currentWeek} de 4 • {daysRemaining} dias restantes</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{Math.round(progress)}%</div>
          <div className="text-sm text-gray-500">Concluído</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current Week */}
      {currentWeek && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              {plan.currentWeek}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{currentWeek.theme}</h3>
              <p className="text-blue-700">Semana Atual</p>
            </div>
          </div>

          {/* Week Goals */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">🎯 Objetivos desta semana:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentWeek.goals.map((goal: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded">
                  <span className="text-blue-500">•</span>
                  <span className="text-sm text-gray-700">{goal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Habits */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">✅ Hábitos Diários:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentWeek.habits.map((habit: any) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  planId={plan._id}
                  onTrack={onTrackHabit}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Week Selector */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">📅 Visão Geral das Semanas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plan.weeks.map((week: any) => (
            <div
              key={week.weekNumber}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                week.weekNumber === plan.currentWeek
                  ? "bg-blue-50 border-blue-300"
                  : week.weekNumber < plan.currentWeek
                  ? "bg-green-50 border-green-300"
                  : "bg-gray-50 border-gray-200"
              }`}
              onClick={() => setSelectedWeek(week.weekNumber)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  week.weekNumber === plan.currentWeek
                    ? "bg-blue-500 text-white"
                    : week.weekNumber < plan.currentWeek
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}>
                  {week.weekNumber}
                </div>
                <span className="font-medium text-sm">{week.theme}</span>
              </div>
              <p className="text-xs text-gray-600">{week.habits.length} hábitos</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Reflection */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">💭 Reflexão Semanal</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Como foi sua semana {selectedWeek}? O que aprendeu?
            </label>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Reflita sobre seus progressos, desafios e aprendizados desta semana..."
            />
          </div>
          <button
            onClick={handleSaveReflection}
            disabled={!reflectionText.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar Reflexão
          </button>
        </div>

        {/* Previous Reflections */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-800 mb-3">Reflexões Anteriores:</h4>
          <div className="space-y-3">
            {plan.weeks
              .filter((week: any) => week.reflections)
              .map((week: any) => (
                <div key={week.weekNumber} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-sm text-gray-700 mb-1">
                    Semana {week.weekNumber}: {week.theme}
                  </div>
                  <p className="text-sm text-gray-600">{week.reflections}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitCard({ habit, planId, onTrack }: any) {
  const [isCompleted, setIsCompleted] = useState(false);
  
  const habitStats = useQuery(api.transformation.getHabitStats, {
    planId,
    habitId: habit.id,
  });

  const handleToggle = () => {
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    onTrack(planId, habit.id, newCompleted);
  };

  return (
    <div className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={handleToggle}
          className="mt-1 rounded"
        />
        <div className="flex-1">
          <h5 className="font-medium text-gray-800 mb-1">{habit.name}</h5>
          <p className="text-sm text-gray-600 mb-2">{habit.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>📅 {habit.frequency}</span>
            {habitStats && (
              <>
                <span>🔥 {habitStats.currentStreak} dias</span>
                <span>📊 {habitStats.completionRate}%</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTypeIcon(type: number) {
  const icons = {
    1: "⚖️", 2: "❤️", 3: "🏆", 4: "🎨", 5: "🔍",
    6: "🛡️", 7: "🌟", 8: "💪", 9: "☮️"
  };
  return icons[type as keyof typeof icons] || "🎯";
}

function getTypeName(type: number) {
  const names = {
    1: "O Perfeccionista", 2: "O Prestativo", 3: "O Realizador",
    4: "O Individualista", 5: "O Investigador", 6: "O Leal",
    7: "O Entusiasta", 8: "O Desafiador", 9: "O Pacificador"
  };
  return names[type as keyof typeof names] || "Tipo Desconhecido";
}
