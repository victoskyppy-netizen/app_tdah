import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function TaskManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "in_progress" | "completed">("all");
  
  const tasks = useQuery(api.tasks.getTasks, filter === "all" ? {} : { status: filter });
  const createTask = useMutation(api.tasks.createTask);
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const addSubtask = useMutation(api.tasks.addSubtask);
  const toggleSubtask = useMutation(api.tasks.toggleSubtask);

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await createTask({
        title: formData.get("title") as string,
        description: formData.get("description") as string || undefined,
        priority: formData.get("priority") as "low" | "medium" | "high" | "urgent",
        estimatedMinutes: formData.get("estimatedMinutes") 
          ? parseInt(formData.get("estimatedMinutes") as string) 
          : undefined,
        category: formData.get("category") as string || undefined,
      });
      
      setShowCreateForm(false);
      toast.success("Tarefa criada com sucesso!");
      e.currentTarget.reset();
    } catch (error) {
      toast.error("Erro ao criar tarefa");
    }
  };

  const handleStatusChange = async (taskId: Id<"tasks">, status: "todo" | "in_progress" | "completed") => {
    try {
      await updateTaskStatus({ taskId, status });
      toast.success("Status atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDeleteTask = async (taskId: Id<"tasks">) => {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      try {
        await deleteTask({ taskId });
        toast.success("Tarefa excluída!");
      } catch (error) {
        toast.error("Erro ao excluir tarefa");
      }
    }
  };

  const handleAddSubtask = async (taskId: Id<"tasks">, subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return;
    
    try {
      await addSubtask({ taskId, subtaskTitle });
      toast.success("Subtarefa adicionada!");
    } catch (error) {
      toast.error("Erro ao adicionar subtarefa");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "todo": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Minhas Tarefas</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Nova Tarefa
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "Todas" },
          { key: "todo", label: "A Fazer" },
          { key: "in_progress", label: "Em Progresso" },
          { key: "completed", label: "Concluídas" },
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key as any)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === filterOption.key
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Nova Tarefa</h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                name="title"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Estudar para prova de matemática"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detalhes sobre a tarefa..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  name="priority"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempo estimado (min)
                </label>
                <input
                  name="estimatedMinutes"
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <input
                  name="category"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Estudos, Trabalho"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Criar Tarefa
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks?.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={toggleSubtask}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        ))}
        
        {tasks?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p>Nenhuma tarefa encontrada</p>
            <p className="text-sm">Crie sua primeira tarefa para começar!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete, onAddSubtask, onToggleSubtask, getPriorityColor, getStatusColor }: any) {
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const handleAddSubtask = () => {
    if (subtaskTitle.trim()) {
      onAddSubtask(task._id, subtaskTitle);
      setSubtaskTitle("");
      setShowSubtaskForm(false);
    }
  };

  const completedSubtasks = task.subtasks?.filter((st: any) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`font-semibold ${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
              {task.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
              {task.priority === "urgent" ? "Urgente" : 
               task.priority === "high" ? "Alta" :
               task.priority === "medium" ? "Média" : "Baixa"}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status === "completed" ? "Concluída" :
               task.status === "in_progress" ? "Em Progresso" : "A Fazer"}
            </span>
          </div>
          
          {task.description && (
            <p className="text-gray-600 text-sm mb-2">{task.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {task.category && <span>📁 {task.category}</span>}
            {task.estimatedMinutes && <span>⏱️ {task.estimatedMinutes} min</span>}
            {totalSubtasks > 0 && (
              <span>✅ {completedSubtasks}/{totalSubtasks} subtarefas</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="todo">A Fazer</option>
            <option value="in_progress">Em Progresso</option>
            <option value="completed">Concluída</option>
          </select>
          
          <button
            onClick={() => onDelete(task._id)}
            className="text-red-500 hover:text-red-700 p-1"
            title="Excluir tarefa"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Subtarefas:</h4>
          <div className="space-y-1">
            {task.subtasks.map((subtask: any) => (
              <div key={subtask.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => onToggleSubtask({ taskId: task._id, subtaskId: subtask.id })}
                  className="rounded"
                />
                <span className={`text-sm ${subtask.completed ? "line-through text-gray-500" : ""}`}>
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Subtask */}
      <div className="border-t pt-3">
        {showSubtaskForm ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Nova subtarefa..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              onKeyPress={(e) => e.key === "Enter" && handleAddSubtask()}
            />
            <button
              onClick={handleAddSubtask}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Adicionar
            </button>
            <button
              onClick={() => setShowSubtaskForm(false)}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSubtaskForm(true)}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            + Adicionar subtarefa
          </button>
        )}
      </div>
    </div>
  );
}
