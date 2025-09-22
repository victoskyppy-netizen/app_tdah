import { useState } from "react";
import { TaskManager } from "./TaskManager";
import { PomodoroTimer } from "./PomodoroTimer";
import { MoodTracker } from "./MoodTracker";
import { Stats } from "./Stats";
import { RoutineManager } from "./RoutineManager";
import { EnneagramTest } from "./EnneagramTest";
import { TransformationPlan } from "./TransformationPlan";
import { AIChat } from "./AIChat";
import { SmartDashboard } from "./SmartDashboard";
import { AdaptiveTimer } from "./AdaptiveTimer";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks" | "pomodoro" | "mood" | "stats" | "routines" | "enneagram" | "transformation">("dashboard");

  const tabs = [
    { id: "dashboard" as const, label: "Início", icon: "🏠" },
    { id: "tasks" as const, label: "Tarefas", icon: "📝" },
    { id: "routines" as const, label: "Rotinas", icon: "🌟" },
    { id: "pomodoro" as const, label: "Timer", icon: "⚡" },
    { id: "mood" as const, label: "Humor", icon: "😊" },
    { id: "enneagram" as const, label: "Eneagrama", icon: "🎯" },
    { id: "transformation" as const, label: "Transformação", icon: "🚀" },
    { id: "stats" as const, label: "Estatísticas", icon: "📊" },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-1">
        <nav className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === "dashboard" && <SmartDashboard />}
        {activeTab === "tasks" && <TaskManager />}
        {activeTab === "routines" && <RoutineManager />}
        {activeTab === "pomodoro" && <AdaptiveTimer />}
        {activeTab === "mood" && <MoodTracker />}
        {activeTab === "enneagram" && <EnneagramTest />}
        {activeTab === "transformation" && <TransformationPlan />}
        {activeTab === "stats" && <Stats />}
      </div>

      {/* AI Chat - Always available */}
      <AIChat />
    </div>
  );
}
