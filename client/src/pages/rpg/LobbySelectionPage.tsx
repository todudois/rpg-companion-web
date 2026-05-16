import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useRPG } from "@/contexts/RPGContext";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock, Users } from "lucide-react";

export default function LobbySelectionPage() {
  const { setActiveMasterId, setActiveRole } = useRPG();
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [creatingLobby, setCreatingLobby] = useState(false);
  const [joiningLobby, setJoiningLobby] = useState(false);

  const { data: availableLobbys, isLoading: loadingLobbys } = trpc.rpg.lobby.getAvailable.useQuery();
  const createLobbyMutation = trpc.rpg.lobby.create.useMutation();
  const joinLobbyMutation = trpc.rpg.lobby.join.useMutation();

  const handleCreateLobby = async () => {
    if (!createName.trim()) {
      toast.error("Nome do lobby é obrigatório");
      return;
    }
    if (createPassword.length < 4) {
      toast.error("Senha deve ter pelo menos 4 caracteres");
      return;
    }

    setCreatingLobby(true);
    try {
      const result = await createLobbyMutation.mutateAsync({
        name: createName,
        password: createPassword,
      });
      
      toast.success(`Lobby criado! Código: ${result?.accessCode}`);
      setCreateName("");
      setCreatePassword("");
      if (result?.id) setActiveMasterId(result.id);
      setActiveRole("mestre");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar lobby");
    } finally {
      setCreatingLobby(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!joinCode.trim()) {
      toast.error("Código do lobby é obrigatório");
      return;
    }
    if (!joinPassword.trim()) {
      toast.error("Senha é obrigatória");
      return;
    }

    setJoiningLobby(true);
    try {
      const result = await joinLobbyMutation.mutateAsync({
        accessCode: joinCode.toUpperCase(),
        password: joinPassword,
      });

      toast.success(`Entrou no lobby: ${result.name}`);
      setJoinCode("");
      setJoinPassword("");
      setActiveMasterId(result.masterId);
      setActiveRole("jogador");
    } catch (error: any) {
      if (error.message.includes("NOT_FOUND")) {
        toast.error("Lobby não encontrado");
      } else if (error.message.includes("FORBIDDEN")) {
        toast.error("Senha incorreta ou lobby foi fechado");
      } else {
        toast.error(error.message || "Erro ao entrar no lobby");
      }
    } finally {
      setJoiningLobby(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-500 mb-2">RPG Companion</h1>
          <p className="text-slate-300">Escolha um lobby para jogar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Criar Lobby */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-amber-500">Criar Novo Lobby</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">Crie um novo lobby para seus amigos entrarem</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">
                    Criar Lobby
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-amber-500">Criar Novo Lobby</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-300">Nome do Lobby</label>
                      <Input
                        placeholder="Ex: Aventura do Dragão"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">Senha</label>
                      <Input
                        type="password"
                        placeholder="Mínimo 4 caracteres"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <Button
                      onClick={handleCreateLobby}
                      disabled={creatingLobby}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      {creatingLobby && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Criar Lobby
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Entrar em Lobby */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-amber-500">Entrar em Lobby</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">Entre em um lobby usando o código compartilhado</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Entrar em Lobby
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-amber-500">Entrar em Lobby</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-300">Código do Lobby</label>
                      <Input
                        placeholder="Ex: ABC123"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        className="bg-slate-700 border-slate-600 text-white"
                        maxLength={8}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">Senha</label>
                      <Input
                        type="password"
                        placeholder="Senha do lobby"
                        value={joinPassword}
                        onChange={(e) => setJoinPassword(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <Button
                      onClick={handleJoinLobby}
                      disabled={joiningLobby}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {joiningLobby && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Entrar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Lobbys Disponíveis */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lobbys Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLobbys ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : availableLobbys && availableLobbys.length > 0 ? (
              <div className="space-y-3">
                {availableLobbys.map((lobby) => (
                  <Card key={lobby.id} className="bg-slate-700 border-slate-600">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{lobby.name}</h3>
                          <p className="text-sm text-slate-400">Mestre: {lobby.masterName || "Desconhecido"}</p>
                          <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                            <Lock className="h-3 w-3" />
                            Código: {lobby.accessCode}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setJoinCode(lobby.accessCode);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Usar Código
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">Nenhum lobby disponível no momento</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
