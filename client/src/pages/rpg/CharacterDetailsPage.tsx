import { useParams, useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
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

export default function CharacterDetailsPage() {
  const [, navigate] = useRouter();
  const { id } = useParams<{ id: string }>();
  const characterId = parseInt(id || "0");

  const { data: character, isLoading: charLoading } = trpc.rpg.characters.get.useQuery(
    { id: characterId },
    { enabled: !!characterId }
  );
  const { data: attributes } = trpc.rpg.attributes.get.useQuery(
    { characterId },
    { enabled: !!characterId }
  );
  const { data: skills } = trpc.rpg.skills.list.useQuery(
    { characterId },
    { enabled: !!characterId }
  );

  if (charLoading || !character) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin w-8 h-8 text-amber-500" />
      </div>
    );
  }

  const classColor = getClassColor(character.classe);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => navigate("/personagens")}
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Character Card */}
      <Card className={`${classColor.bg} border-2 ${classColor.border}`}>
        <CardContent className="pt-6 space-y-4">
          {/* Header */}
          <div>
            <h1 className={`text-3xl font-bold ${classColor.text} font-serif`}>{character.name}</h1>
            <p className="text-slate-400">
              Nível {character.nivel} • {character.classe} • {character.raca}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Life */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-red-300 font-semibold">❤️ Vida</span>
                <span className="text-red-300 font-bold">{character.hp}/{character.hpMax}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 to-red-500 h-full"
                  style={{ width: `${(character.hp / character.hpMax) * 100}%` }}
                />
              </div>
            </div>

            {/* Vigor/Mana */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={character.vigorType === "mana" ? "text-blue-300 font-semibold" : "text-amber-300 font-semibold"}>
                  {character.vigorType === "mana" ? "🔵 Mana" : "⚡ Vigor"}
                </span>
                <span className={character.vigorType === "mana" ? "text-blue-300 font-bold" : "text-amber-300 font-bold"}>
                  {character.vigor}/{character.vigorMax}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`bg-gradient-to-r h-full ${
                    character.vigorType === "mana"
                      ? "from-blue-600 to-blue-500"
                      : "from-amber-600 to-amber-500"
                  }`}
                  style={{ width: `${(character.vigor / character.vigorMax) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Attributes Grid */}
          <div className="border-t border-slate-700 pt-4">
            <h2 className="text-lg font-semibold text-slate-300 mb-3">Atributos</h2>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
              {ATTRIBUTES.map((attr) => {
                const value = attributes?.[attr.key as keyof typeof attributes] || 0;
                return (
                  <div key={attr.key} className="bg-slate-700 rounded p-2 text-center">
                    <p className="text-xs text-slate-400 font-semibold">{attr.short}</p>
                    <p className={`text-lg font-bold ${getAttributeColor(value)}`}>
                      {value > 0 ? "+" : ""}{value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {character.notes && (
            <div className="border-t border-slate-700 pt-4">
              <h2 className="text-lg font-semibold text-slate-300 mb-2">Anotações</h2>
              <p className="text-slate-300 whitespace-pre-wrap">{character.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-amber-500 font-serif mb-4">Habilidades</h2>
          <SkillPanel skills={skills} />
        </div>
      )}
    </div>
  );
}
