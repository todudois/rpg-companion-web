import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRPG } from "@/contexts/RPGContext";
import { trpc } from "@/lib/trpc";

export default function LobbyPage() {
  const { activeRole, setActiveRole, activeCharacterId, setActiveCharacterId } = useRPG();
  const { data: characters } = trpc.rpg.characters.list.useQuery();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-amber-500 font-serif">Sala de Espera (Lobby)</CardTitle>
          <CardDescription>
            Escolha o seu papel na mesa para liberar as abas e configurar a sua sessão de jogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selection */}
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
              {activeCharacterId && (
                <p className="text-sm text-slate-400 mt-2">
                  ✓ Personagem vinculado com sucesso!
                </p>
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
    </div>
  );
}
