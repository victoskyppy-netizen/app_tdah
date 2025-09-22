import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function EnneagramTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const questions = useQuery(api.enneagram.getEnneagramQuestions);
  const enneagramResult = useQuery(api.enneagram.getEnneagramResult);
  const saveResult = useMutation(api.enneagram.saveEnneagramResult);

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);

    if (questions && currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = async (allAnswers: number[]) => {
    if (!questions) return;

    // Calcular pontuação por tipo
    const typeScores: { [key: number]: number } = {};
    
    questions.forEach((question, index) => {
      const score = allAnswers[index] || 0;
      if (!typeScores[question.type]) {
        typeScores[question.type] = 0;
      }
      typeScores[question.type] += score;
    });

    // Encontrar o tipo com maior pontuação
    const dominantType = Object.entries(typeScores)
      .sort(([,a], [,b]) => b - a)[0];

    const type = parseInt(dominantType[0]);

    try {
      await saveResult({
        type,
        answers: allAnswers,
      });
      setShowResults(true);
      toast.success("Resultado do Eneagrama salvo!");
    } catch (error) {
      toast.error("Erro ao salvar resultado");
    }
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
  };

  if (enneagramResult && !showResults) {
    return <EnneagramResults result={enneagramResult} onRetake={resetTest} />;
  }

  if (showResults && enneagramResult) {
    return <EnneagramResults result={enneagramResult} onRetake={resetTest} />;
  }

  if (!questions) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Teste do Eneagrama</h2>
        <div className="text-sm text-gray-500">
          {currentQuestion + 1} de {questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {questions[currentQuestion]?.question}
          </h3>
          <p className="text-sm text-gray-600">
            Avalie o quanto esta afirmação se aplica a você:
          </p>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { score: 1, label: "Discordo Totalmente", color: "bg-red-100 text-red-700 border-red-200" },
            { score: 2, label: "Discordo", color: "bg-orange-100 text-orange-700 border-orange-200" },
            { score: 3, label: "Neutro", color: "bg-gray-100 text-gray-700 border-gray-200" },
            { score: 4, label: "Concordo", color: "bg-green-100 text-green-700 border-green-200" },
            { score: 5, label: "Concordo Totalmente", color: "bg-blue-100 text-blue-700 border-blue-200" },
          ].map((option) => (
            <button
              key={option.score}
              onClick={() => handleAnswer(option.score)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${option.color}`}
            >
              <div className="text-2xl font-bold mb-1">{option.score}</div>
              <div className="text-xs">{option.label}</div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          
          <div className="text-sm text-gray-500">
            Responda com honestidade para obter o melhor resultado
          </div>
          
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
        <h3 className="text-lg font-semibold mb-4 text-indigo-800">🎯 Sobre o Eneagrama</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-indigo-700 mb-2">O que é?</h4>
            <p className="text-gray-600">O Eneagrama é um sistema de personalidade que identifica 9 tipos básicos, cada um com motivações, medos e padrões únicos.</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-purple-700 mb-2">Como ajuda no TDAH?</h4>
            <p className="text-gray-600">Conhecer seu tipo ajuda a entender seus padrões de comportamento e desenvolver estratégias personalizadas de produtividade.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnneagramResults({ result, onRetake }: { result: any, onRetake: () => void }) {
  const getTypeIcon = (type: number) => {
    const icons = {
      1: "⚖️", 2: "❤️", 3: "🏆", 4: "🎨", 5: "🔍",
      6: "🛡️", 7: "🌟", 8: "💪", 9: "☮️"
    };
    return icons[type as keyof typeof icons] || "🎯";
  };

  const getTypeName = (type: number) => {
    const names = {
      1: "O Perfeccionista", 2: "O Prestativo", 3: "O Realizador",
      4: "O Individualista", 5: "O Investigador", 6: "O Leal",
      7: "O Entusiasta", 8: "O Desafiador", 9: "O Pacificador"
    };
    return names[type as keyof typeof names] || "Tipo Desconhecido";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Seu Resultado do Eneagrama</h2>
        <button
          onClick={onRetake}
          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
        >
          Refazer Teste
        </button>
      </div>

      {/* Main Result */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border border-blue-200 text-center">
        <div className="text-6xl mb-4">{getTypeIcon(result.type)}</div>
        <h3 className="text-3xl font-bold text-gray-800 mb-2">
          Tipo {result.type}
        </h3>
        <h4 className="text-xl text-blue-700 mb-4">
          {getTypeName(result.type)}
        </h4>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {result.description}
        </p>
      </div>

      {/* Strengths */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-green-700 flex items-center gap-2">
          <span>💪</span> Seus Pontos Fortes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.strengths.map((strength: string, index: number) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700">{strength}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Challenges */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-orange-700 flex items-center gap-2">
          <span>⚠️</span> Desafios a Observar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.challenges.map((challenge: string, index: number) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <span className="text-orange-500">!</span>
              <span className="text-gray-700">{challenge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Tips */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-purple-700 flex items-center gap-2">
          <span>🌱</span> Dicas de Crescimento Personalizadas
        </h3>
        <div className="space-y-3">
          {result.growthTips.map((tip: string, index: number) => (
            <div key={index} className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <span className="text-purple-500 mt-1">•</span>
              <span className="text-gray-700">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200 text-center">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          Pronto para transformar sua vida?
        </h4>
        <p className="text-gray-600 mb-4">
          Use seu resultado do Eneagrama para criar um plano de transformação personalizado de 30 dias.
        </p>
        <button
          onClick={() => window.location.hash = '#transformation'}
          className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
        >
          Criar Plano de Transformação 🚀
        </button>
      </div>
    </div>
  );
}
