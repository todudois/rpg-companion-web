import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useRPG } from "@/contexts/RPGContext";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock, Users, Trash2, Copy } from "lucide-react";

export default function LobbySelectionPage() {
  const { setActiveMasterId, setActiveRole } = useRPG();
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [creatingLobby, setCreatingLobby] = useState(false);
  const [joiningLobby, setJoiningLobby] = useState(false);
  const [activeTab, setActiveTab] = useState("publicos");

  const { data: availableLobbys, isLoading: loadingLobbys, refetch: refetchAvailable } = trpc.rpg.lobby.getAvailable.useQuery();
  const { data: myLobbys, isLoading: loadingMyLobbys, refetch: refetchMyLobbys } = trpc.rpg.lobby.getMyLobbys.useQuery();
  const createLobbyMutation = trpc.rpg.lobby.create.useMutation();
  const joinLobbyMutation = trpc.rpg.lobby.join.useMutation();
  const deleteLobbyMutation = trpc.rpg.lobby.delete.useMutation();

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
      refetchMyLobbys();
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
        accessCode: joinCode,
        password: joinPassword,
      });
      
      toast.success(`Entrou no lobby: ${result.name}`);
      setJoinCode("");
      setJoinPassword("");
      setActiveMasterId(result.id);
      // Definir role como "jogador" ao entrar em um lobby
      setActiveRole("jogador");
    } catch (error: any) {
      toast.error(error.message || "Erro ao entrar no lobby");
    } finally {
      setJoiningLobby(false);
    }
  };

  const handleDeleteLobby = async (lobbyId: number) => {
    if (!confirm("Tem certeza que deseja deletar este lobby?")) return;

    try {
      await deleteLobbyMutation.mutateAsync({ lobbyId });
      toast.success("Lobby deletado com sucesso");
      refetchMyLobbys();
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar lobby");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-amber-500 font-serif">Seleção de Lobby</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="publicos">Lobbys Públicos</TabsTrigger>
              <TabsTrigger value="meus">Meus Lobbys</TabsTrigger>
            </TabsList>

            {/* Lobbys Públicos */}
            <TabsContent value="publicos" className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-amber-400">Entrar em um Lobby</h3>
                <div className="space-y-2">
                  <Input
                    placeholder="Código do lobby"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                  <Button
                    onClick={handleJoinLobby}
                    disabled={joiningLobby}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {joiningLobby ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Entrar no Lobby
                  </Button>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-medium text-amber-400 mb-3">Lobbys Disponíveis</h3>
                {loadingLobbys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  </div>
                ) : availableLobbys && availableLobbys.length > 0 ? (
                  <div className="space-y-2">
                    {availableLobbys.map((lobby) => (
                      <Card key={lobby.id} className="bg-slate-700 border-slate-600">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{lobby.name}</p>
                              <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                <Users className="h-4 w-4" />
                                <span>Mestre: {lobby.masterName || "Desconhecido"}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setJoinCode(lobby.accessCode);
                                setActiveTab("publicos");
                              }}
                              className="border-amber-600 text-amber-600 hover:bg-amber-600/10"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-8">Nenhum lobby disponível</p>
                )}
              </div>
            </TabsContent>

            {/* Meus Lobbys */}
            <TabsContent value="meus" className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-amber-400">Criar Novo Lobby</h3>
                <div className="space-y-2">
                  <Input
                    placeholder="Nome do lobby"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                  <Input
                    type="password"
                    placeholder="Senha (mín. 4 caracteres)"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                  <Button
                    onClick={handleCreateLobby}
                    disabled={creatingLobby}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {creatingLobby ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Criar Lobby
                  </Button>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-medium text-amber-400 mb-3">Seus Lobbys</h3>
                {loadingMyLobbys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  </div>
                ) : myLobbys && myLobbys.length > 0 ? (
                  <div className="space-y-2">
                    {myLobbys.map((lobby) => (
                      <Card key={lobby.id} className="bg-slate-700 border-slate-600">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{lobby.name}</p>
                              <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                <Lock className="h-4 w-4" />
                                <span>Código: {lobby.accessCode}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveMasterId(lobby.id);
                                  setActiveRole("mestre");
                                }}
                                className="bg-amber-600 hover:bg-amber-700"
                              >
                                Entrar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteLobby(lobby.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-8">Você ainda não criou nenhum lobby</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
