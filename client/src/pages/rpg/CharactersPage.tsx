import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
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
  const utils = trpc.useUtils();
  const { data: characters, isLoading } = trpc.rpg.characters.list.useQuery();
  const createCharMutation = trpc.rpg.characters.create.useMutation();
  const updateCharMutation = trpc.rpg.characters.update.useMutation();
  const deleteCharMutation = trpc.rpg.characters.delete.useMutation();

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

  const handleOpenDialog = (character?: any) => {
    if (character) {
      setEditingId(character.id);
      setFormData(character);
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
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.classe || !formData.raca) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await updateCharMutation.mutateAsync({
          id: editingId,
          data: formData,
        });
        toast.success("Personagem atualizado!");
      } else {
        await createCharMutation.mutateAsync(formData);
        toast.success("Personagem criado!");
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-500 font-serif">Personagens da Mesa</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              + Novo Personagem
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-amber-500 font-serif">
                {editingId ? "✏️ Editar Personagem" : "⚔️ Novo Personagem"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label className="text-slate-300">Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do personagem"
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300">Classe *</Label>
                  <Input
                    value={formData.classe}
                    onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                    placeholder="Ex: Guerreiro"
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Raça *</Label>
                  <Input
                    value={formData.raca}
                    onChange={(e) => setFormData({ ...formData, raca: e.target.value })}
                    placeholder="Ex: Humano"
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Nível</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) || 1 })}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
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
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-slate-300">Anotações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Inventário, história, etc..."
                  className="bg-slate-700 border-slate-600 text-slate-100 min-h-24"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={createCharMutation.isPending || updateCharMutation.isPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                >
                  💾 Salvar
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {characters?.map((char) => (
          <Card key={char.id} className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {char.name}
                    <span className="text-amber-500 ml-2 text-sm">Nv.{char.nivel}</span>
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    {char.classe} • {char.raca}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenDialog(char)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(char.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
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

      {!characters || characters.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-12 text-center text-slate-400">
            <p>Nenhum personagem criado ainda. Crie um novo personagem para começar!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
