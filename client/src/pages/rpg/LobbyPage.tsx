import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRPG } from "@/contexts/RPGContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Users, Crown, Sword, Eye } from "lucide-react";

export default function LobbyPage() {
  const { user } = useAuth();
  const { activeRole, setActiveRole, activeCharacterId, setActiveCharacterId, activeMasterId } = useRPG();
  const { data: characters } = trpc.rpg.characters.list.useQuery();
  const { data: allUsers, refetch: refetchUsers } = trpc.rpg.session.getUsers.useQuery(
    { lobbyId: activeMasterId || 0 },
    { enabled: !!activeMasterId }
  );
  const updateRoleMutation = trpc.rpg.session.updateRole.useMutation();

  const selectedCharacter = characters?.find((c) => c.id === activeCharacterId);
  const hasMaster = allUsers?.some(u => u.role === "mestre");
  const currentUserRole = allUsers?.find(u => u.userId === user?.id)?.role;

  const handleRoleChange = async (newRole: string) => {
    if (!activeMasterId) return;
    try {
      await updateRoleMutation.mutateAsync({
        lobbyId: activeMasterId,
        role: newRole as "mestre" | "jogador" | "espectador" | "indefinido",
      });
      setActiveRole(newRole as any);
      refetchUsers();
    } catch (error: any) {
      console.error("Erro ao atualizar role:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Role Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-amber-500 font-serif text-lg sm:text-xl">Sala de Espera (Lobby)</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Escolha o seu papel na mesa para liberar as abas e configurar a sua sessão de jogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-slate-200">Escolha seu papel:</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <Button
                onClick={() => handleRoleChange("mestre")}
                disabled={hasMaster && currentUserRole !== "mestre"}
                variant={activeRole === "mestre" ? "default" : "outline"}
                className={`h-20 sm:h-24 text-xs sm:text-lg flex flex-col items-center justify-center gap-1 sm:gap-2 ${
                  activeRole === "mestre"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"
                } ${hasMaster && currentUserRole !== "mestre" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Mestre</span>
              </Button>
              <Button
                onClick={() => handleRoleChange("jogador")}
                variant={activeRole === "jogador" ? "default" : "outline"}
                className={`h-20 sm:h-24 text-xs sm:text-lg flex flex-col items-center justify-center gap-1 sm:gap-2 ${
                  activeRole === "jogador"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Sword className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Jogador</span>
              </Button>
              <Button
                onClick={() => handleRoleChange("espectador")}
                variant={activeRole === "espectador" ? "default" : "outline"}
                className={`h-20 sm:h-24 text-xs sm:text-lg flex flex-col items-center justify-center gap-1 sm:gap-2 ${
                  activeRole === "espectador"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Espectador</span>
              </Button>
            </div>
            {hasMaster && currentUserRole !== "mestre" && (
              <p className="text-xs sm:text-sm text-red-400 mt-2 sm:mt-3">⚠️ Já existe um Mestre neste lobby</p>
            )}
          </div>

          {/* Character Selection for Players */}
          {activeRole === "jogador" && (
            <div className="border-t border-slate-700 pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 text-slate-200">Vincular seu personagem:</h3>
              <Select value={activeCharacterId?.toString() || "none"} onValueChange={(val) => setActiveCharacterId(val !== "none" ? parseInt(val) : null)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 w-full text-sm">
                  <SelectValue placeholder="Selecione um personagem" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="none" className="text-sm text-slate-400">
                    Nenhum personagem
                  </SelectItem>
                  {characters?.map((char) => (
                    <SelectItem key={char.id} value={char.id.toString()} className="text-sm">
                      {char.name} (Nv. {char.nivel} - {char.classe})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeCharacterId && selectedCharacter && (
                <div className="mt-3 p-3 bg-blue-900 border border-blue-700 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-200">
                    ✓ Personagem vinculado: <span className="font-semibold truncate">{selectedCharacter.name}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Role Info */}
          {activeRole && activeRole !== "indefinido" && (
            <div className="border-t border-slate-700 pt-4 sm:pt-6">
              <div className="p-3 sm:p-4 bg-slate-700 rounded-lg border border-slate-600">
                <p className="text-xs sm:text-sm text-slate-300">
                  {activeRole === "mestre" && "👑 Como Mestre, você pode desenhar mapas, gerenciar a sessão e controlar o jogo."}
                  {activeRole === "jogador" && "🛡️ Como Jogador, você pode rolar dados, gerenciar seu personagem e participar da aventura."}
                  {activeRole === "espectador" && "👁️ Como Espectador, você pode ver o mapa do Mestre e acompanhar a sessão, mas não participa ativamente."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
            <span className="text-amber-500 font-serif truncate">Participantes da Sessão</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allUsers && allUsers.length > 0 ? (
            <div className="space-y-2">
              {allUsers.map((participant) => (
                <div key={participant.id} className="p-2 sm:p-3 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{participant.userName || "Desconhecido"}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {participant.role === "mestre" && "👑 Mestre"}
                      {participant.role === "jogador" && participant.characterName && `🛡️ ${participant.characterName}`}
                      {participant.role === "jogador" && !participant.characterName && "🛡️ Jogador (sem personagem)"}
                      {participant.role === "espectador" && "👁️ Espectador"}
                      {participant.role === "indefinido" && "❓ Indefinido"}
                    </p>
                  </div>
                  {participant.role === "mestre" && <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-6 sm:py-8 text-sm">Nenhum participante ainda</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
