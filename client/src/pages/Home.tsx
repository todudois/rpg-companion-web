import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRPG } from "@/contexts/RPGContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import LobbyPage from "./rpg/LobbyPage";
import DiceRollPage from "./rpg/DiceRollPage";
import CharactersPage from "./rpg/CharactersPage";
import MasterScreenPage from "./rpg/MasterScreenPage";
import LobbySelectionPage from "./rpg/LobbySelectionPage";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { activeRole, setActiveRole, activeCharacterId } = useRPG();
  const [activeTab, setActiveTab] = useState("lobby");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-8 h-8 text-amber-500" />
          <p className="text-slate-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-md w-full mx-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🎲</div>
            <h1 className="text-3xl font-bold text-amber-500 mb-2 font-serif">RPG Companion</h1>
            <p className="text-slate-300 mb-8">Mesa Digital para Mestres e Jogadores</p>
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
              size="lg"
            >
              Fazer Login com Manus
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se não tem um lobby ativo, mostrar seleção de lobby
  if (!activeRole || activeRole === "unassigned") {
    return <LobbySelectionPage />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b-2 border-amber-500 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎲</span>
            <h1 className="text-2xl font-bold text-amber-500 font-serif">RPG Companion</h1>
          </div>
          <div className="flex items-center gap-4">
            {(activeRole === "mestre" || activeRole === "jogador" || activeRole === "espectador") && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    activeRole === "mestre"
                      ? "bg-red-900 text-red-200"
                      : activeRole === "jogador"
                      ? "bg-blue-900 text-blue-200"
                      : "bg-purple-900 text-purple-200"
                  }`}
                >
                  {activeRole === "mestre" ? "👑 MESTRE" : activeRole === "jogador" ? "⚔️ JOGADOR" : "👁️ ESPECTADOR"}
                </span>
                {activeCharacterId && activeRole === "jogador" && (
                  <span className="text-xs text-slate-400">ID: {activeCharacterId}</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{user?.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveRole("unassigned");
                }}
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
              >
                Trocar Lobby
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800 border border-slate-700 mb-6 flex-wrap">
            <TabsTrigger value="lobby" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900">
              🏢 Lobby
            </TabsTrigger>
            {(activeRole === "mestre" || activeRole === "jogador") && (
              <TabsTrigger value="dados" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900">
                🎲 Dados e Painel
              </TabsTrigger>
            )}
            {activeRole === "jogador" && (
              <TabsTrigger value="personagens" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900">
                ⚔️ Personagens
              </TabsTrigger>
            )}
            {(activeRole === "mestre" || activeRole === "jogador" || activeRole === "espectador") && (
              <TabsTrigger value="mestre" className={`${
                activeRole === "mestre"
                  ? "data-[state=active]:bg-red-600"
                  : activeRole === "jogador"
                  ? "data-[state=active]:bg-blue-600"
                  : "data-[state=active]:bg-purple-600"
              } data-[state=active]:text-white`}>
                🗺️ Tela do Mestre
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="lobby" className="mt-0">
            <LobbyPage />
          </TabsContent>

          {(activeRole === "mestre" || activeRole === "jogador") && (
            <TabsContent value="dados" className="mt-0">
              <DiceRollPage />
            </TabsContent>
          )}

          {activeRole === "jogador" && (
            <TabsContent value="personagens" className="mt-0">
              <CharactersPage />
            </TabsContent>
          )}

          {(activeRole === "mestre" || activeRole === "jogador" || activeRole === "espectador") && (
            <TabsContent value="mestre" className="mt-0">
              <MasterScreenPage readOnly={activeRole !== "mestre"} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
