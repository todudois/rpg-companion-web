import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useRPG } from "@/contexts/RPGContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Lock, Users, Trash2, Copy, Plus, Edit2 } from "lucide-react";

const ATTRIBUTES = [
  { key: "for", label: "Força", short: "FOR" },
  { key: "des", label: "Destreza", short: "DES" },
  { key: "con", label: "Constituição", short: "CON" },
  { key: "int", label: "Inteligência", short: "INT" },
  { key: "sab", label: "Sabedoria", short: "SAB" },
  { key: "car", label: "Carisma", short: "CAR" },
  { key: "sob", label: "Sobrevivência", short: "SOB" },
  { key: "sor", label: "Sorte", short: "SOR" },
  { key: "fe", label: "Fé", short: "FÉ" },
];

export default function LobbySelectionPage() {
  const { setActiveMasterId, setActiveRole, setActiveLobbyId, setIsLobbyCreator } = useRPG();
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [creatingLobby, setCreatingLobby] = useState(false);
  const [joiningLobby, setJoiningLobby] = useState(false);
  const [activeTab, setActiveTab] = useState("publicos");

  // Character creation state
  const [isCharacterDialogOpen, setIsCharacterDialogOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(null);
  const [charFormData, setCharFormData] = useState({
    name: "",
    classe: "",
    raca: "",
    nivel: 1,
    hp: 10,
    hpMax: 10,
    vigor: 0,
    vigorMax: 0,
    vigorType: "vigor" as "vigor" | "mana",
    notes: "",
  });
  const [charAttributes, setCharAttributes] = useState({
    for: 0,
    des: 0,
    con: 0,
    int: 0,
    sab: 0,
    car: 0,
    sob: 0,
    sor: 0,
    fe: 0,
  });

  const { data: availableLobbys, isLoading: loadingLobbys, refetch: refetchAvailable } = trpc.rpg.lobby.getAvailable.useQuery();
  const { data: myLobbys, isLoading: loadingMyLobbys, refetch: refetchMyLobbys } = trpc.rpg.lobby.getMyLobbys.useQuery();
  const { data: characters, isLoading: loadingCharacters, refetch: refetchCharacters } = trpc.rpg.characters.list.useQuery();
  
  const createLobbyMutation = trpc.rpg.lobby.create.useMutation();
  const joinLobbyMutation = trpc.rpg.lobby.join.useMutation();
  const deleteLobbyMutation = trpc.rpg.lobby.delete.useMutation();
  const createCharMutation = trpc.rpg.characters.create.useMutation();
  const updateCharMutation = trpc.rpg.characters.update.useMutation();
  const deleteCharMutation = trpc.rpg.characters.delete.useMutation();
  const upsertAttributesMutation = trpc.rpg.attributes.upsert.useMutation();
  const { data: attributesData } = trpc.rpg.attributes.get.useQuery(
    { characterId: editingCharacterId || 0 },
    { enabled: !!editingCharacterId }
  );

  // Load attributes when editing
  useEffect(() => {
    if (attributesData && editingCharacterId) {
      setCharAttributes({
        for: attributesData.for || 0,
        des: attributesData.des || 0,
        con: attributesData.con || 0,
        int: attributesData.int || 0,
        sab: attributesData.sab || 0,
        car: attributesData.car || 0,
        sob: attributesData.sob || 0,
        sor: attributesData.sor || 0,
        fe: attributesData.fe || 0,
      });
    }
  }, [attributesData, editingCharacterId]);

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
      if (result?.masterId) setActiveMasterId(result.masterId);
      if (result?.id) setActiveLobbyId(result.id);
      setActiveRole("mestre");
      setIsLobbyCreator(true);
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
      if (result?.masterId) setActiveMasterId(result.masterId);
      if (result?.id) setActiveLobbyId(result.id);
      setActiveRole("jogador");
      setIsLobbyCreator(false);
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

  const handleOpenCharacterDialog = (character?: any) => {
    if (character) {
      setEditingCharacterId(character.id);
      setCharFormData({
        name: character.name,
        classe: character.classe,
        raca: character.raca,
        nivel: character.nivel,
        hp: character.hp,
        hpMax: character.hpMax,
        vigor: character.vigor,
        vigorMax: character.vigorMax,
        vigorType: character.vigorType,
        notes: character.notes || "",
      });
    } else {
      setEditingCharacterId(null);
      setCharFormData({
        name: "",
        classe: "",
        raca: "",
        nivel: 1,
        hp: 10,
        hpMax: 10,
        vigor: 0,
        vigorMax: 0,
        vigorType: "vigor",
        notes: "",
      });
      setCharAttributes({
        for: 0,
        des: 0,
        con: 0,
        int: 0,
        sab: 0,
        car: 0,
        sob: 0,
        sor: 0,
        fe: 0,
      });
    }
    setIsCharacterDialogOpen(true);
  };

  const handleSaveCharacter = async () => {
    if (!charFormData.name.trim()) {
      toast.error("Nome do personagem é obrigatório");
      return;
    }
    if (!charFormData.classe.trim()) {
      toast.error("Classe é obrigatória");
      return;
    }
    if (!charFormData.raca.trim()) {
      toast.error("Raça é obrigatória");
      return;
    }

    try {
      let characterId: number;
      if (editingCharacterId) {
        await updateCharMutation.mutateAsync({
          id: editingCharacterId,
          data: charFormData,
        });
        characterId = editingCharacterId;
      } else {
        const result = await createCharMutation.mutateAsync(charFormData);
        characterId = result.id;
      }

      // Save attributes
      await upsertAttributesMutation.mutateAsync({
        characterId,
        attributes: charAttributes,
      });

      toast.success(editingCharacterId ? "Personagem atualizado!" : "Personagem criado!");
      setIsCharacterDialogOpen(false);
      refetchCharacters();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar personagem");
    }
  };

  const handleDeleteCharacter = async (characterId: number) => {
    if (!confirm("Tem certeza que deseja deletar este personagem?")) return;

    try {
      await deleteCharMutation.mutateAsync({ id: characterId });
      toast.success("Personagem deletado!");
      refetchCharacters();
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar personagem");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-amber-500 font-serif">Seleção de Lobby</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700">
              <TabsTrigger value="publicos">Lobbys Públicos</TabsTrigger>
              <TabsTrigger value="meus">Meus Lobbys</TabsTrigger>
              <TabsTrigger value="personagens">Personagens</TabsTrigger>
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
                                setActiveMasterId(lobby.masterId || lobby.id);
                                setActiveLobbyId(lobby.id);
                                setActiveRole("mestre");
                                setIsLobbyCreator(true);
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

            {/* Personagens */}
            <TabsContent value="personagens" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-amber-400">Seus Personagens</h3>
                <Dialog open={isCharacterDialogOpen} onOpenChange={setIsCharacterDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => handleOpenCharacterDialog()}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Personagem
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-amber-400">
                        {editingCharacterId ? "Editar Personagem" : "Criar Personagem"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-300">Nome</Label>
                          <Input
                            value={charFormData.name}
                            onChange={(e) => setCharFormData({ ...charFormData, name: e.target.value })}
                            className="bg-slate-700 border-slate-600"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Classe</Label>
                          <Input
                            value={charFormData.classe}
                            onChange={(e) => setCharFormData({ ...charFormData, classe: e.target.value })}
                            className="bg-slate-700 border-slate-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-300">Raça</Label>
                          <Input
                            value={charFormData.raca}
                            onChange={(e) => setCharFormData({ ...charFormData, raca: e.target.value })}
                            className="bg-slate-700 border-slate-600"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Nível</Label>
                          <Input
                            type="number"
                            value={charFormData.nivel}
                            onChange={(e) => setCharFormData({ ...charFormData, nivel: parseInt(e.target.value) })}
                            className="bg-slate-700 border-slate-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-300">HP</Label>
                          <Input
                            type="number"
                            value={charFormData.hp}
                            onChange={(e) => setCharFormData({ ...charFormData, hp: parseInt(e.target.value) })}
                            className="bg-slate-700 border-slate-600"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">HP Máximo</Label>
                          <Input
                            type="number"
                            value={charFormData.hpMax}
                            onChange={(e) => setCharFormData({ ...charFormData, hpMax: parseInt(e.target.value) })}
                            className="bg-slate-700 border-slate-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-300">Vigor/Mana</Label>
                          <Input
                            type="number"
                            value={charFormData.vigor}
                            onChange={(e) => setCharFormData({ ...charFormData, vigor: parseInt(e.target.value) })}
                            className="bg-slate-700 border-slate-600"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Máximo</Label>
                          <Input
                            type="number"
                            value={charFormData.vigorMax}
                            onChange={(e) => setCharFormData({ ...charFormData, vigorMax: parseInt(e.target.value) })}
                            className="bg-slate-700 border-slate-600"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-300">Tipo de Vigor</Label>
                        <Select value={charFormData.vigorType} onValueChange={(value) => setCharFormData({ ...charFormData, vigorType: value as "vigor" | "mana" })}>
                          <SelectTrigger className="bg-slate-700 border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="vigor">Vigor</SelectItem>
                            <SelectItem value="mana">Mana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-300">Notas</Label>
                        <Textarea
                          value={charFormData.notes}
                          onChange={(e) => setCharFormData({ ...charFormData, notes: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                          rows={3}
                        />
                      </div>

                      {/* Attributes */}
                      <div className="border-t border-slate-700 pt-4">
                        <Label className="text-amber-400 font-semibold">Atributos</Label>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {ATTRIBUTES.map((attr) => (
                            <div key={attr.key} className="space-y-1">
                              <Label className="text-xs text-slate-400">{attr.short}</Label>
                              <Input
                                type="number"
                                value={charAttributes[attr.key as keyof typeof charAttributes]}
                                onChange={(e) => setCharAttributes({ ...charAttributes, [attr.key]: parseInt(e.target.value) })}
                                className="bg-slate-700 border-slate-600 text-center"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleSaveCharacter}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        {editingCharacterId ? "Atualizar" : "Criar"} Personagem
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {loadingCharacters ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : characters && characters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {characters.map((character) => (
                    <Card key={character.id} className="bg-slate-700 border-slate-600">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-white">{character.name}</p>
                              <p className="text-sm text-slate-400">{character.classe} - {character.raca}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenCharacterDialog(character)}
                                className="border-amber-600 text-amber-600 hover:bg-amber-600/10"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteCharacter(character.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            <p>Nível {character.nivel} • HP: {character.hp}/{character.hpMax}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-8">Você ainda não criou nenhum personagem</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
