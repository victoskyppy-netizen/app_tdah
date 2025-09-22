import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🧠</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TDAH Organizer
          </h2>
        </div>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      
      <main className="flex-1 p-4">
        <Content />
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Authenticated>
        <Dashboard />
      </Authenticated>
      
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Organize sua rotina com TDAH
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              Um app pensado especialmente para pessoas com TDAH, com ferramentas para 
              organizar tarefas, acompanhar humor e manter o foco.
            </p>
          </div>
          
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-semibold mb-2">Tarefas Inteligentes</h3>
              <p className="text-sm text-gray-600">
                Quebra tarefas grandes em pequenas, com priorização visual
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">🍅</div>
              <h3 className="font-semibold mb-2">Timer Pomodoro</h3>
              <p className="text-sm text-gray-600">
                Mantenha o foco com sessões cronometradas de trabalho
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold mb-2">Acompanhamento</h3>
              <p className="text-sm text-gray-600">
                Monitore humor, energia e foco para entender seus padrões
              </p>
            </div>
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
