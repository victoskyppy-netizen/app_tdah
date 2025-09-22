import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

type MoodLevel = "very_low" | "low" | "neutral" | "good" | "excellent";
type EnergyLevel = "very_low" | "low" | "medium" | "high" | "very_high";
type FocusLevel = "very_low" | "low" | "medium" | "high" | "very_high";

export function MoodTracker() {
  const [mood, setMood] = useState<MoodLevel>("neutral");
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [focus, setFocus] = useState<FocusLevel>("medium");
  const [notes, setNotes] = useState("");

  const createMoodEntry = useMutation(api.mood.createMoodEntry);
  const todayMoodEntry = useQuery(api.mood.getTodayMoodEntry);
  const moodEntries = useQuery(api.mood.getMoodEntries, { days: 7 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMoodEntry({
        mood,
        energy,
        focus,
        notes: notes.trim() || undefined,
      });
      
      toast.success("Registro de humor salvo!");
      setNotes("");
    } catch (error) {
      toast.error("Erro ao salvar registro");
    }
  };

  const getMoodEmoji = (moodLevel: MoodLevel) => {
    switch (moodLevel) {
      case "very_low": return "😢";
      case "low": return "😕";
      case "neutral": return "😐";
      case "good": return "😊";
      case "excellent": return "😄";
      default: return "😐";
    }
  };

  const getMoodLabel = (moodLevel: MoodLevel) => {
    switch (moodLevel) {
      case "very_low": return "Muito Baixo";
      case "low": return "Baixo";
      case "neutral": return "Neutro";
      case "good": return "Bom";
      case "excellent": return "Excelente";
      default: return "Neutro";
    }
  };

  const getEnergyLabel = (energyLevel: EnergyLevel) => {
    switch (energyLevel) {
      case "very_low": return "Muito Baixa";
      case "low": return "Baixa";
      case "medium": return "Média";
      case "high": return "Alta";
      case "very_high": return "Muito Alta";
      default: return "Média";
    }
  };

  const getFocusLabel = (focusLevel: FocusLevel) => {
    switch (focusLevel) {
      case "very_low": return "Muito Baixo";
      case "low": return "Baixo";
      case "medium": return "Médio";
      case "high": return "Alto";
      case "very_high": return "Muito Alto";
      default: return "Médio";
    }
  };

  // Se já existe entrada para hoje, usar os valores existentes
  if (todayMoodEntry && mood === "neutral" && energy === "medium" && focus === "medium") {
    setMood(todayMoodEntry.mood);
    setEnergy(todayMoodEntry.energy);
    setFocus(todayMoodEntry.focus);
    if (todayMoodEntry.notes) setNotes(todayMoodEntry.notes);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Acompanhamento de Humor</h2>
        <div className="text-sm text-gray-500">
          {todayMoodEntry ? "Atualizar registro de hoje" : "Novo registro"}
        </div>
      </div>

      {/* Today's Entry Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Como você está se sentindo hoje?</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Humor {getMoodEmoji(mood)}
            </label>
            <div className="flex gap-2">
              {(["very_low", "low", "neutral", "good", "excellent"] as MoodLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setMood(level)}
                  className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
                    mood === level
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-2xl mb-1">{getMoodEmoji(level)}</div>
                  <div className="text-xs">{getMoodLabel(level)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Energia ⚡
            </label>
            <div className="flex gap-2">
              {(["very_low", "low", "medium", "high", "very_high"] as EnergyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEnergy(level)}
                  className={`flex-1 p-2 rounded-lg border text-center transition-colors ${
                    energy === level
                      ? "bg-green-100 border-green-300 text-green-700"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-xs">{getEnergyLabel(level)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Focus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Foco 🎯
            </label>
            <div className="flex gap-2">
              {(["very_low", "low", "medium", "high", "very_high"] as FocusLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFocus(level)}
                  className={`flex-1 p-2 rounded-lg border text-center transition-colors ${
                    focus === level
                      ? "bg-purple-100 border-purple-300 text-purple-700"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-xs">{getFocusLabel(level)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Como foi seu dia? O que influenciou seu humor?"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {todayMoodEntry ? "Atualizar Registro" : "Salvar Registro"}
          </button>
        </form>
      </div>

      {/* Recent Entries */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Últimos 7 dias</h3>
        
        {moodEntries && moodEntries.length > 0 ? (
          <div className="space-y-3">
            {moodEntries.map((entry) => (
              <div key={entry._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getMoodEmoji(entry.mood)}</div>
                  <div>
                    <div className="font-medium">
                      {new Date(entry.date).toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                    {entry.notes && (
                      <div className="text-sm text-gray-600 mt-1">{entry.notes}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-500">Energia</div>
                    <div className="font-medium">{getEnergyLabel(entry.energy)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Foco</div>
                    <div className="font-medium">{getFocusLabel(entry.focus)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <p>Nenhum registro encontrado</p>
            <p className="text-sm">Comece registrando como você se sente hoje!</p>
          </div>
        )}
      </div>
    </div>
  );
}
