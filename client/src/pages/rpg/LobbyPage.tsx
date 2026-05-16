import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRPG } from "@/contexts/RPGContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Users, Crown, Sword } from "lucide-react";

export default function LobbyPage() {
  const { user } = useAuth();
  const { activeRole, setActiveRole, activeCharacterId, setActiveCharacterId, activeMasterId } = useRPG();
  const { data: characters } = trpc.rpg.characters.list.useQuery();
  const { data: allUsers } = trpc.rpg.session.getUsers.useQuery(
    { masterId: activeMasterId || user?.id || 0 },
    { enabled: !!(activeMasterId || user?.id) }
  );

  const selectedCharacter = characters?.find((c) => c.id === activeCharacterId);

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-amber-500 font-serif">Sala de Espera (Lobby)</CardTitle>
          <CardDescription>
            Escolha o seu papel na mesa para liberar as abas e configurar a sua sessão de jogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Escolha seu papel:</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setActiveRole("mestre")}
                variant={activeRole === "mestre" ? "default" : "outline"}
                className={`h-24 text-lg ${
                  activeRole === "mestre"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"
                }`}
              >
                👑 Entrar como Mestre
              </Button>
              <Button
                onClick={() => setActiveRole("jogador")}
                variant={activeRole === "jogador" ? "default" : "outline"}
                className={`h-24 text-lg ${
                  activeRole === "jogador"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🛡️ Entrar como Jogador
              </Button>
            </div>
          </div>

          {/* Character Selection for Players */}
          {activeRole === "jogador" && (
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-lg font-semibold mb-4">Vincular seu personagem:</h3>
              <Select value={activeCharacterId?.toString() || ""} onValueChange={(val) => setActiveCharacterId(val ? parseInt(val) : null)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Selecione um personagem" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {characters?.map((char) => (
                    <SelectItem key={char.id} value={char.id.toString()}>
                      {char.name} (Nv. {char.nivel} - {char.classe})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeCharacterId && selectedCharacter && (
                <div className="mt-4 p-3 bg-blue-900 border border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-200">
                    ✓ Personagem vinculado: <span className="font-semibold">{selectedCharacter.name}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 text-sm text-slate-300">
            <p className="font-semibold text-amber-500 mb-2">💡 Dica:</p>
            <p>
              {activeRole === "mestre"
                ? "Como Mestre, você terá acesso à Tela do Mestre para desenhar mapas e gerenciar a sessão."
                : activeRole === "jogador"
                  ? "Como Jogador, você pode rolar dados, gerenciar seu personagem e visualizar o histórico de rolagens."
                  : "Escolha um papel para começar!"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Session Info - Participants */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-amber-500 font-serif flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participantes da Sessão
          </CardTitle>
          <CardDescription>
            Jogadores e Mestre conectados nesta mesa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allUsers && allUsers.length > 0 ? (
              allUsers.map((participant) => (
                <div
                  key={participant.userId}
                  className={`p-3 rounded-lg border ${
                    participant.role === "mestre"
                      ? "bg-red-900 border-red-700"
                      : "bg-blue-900 border-blue-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {participant.role === "mestre" ? (
                        <Crown className="w-4 h-4 text-red-400" />
                      ) : (
                        <Sword className="w-4 h-4 text-blue-400" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-100">
                          {participant.userName}
                          {participant.userId === user?.id && " (Você)"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {participant.role === "mestre" ? "👑 Mestre" : `⚔️ ${participant.characterName || "Sem personagem"}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      participant.role === "mestre"
                        ? "bg-red-800 text-red-200"
                        : "bg-blue-800 text-blue-200"
                    }`}>
                      {participant.role === "mestre" ? "MESTRE" : "JOGADOR"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">Nenhum participante conectado ainda.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
