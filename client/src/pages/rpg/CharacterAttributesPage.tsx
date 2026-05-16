import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useRPG } from "@/contexts/RPGContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ATTRIBUTES = [
  { key: "for", label: "Força", short: "FOR", icon: "💪" },
  { key: "des", label: "Destreza", short: "DES", icon: "🤸" },
  { key: "con", label: "Constituição", short: "CON", icon: "🛡️" },
  { key: "int", label: "Inteligência", short: "INT", icon: "🧠" },
  { key: "sab", label: "Sabedoria", short: "SAB", icon: "👁️" },
  { key: "car", label: "Carisma", short: "CAR", icon: "✨" },
  { key: "sob", label: "Sobrevivência", short: "SOB", icon: "🏹" },
  { key: "sor", label: "Sorte", short: "SOR", icon: "🍀" },
  { key: "fe", label: "Fé", short: "FÉ", icon: "✝️" },
];

export default function CharacterAttributesPage() {
  const { activeCharacterId } = useRPG();
  const utils = trpc.useUtils();
  const { data: character } = trpc.rpg.characters.get.useQuery(
    { id: activeCharacterId! },
    { enabled: !!activeCharacterId }
  );
  const { data: attributes } = trpc.rpg.attributes.get.useQuery(
    { characterId: activeCharacterId! },
    { enabled: !!activeCharacterId }
  );
  const upsertMutation = trpc.rpg.attributes.upsert.useMutation();

  const [formData, setFormData] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (attributes) {
      setFormData({
        for: attributes.for || 0,
        des: attributes.des || 0,
        con: attributes.con || 0,
        int: attributes.int || 0,
        sab: attributes.sab || 0,
        car: attributes.car || 0,
        sob: attributes.sob || 0,
        sor: attributes.sor || 0,
        fe: attributes.fe || 0,
      });
    }
  }, [attributes]);

  const handleSave = async () => {
    if (!activeCharacterId) return;
    
    setIsSaving(true);
    try {
      await upsertMutation.mutateAsync({
        characterId: activeCharacterId,
        data: formData as any,
      });
      await utils.rpg.attributes.get.invalidate({ characterId: activeCharacterId });
      toast.success("Atributos salvos com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar atributos");
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeCharacterId) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="py-12 text-center text-slate-400">
          <p>Selecione um personagem na aba Lobby para editar seus atributos</p>
        </CardContent>
      </Card>
    );
  }

  if (!character) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin w-8 h-8 text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-amber-500 font-serif">
            Atributos de {character.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ATTRIBUTES.map((attr) => (
              <div key={attr.key} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{attr.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-400">{attr.short}</p>
                    <p className="text-xs text-slate-400">{attr.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        [attr.key]: Math.max(-10, (formData[attr.key] || 0) - 1),
                      })
                    }
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300"
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    value={formData[attr.key] || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [attr.key]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-slate-600 border-slate-500 text-center text-slate-100 w-16"
                  />
                  <Button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        [attr.key]: Math.min(10, (formData[attr.key] || 0) + 1),
                      })
                    }
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300"
                  >
                    +
                  </Button>
                  <span
                    className={`text-sm font-bold w-12 text-right ${
                      (formData[attr.key] || 0) > 0
                        ? "text-green-400"
                        : (formData[attr.key] || 0) < 0
                          ? "text-red-400"
                          : "text-slate-400"
                    }`}
                  >
                    {(formData[attr.key] || 0) >= 0 ? "+" : ""}{formData[attr.key] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Salvando...
                </>
              ) : (
                "💾 Salvar Atributos"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-slate-700 border-slate-600">
        <CardContent className="pt-6">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-amber-400">💡 Dica:</span> Os bônus de atributos
            serão aplicados automaticamente quando você rolar dados usando este personagem. Valores
            positivos aumentam o resultado, negativos diminuem.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
