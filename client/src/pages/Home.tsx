import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRPG } from "@/contexts/RPGContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { Loader2, Menu, X } from "lucide-react";
import LobbyPage from "./rpg/LobbyPage";
import DiceRollPage from "./rpg/DiceRollPage";
import CharactersPage from "./rpg/CharactersPage";
import MasterScreenPage from "./rpg/MasterScreenPage";
import LobbySelectionPage from "./rpg/LobbySelectionPage";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { activeRole, setActiveRole, activeCharacterId } = useRPG();
  const [activeTab, setActiveTab] = useState("lobby");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            
            {/* Referral Link */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-xs text-slate-400 mb-3">Novo no Manus? Use o link de referência:</p>
              <a
                href="https://manus.im/invitation/SEVJXTU9OIYGWD?utm_source=invitation&utm_medium=social&utm_campaign=copy_link"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-amber-400 hover:text-amber-300 text-sm font-semibold rounded transition-colors break-all"
              >
                Criar Conta com Referência
              </a>
              <p className="text-xs text-slate-500 mt-2">Você ganha 500 créditos bônus! 🎁</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b-2 border-amber-500 sticky top-0 z-40">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          {/* Top row: Logo and menu button */}
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xl sm:text-2xl flex-shrink-0">🎲</span>
              <h1 className="text-lg sm:text-2xl font-bold text-amber-500 font-serif truncate">RPG Companion</h1>
            </div>
            
            {/* Mobile menu button */}
            <button
              className="sm:hidden flex-shrink-0 p-1 hover:bg-slate-700 rounded"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Desktop header content */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(activeRole === "mestre" || activeRole === "jogador" || activeRole === "espectador") && (
                <>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold flex-shrink-0 ${
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
                </>
              )}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-slate-400 truncate">{user?.name}</span>
              {(activeRole === "mestre" || activeRole === "jogador" || activeRole === "espectador") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveRole("unassigned");
                  }}
                  className="text-slate-300 border-slate-600 hover:bg-slate-700 flex-shrink-0 text-xs"
                >
                  Trocar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-slate-300 border-slate-600 hover:bg-slate-700 flex-shrink-0"
              >
                Sair
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-3 pt-3 border-t border-slate-700 space-y-3">
              {(activeRole === "mestre" || activeRole === "jogador" || activeRole === "espectador") && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
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
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="truncate">{user?.name}</span>
              </div>
              <div className="flex gap-2">
                {(activeRole === "mestre" || activeRole === "jogador" || activeRole === "espectador") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveRole("unassigned");
                      setMobileMenuOpen(false);
                    }}
                    className="text-slate-300 border-slate-600 hover:bg-slate-700 text-xs flex-1"
                  >
                    Trocar Lobby
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-slate-300 border-slate-600 hover:bg-slate-700 text-xs flex-1"
                >
                  Sair
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
        {/* Se não tem um lobby ativo, mostrar seleção de lobby */}
        {!activeRole || activeRole === "unassigned" ? (
          <LobbySelectionPage />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
            <TabsList className="bg-slate-800 border border-slate-700 mb-4 sm:mb-6 flex-wrap w-full justify-start sm:justify-start gap-1 h-auto p-1">
              <TabsTrigger 
                value="lobby" 
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-xs sm:text-sm flex-shrink-0"
              >
                🏢 <span className="hidden sm:inline">Lobby</span>
              </TabsTrigger>
              {(activeRole === "mestre" || (activeRole === "jogador" && activeCharacterId)) && (
                <TabsTrigger 
                  value="dados" 
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-xs sm:text-sm flex-shrink-0"
                >
                  🎲 <span className="hidden sm:inline">Dados</span>
                </TabsTrigger>
              )}
              {activeRole === "jogador" && (
                <TabsTrigger 
                  value="personagens" 
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-xs sm:text-sm flex-shrink-0"
                >
                  ⚔️ <span className="hidden sm:inline">Personagens</span>
                </TabsTrigger>
              )}
              {(activeRole === "mestre" || activeRole === "jogador" || activeRole === "espectador") && (
                <TabsTrigger 
                  value="mestre" 
                  className={`${
                    activeRole === "mestre"
                      ? "data-[state=active]:bg-red-600"
                      : activeRole === "jogador"
                      ? "data-[state=active]:bg-blue-600"
                      : "data-[state=active]:bg-purple-600"
                  } data-[state=active]:text-white text-xs sm:text-sm flex-shrink-0`}
                >
                  🗺️ <span className="hidden sm:inline">Mestre</span>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1 min-h-0 overflow-y-auto relative">
              {/* MasterScreenPage sempre montado, apenas oculto com CSS */}
              {(activeRole === "mestre" || activeRole === "jogador" || activeRole === "espectador") && (
                <div className="absolute inset-0" style={{ display: activeTab === "mestre" ? "block" : "none", pointerEvents: activeTab === "mestre" ? "auto" : "none" }}>
                  <MasterScreenPage readOnly={activeRole !== "mestre"} />
                </div>
              )}

              {/* Outras abas */}
              <TabsContent value="lobby" className="mt-0" style={{ display: activeTab === "lobby" ? "block" : "none" }}>
                <LobbyPage />
              </TabsContent>

              {(activeRole === "mestre" || activeRole === "jogador") && (
                <TabsContent value="dados" className="mt-0" style={{ display: activeTab === "dados" ? "block" : "none" }}>
                  <DiceRollPage />
                </TabsContent>
              )}

              {activeRole === "jogador" && (
                <TabsContent value="personagens" className="mt-0" style={{ display: activeTab === "personagens" ? "block" : "none" }}>
                  <CharactersPage />
                </TabsContent>
              )}
            </div>
          </Tabs>
        )}
      </main>
    </div>
  );
}
