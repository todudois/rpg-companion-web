import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Edit2 } from "lucide-react";

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

export default function CharactersPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    classe: "",
    raca: "",
    nivel: 1,
    hp: 10,
    hpMax: 10,
    vigor: 0,
    vigorMax: 0,
    notes: "",
  });

  const [attributes, setAttributes] = useState({
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

  const utils = trpc.useUtils();
  const { data: characters, isLoading } = trpc.rpg.characters.list.useQuery();
  const createCharMutation = trpc.rpg.characters.create.useMutation();
  const updateCharMutation = trpc.rpg.characters.update.useMutation();
  const deleteCharMutation = trpc.rpg.characters.delete.useMutation();
  const { data: attributesData } = trpc.rpg.attributes.get.useQuery(
    { characterId: editingId || 0 },
    { enabled: !!editingId }
  );
  const upsertAttributesMutation = trpc.rpg.attributes.upsert.useMutation();

  // Carregar atributos quando attributesData chegar
  useEffect(() => {
    if (attributesData && editingId) {
      setAttributes(attributesData);
    }
  }, [attributesData, editingId]);

  const handleOpenDialog = (character?: any) => {
    if (character) {
      setEditingId(character.id);
      setFormData(character);
      // useEffect vai carregar os atributos quando attributesData chegar
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        classe: "",
        raca: "",
        nivel: 1,
        hp: 10,
        hpMax: 10,
        vigor: 0,
        vigorMax: 0,
        notes: "",
      });
      setAttributes({
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
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.classe || !formData.raca) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      let characterId = editingId;

      if (editingId) {
        await updateCharMutation.mutateAsync({
          id: editingId,
          data: formData,
        });
        toast.success("Personagem atualizado!");
      } else {
        const result = await createCharMutation.mutateAsync(formData);
        if (result) {
          characterId = result.id;
        }
        toast.success("Personagem criado!");
      }

      if (characterId) {
        await upsertAttributesMutation.mutateAsync({
          characterId,
          data: attributes,
        });
      }

      await utils.rpg.characters.list.invalidate();
      setIsOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar personagem");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este personagem?")) return;

    try {
      await deleteCharMutation.mutateAsync({ id });
      toast.success("Personagem deletado!");
      await utils.rpg.characters.list.invalidate();
    } catch (error) {
      toast.error("Erro ao deletar personagem");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin w-8 h-8 text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-amber-500 font-serif truncate">Personagens da Mesa</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-amber-500 hover:bg-amber-600 text-slate-900 w-full sm:w-auto text-sm sm:text-base">
              + Novo Personagem
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-amber-500 font-serif text-lg">
                {editingId ? "✏️ Editar Personagem" : "⚔️ Novo Personagem"}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700 mb-4">
                <TabsTrigger value="basico" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-xs sm:text-sm">
                  Básico
                </TabsTrigger>
                <TabsTrigger value="atributos" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-xs sm:text-sm">
                  Atributos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basico" className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label className="text-slate-300 text-sm">Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do personagem"
                    className="bg-slate-700 border-slate-600 text-slate-100 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <Label className="text-slate-300 text-xs sm:text-sm">Classe *</Label>
                    <Input
                      value={formData.classe}
                      onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                      placeholder="Ex: Guerreiro"
                      className="bg-slate-700 border-slate-600 text-slate-100 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs sm:text-sm">Raça *</Label>
                    <Input
                      value={formData.raca}
                      onChange={(e) => setFormData({ ...formData, raca: e.target.value })}
                      placeholder="Ex: Humano"
                      className="bg-slate-700 border-slate-600 text-slate-100 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs sm:text-sm">Nível</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.nivel}
                      onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) || 1 })}
                      className="bg-slate-700 border-slate-600 text-slate-100 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "hp", label: "❤️ Vida" },
                    { key: "hpMax", label: "❤️ Vida Máx" },
                    { key: "vigor", label: "⚡ Vigor" },
                    { key: "vigorMax", label: "⚡ Vigor Máx" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-slate-300 text-xs">{label}</Label>
                      <Input
                        type="number"
                        value={formData[key as keyof typeof formData]}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: parseInt(e.target.value) || 0 })
                        }
                        className="bg-slate-700 border-slate-600 text-slate-100 text-xs"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="text-slate-300 text-sm">Anotações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Inventário, história, etc..."
                    className="bg-slate-700 border-slate-600 text-slate-100 min-h-20 text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="atributos" className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                <p className="text-xs sm:text-sm text-slate-400 mb-3">Defina os bônus de atributos do personagem:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {ATTRIBUTES.map((attr) => (
                    <div key={attr.key}>
                      <Label className="text-slate-300 text-xs sm:text-sm">{attr.short}</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Button
                          onClick={() => setAttributes({ ...attributes, [attr.key]: Math.max(-10, attributes[attr.key as keyof typeof attributes] - 1) })}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs"
                        >
                          −
                        </Button>
                        <Input
                          type="number"
                          value={attributes[attr.key as keyof typeof attributes]}
                          onChange={(e) => setAttributes({ ...attributes, [attr.key]: parseInt(e.target.value) || 0 })}
                          className="bg-slate-700 border-slate-600 text-slate-100 text-center text-xs w-10"
                        />
                        <Button
                          onClick={() => setAttributes({ ...attributes, [attr.key]: Math.min(10, attributes[attr.key as keyof typeof attributes] + 1) })}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={createCharMutation.isPending || updateCharMutation.isPending || upsertAttributesMutation.isPending}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 text-sm"
              >
                💾 Salvar
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 text-sm"
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Characters Grid */}
      <div className="grid gap-3 sm:gap-4">
        {characters?.map((char) => (
          <Card key={char.id} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex justify-between items-start gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg truncate">
                    {char.name}
                    <span className="text-amber-500 ml-2 text-xs sm:text-sm">Nv.{char.nivel}</span>
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-slate-400 truncate">
                    {char.classe} • {char.raca}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    onClick={() => handleOpenDialog(char)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 w-8 h-8 p-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(char.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900 w-8 h-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-400">❤️ Vida</p>
                  <p className="text-sm font-semibold">
                    {char.hp}/{char.hpMax}
                  </p>
                </div>
                {char.vigorMax > 0 && (
                  <div>
                    <p className="text-xs text-slate-400">⚡ Vigor</p>
                    <p className="text-sm font-semibold">
                      {char.vigor}/{char.vigorMax}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!characters || (characters.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-8 sm:py-12 text-center text-slate-400 text-sm">
            <p>Nenhum personagem criado ainda. Crie um novo personagem para começar!</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
