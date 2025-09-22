import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export function RoutineManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay | "all">("all");
  const [editingRoutine, setEditingRoutine] = useState<Id<"routines"> | null>(null);

  const routines = useQuery(api.routines.getRoutines, 
    selectedTimeOfDay === "all" ? {} : { timeOfDay: selectedTimeOfDay }
  );
  const createRoutine = useMutation(api.routines.createRoutine);
  const updateRoutine = useMutation(api.routines.updateRoutine);
  const deleteRoutine = useMutation(api.routines.deleteRoutine);
  const executeRoutine = useMutation(api.routines.executeRoutine);

  const timeOfDayOptions = [
    { key: "all", label: "Todas", icon: "🌅" },
    { key: "morning", label: "Manhã", icon: "🌅" },
    { key: "afternoon", label: "Tarde", icon: "☀️" },
    { key: "evening", label: "Noite", icon: "🌆" },
    { key: "night", label: "Madrugada", icon: "🌙" },
  ];

  const handleCreateRoutine = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const tasks = [];
    let taskIndex = 0;
    
    while (formData.get(`task-${taskIndex}-title`)) {
      tasks.push({
        title: formData.get(`task-${taskIndex}-title`) as string,
        estimatedMinutes: formData.get(`task-${taskIndex}-minutes`) 
          ? parseInt(formData.get(`task-${taskIndex}-minutes`) as string)
          : undefined,
        order: taskIndex
      });
      taskIndex++;
    }

    try {
      await createRoutine({
        name: formData.get("name") as string,
        description: formData.get("description") as string || undefined,
        timeOfDay: formData.get("timeOfDay") as TimeOfDay,
        tasks,
        color: formData.get("color") as string,
        icon: formData.get("icon") as string,
      });
      
      setShowCreateForm(false);
      toast.success("Rotina criada com sucesso!");
      e.currentTarget.reset();
    } catch (error) {
      toast.error("Erro ao criar rotina");
    }
  };

  const handleExecuteRoutine = async (routineId: Id<"routines">, completedTaskIds: string[]) => {
    try {
      await executeRoutine({
        routineId,
        completedTaskIds,
      });
      toast.success("Execução da rotina registrada!");
    } catch (error) {
      toast.error("Erro ao registrar execução");
    }
  };

  const handleDeleteRoutine = async (routineId: Id<"routines">) => {
    if (confirm("Tem certeza que deseja excluir esta rotina?")) {
      try {
        await deleteRoutine({ routineId });
        toast.success("Rotina excluída!");
      } catch (error) {
        toast.error("Erro ao excluir rotina");
      }
    }
  };

  const getTimeOfDayLabel = (timeOfDay: TimeOfDay) => {
    const option = timeOfDayOptions.find(opt => opt.key === timeOfDay);
    return option ? `${option.icon} ${option.label}` : timeOfDay;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Mapeamento de Rotinas</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Nova Rotina
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {timeOfDayOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setSelectedTimeOfDay(option.key as TimeOfDay | "all")}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedTimeOfDay === option.key
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>

      {/* Create Routine Form */}
      {showCreateForm && (
        <RoutineForm
          onSubmit={handleCreateRoutine}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Routines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routines?.map((routine) => (
          <RoutineCard
            key={routine._id}
            routine={routine}
            onExecute={handleExecuteRoutine}
            onDelete={handleDeleteRoutine}
            getTimeOfDayLabel={getTimeOfDayLabel}
          />
        ))}
        
        {routines?.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🌟</div>
            <p>Nenhuma rotina encontrada</p>
            <p className="text-sm">Crie sua primeira rotina para começar a organizar seu dia!</p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold mb-4 text-purple-800">💡 Dicas para Rotinas com TDAH</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-purple-700 mb-2">🌅 Rotinas Matinais</h4>
            <p className="text-gray-600">Comece pequeno: 3-5 atividades simples. Use lembretes visuais e mantenha consistência.</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">⏰ Flexibilidade</h4>
            <p className="text-gray-600">Rotinas devem ser guias, não prisões. Adapte conforme necessário e celebre pequenos progressos.</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-green-700 mb-2">🔄 Hábitos Encadeados</h4>
            <p className="text-gray-600">Conecte novos hábitos a atividades já estabelecidas para facilitar a memorização.</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-orange-700 mb-2">📊 Acompanhamento</h4>
            <p className="text-gray-600">Use o sistema de execução para identificar padrões e ajustar suas rotinas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoutineForm({ onSubmit, onCancel }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, onCancel: () => void }) {
  const [tasks, setTasks] = useState([{ title: "", estimatedMinutes: "" }]);

  const addTask = () => {
    setTasks([...tasks, { title: "", estimatedMinutes: "" }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: string, value: string) => {
    const updatedTasks = tasks.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    );
    setTasks(updatedTasks);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Nova Rotina</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Rotina *
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Rotina Matinal Energizante"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período do Dia *
            </label>
            <select
              name="timeOfDay"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="morning">🌅 Manhã</option>
              <option value="afternoon">☀️ Tarde</option>
              <option value="evening">🌆 Noite</option>
              <option value="night">🌙 Madrugada</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            name="description"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descreva o objetivo desta rotina..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cor
            </label>
            <input
              name="color"
              type="color"
              defaultValue="#3B82F6"
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ícone
            </label>
            <input
              name="icon"
              type="text"
              defaultValue="🌟"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="🌟"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Tarefas da Rotina
            </label>
            <button
              type="button"
              onClick={addTask}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              + Adicionar Tarefa
            </button>
          </div>
          
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  name={`task-${index}-title`}
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTask(index, 'title', e.target.value)}
                  placeholder="Nome da tarefa"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  name={`task-${index}-minutes`}
                  type="number"
                  value={task.estimatedMinutes}
                  onChange={(e) => updateTask(index, 'estimatedMinutes', e.target.value)}
                  placeholder="Min"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Criar Rotina
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function RoutineCard({ routine, onExecute, onDelete, getTimeOfDayLabel }: any) {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [showExecution, setShowExecution] = useState(false);

  const routineStats = useQuery(api.routines.getRoutineStats, { 
    routineId: routine._id,
    days: 7 
  });

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleExecute = () => {
    onExecute(routine._id, completedTasks);
    setCompletedTasks([]);
    setShowExecution(false);
  };

  const completionRate = routine.tasks.length > 0 
    ? Math.round((completedTasks.length / routine.tasks.length) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b" style={{ backgroundColor: `${routine.color}10` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{routine.icon}</span>
            <h3 className="font-semibold text-gray-800">{routine.name}</h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowExecution(!showExecution)}
              className="text-blue-500 hover:text-blue-700 p-1"
              title="Executar rotina"
            >
              ▶️
            </button>
            <button
              onClick={() => onDelete(routine._id)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Excluir rotina"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{getTimeOfDayLabel(routine.timeOfDay)}</span>
          <span>{routine.tasks.length} tarefas</span>
        </div>
        
        {routine.description && (
          <p className="text-sm text-gray-600 mt-2">{routine.description}</p>
        )}
      </div>

      {/* Tasks List */}
      <div className="p-4">
        <div className="space-y-2">
          {routine.tasks.map((task: any, index: number) => (
            <div key={task.id} className="flex items-center gap-2 text-sm">
              {showExecution ? (
                <input
                  type="checkbox"
                  checked={completedTasks.includes(task.id)}
                  onChange={() => toggleTask(task.id)}
                  className="rounded"
                />
              ) : (
                <span className="text-gray-400">{index + 1}.</span>
              )}
              <span className="flex-1">{task.title}</span>
              {task.estimatedMinutes && (
                <span className="text-gray-500 text-xs">
                  {task.estimatedMinutes}min
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Execution Controls */}
        {showExecution && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                Progresso: {completionRate}%
              </span>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleExecute}
                className="flex-1 bg-green-500 text-white py-2 px-3 rounded text-sm hover:bg-green-600 transition-colors"
              >
                Finalizar Execução
              </button>
              <button
                onClick={() => setShowExecution(false)}
                className="bg-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {routineStats && !showExecution && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-medium text-gray-800">{routineStats.streak}</div>
                <div className="text-gray-500">Sequência</div>
              </div>
              <div>
                <div className="font-medium text-gray-800">{routineStats.averageCompletion}%</div>
                <div className="text-gray-500">Média</div>
              </div>
              <div>
                <div className="font-medium text-gray-800">{routineStats.totalExecutions}</div>
                <div className="text-gray-500">Execuções</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
