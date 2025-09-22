import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface QuickCaptureProps {
  onClose: () => void;
}

export function QuickCapture({ onClose }: QuickCaptureProps) {
  const [task, setTask] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const createTask = useMutation(api.tasks.createTask);

  useEffect(() => {
    // Focar no input quando abrir
    inputRef.current?.focus();

    // Configurar reconhecimento de voz se disponível
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTask(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error("Erro no reconhecimento de voz");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    try {
      // IA sugere prioridade baseada em palavras-chave
      const priority = suggestPriority(task);
      
      await createTask({
        title: task.trim(),
        priority,
      });
      
      toast.success("Tarefa capturada! 🎯");
      setTask("");
      onClose();
    } catch (error) {
      toast.error("Erro ao criar tarefa");
    }
  };

  const startVoiceCapture = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const suggestPriority = (taskText: string): "low" | "medium" | "high" | "urgent" => {
    const urgentKeywords = ['urgente', 'hoje', 'agora', 'imediato', 'prazo', 'deadline'];
    const highKeywords = ['importante', 'reunião', 'entrega', 'apresentação', 'prova'];
    const lowKeywords = ['depois', 'quando', 'talvez', 'eventualmente'];

    const text = taskText.toLowerCase();
    
    if (urgentKeywords.some(keyword => text.includes(keyword))) return 'urgent';
    if (highKeywords.some(keyword => text.includes(keyword))) return 'high';
    if (lowKeywords.some(keyword => text.includes(keyword))) return 'low';
    
    return 'medium';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">⚡ Captura Rápida</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Digite ou fale sua tarefa..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {recognitionRef.current && (
              <button
                type="button"
                onClick={startVoiceCapture}
                disabled={isListening}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                  isListening 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🎤
              </button>
            )}
          </div>

          {task && (
            <div className="text-sm text-gray-600">
              Prioridade sugerida: <span className="font-medium text-blue-600">
                {suggestPriority(task) === 'urgent' ? '🔴 Urgente' :
                 suggestPriority(task) === 'high' ? '🟠 Alta' :
                 suggestPriority(task) === 'medium' ? '🟡 Média' : '🟢 Baixa'}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!task.trim()}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Capturar Tarefa
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          💡 Dica: Use palavras como "urgente", "hoje" ou "importante" para priorização automática
        </div>
      </div>
    </div>
  );
}
