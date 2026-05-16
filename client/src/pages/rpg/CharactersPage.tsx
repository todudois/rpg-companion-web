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
import { SkillEditor, type Skill } from "@/components/SkillEditor";
import { SkillPanel } from "@/components/SkillPanel";

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

// Color schemes for classes and races
const CLASS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  guerreiro: { bg: "bg-red-900/40", border: "border-red-600", text: "text-red-300" },
  mago: { bg: "bg-purple-900/40", border: "border-purple-600", text: "text-purple-300" },
  arqueiro: { bg: "bg-green-900/40", border: "border-green-600", text: "text-green-300" },
  clérigo: { bg: "bg-yellow-900/40", border: "border-yellow-600", text: "text-yellow-300" },
  ladino: { bg: "bg-slate-900/40", border: "border-slate-600", text: "text-slate-300" },
  paladino: { bg: "bg-amber-900/40", border: "border-amber-600", text: "text-amber-300" },
  bardo: { bg: "bg-pink-900/40", border: "border-pink-600", text: "text-pink-300" },
  druida: { bg: "bg-emerald-900/40", border: "border-emerald-600", text: "text-emerald-300" },
};

const getClassColor = (classe: string) => {
  const key = classe.toLowerCase();
  return CLASS_COLORS[key] || CLASS_COLORS.guerreiro;
};

const getAttributeColor = (value: number) => {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-slate-300";
};

interface CharacterWithAttributes {
  character: any;
  attributes: Record<string, number> | null;
}

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
  const [skills, setSkills] = useState<Skill[]>([]);
  const [charactersWithAttributes, setCharactersWithAttributes] = useState<CharacterWithAttributes[]>([]);

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

  // Load attributes for all characters
  useEffect(() => {
    if (!characters) return;
    
    const loadAllAttributes = async () => {
      const withAttrs = await Promise.all(
        characters.map(async (char) => {
          try {
            const attrs = await utils.rpg.attributes.get.fetch({ characterId: char.id });
            return { character: char, attributes: attrs };
          } catch {
            return { character: char, attributes: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0, sob: 0, sor: 0, fe: 0 } };
          }
        })
      );
      setCharactersWithAttributes(withAttrs);
    };
    
    loadAllAttributes();
  }, [characters, utils]);

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
              <TabsList className="grid w-full grid-cols-3 bg-slate-700 mb-4">
                <TabsTrigger value="basico" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-xs sm:text-sm">
                  Básico
                </TabsTrigger>
                <TabsTrigger value="atributos" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-xs sm:text-sm">
                  Atributos
                </TabsTrigger>
                <TabsTrigger value="habilidades" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-xs sm:text-sm">
                  Habilidades
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

              <TabsContent value="habilidades" className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                <SkillEditor skills={skills} onChange={setSkills} />
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
        {charactersWithAttributes.map(({ character: char, attributes: charAttrs }) => {
          const classColor = getClassColor(char.classe);
          const hpPercent = (char.hp / char.hpMax) * 100;
          const vigorPercent = char.vigorMax > 0 ? (char.vigor / char.vigorMax) * 100 : 0;

          return (
            <Card
              key={char.id}
              className={`${classColor.bg} border-2 ${classColor.border} bg-gradient-to-r from-slate-800 to-slate-900 overflow-hidden transition-all hover:shadow-lg hover:shadow-amber-500/20`}
            >
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex justify-between items-start gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className={`text-base sm:text-lg font-bold ${classColor.text} truncate`}>
                        {char.name}
                      </CardTitle>
                      <span className="bg-amber-500/20 border border-amber-600 text-amber-300 px-2 py-1 rounded text-xs font-semibold flex-shrink-0">
                        Nv.{char.nivel}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm ${classColor.text} truncate font-medium`}>
                      {char.classe} • {char.raca}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      onClick={() => handleOpenDialog(char)}
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 w-8 h-8 p-0"
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

              <CardContent className="space-y-3">
                {/* Health Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-slate-300 font-semibold">❤️ Vida</p>
                    <p className="text-xs text-slate-200 font-mono">{char.hp}/{char.hpMax}</p>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-500 to-red-400 h-full transition-all"
                      style={{ width: `${Math.max(0, hpPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Vigor Bar */}
                {char.vigorMax > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-slate-300 font-semibold">⚡ Vigor</p>
                      <p className="text-xs text-slate-200 font-mono">{char.vigor}/{char.vigorMax}</p>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full transition-all"
                        style={{ width: `${Math.max(0, vigorPercent)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Attributes Preview */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[
                    { key: "for", label: "FOR" },
                    { key: "des", label: "DES" },
                    { key: "con", label: "CON" },
                    { key: "int", label: "INT" },
                  ].map(({ key, label }) => (
                    <div key={key} className="bg-slate-700/50 rounded p-1 text-center">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className={`text-xs font-bold ${getAttributeColor((charAttrs as any)[key] || 0)}`}>
                        {(charAttrs as any)[key] || 0 >= 0 ? "+" : ""}{(charAttrs as any)[key] || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
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
