import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

type MessageType = "general" | "routine" | "task" | "mood" | "enneagram";

export function AIChat() {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("general");
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatHistory = useQuery(api.chat.getChatHistory, { limit: 20 });
  const sendMessage = useMutation(api.chat.sendMessage);

  const messageTypes = [
    { key: "general", label: "Geral", icon: "💬" },
    { key: "routine", label: "Rotinas", icon: "🌟" },
    { key: "task", label: "Tarefas", icon: "📝" },
    { key: "mood", label: "Humor", icon: "😊" },
    { key: "enneagram", label: "Eneagrama", icon: "🎯" },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage({
        message: message.trim(),
        type: messageType,
      });
      setMessage("");
      toast.success("Mensagem enviada!");
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          title="Abrir Chat com IA"
        >
          <span className="text-2xl">🤖</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl border z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-semibold">Assistente TDAH</h3>
            <p className="text-xs opacity-90">Seu coach pessoal</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-white hover:text-gray-200 text-xl"
        >
          ✕
        </button>
      </div>

      {/* Message Type Selector */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex gap-1 overflow-x-auto">
          {messageTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setMessageType(type.key as MessageType)}
              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                messageType === type.key
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="mr-1">{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory?.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">👋</div>
            <p className="text-sm">Olá! Sou seu assistente especializado em TDAH.</p>
            <p className="text-xs mt-1">Como posso ajudar você hoje?</p>
          </div>
        )}

        {chatHistory?.slice().reverse().map((chat) => (
          <div key={chat._id} className="space-y-2">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[80%]">
                <p className="text-sm">{chat.message}</p>
                <p className="text-xs opacity-75 mt-1">{formatTime(chat.timestamp)}</p>
              </div>
            </div>

            {/* AI Response */}
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg max-w-[80%]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">🤖</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {messageTypes.find(t => t.key === chat.type)?.label}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{chat.response}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Pergunte sobre ${messageTypes.find(t => t.key === messageType)?.label.toLowerCase()}...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm">📤</span>
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          💡 Dica: Seja específico sobre seus desafios para receber dicas mais personalizadas
        </div>
      </form>
    </div>
  );
}
