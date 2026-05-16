import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useRPG } from "@/contexts/RPGContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";


const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];
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

export default function DiceRollPage() {
  const [numDice, setNumDice] = useState(1);
  const [diceType, setDiceType] = useState(20);
  const [manualBonus, setManualBonus] = useState(0);
  const [selectedAttribute, setSelectedAttribute] = useState<string>("none");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [rolling, setRolling] = useState(false);
  const [displayNum, setDisplayNum] = useState<number | null>(null);
  const [lastRoll, setLastRoll] = useState<any>(null);
  const [characterAttributes, setCharacterAttributes] = useState<any>(null);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState(false);

  const { activeMasterId } = useRPG();
  const utils = trpc.useUtils();
  const { data: characters } = trpc.rpg.characters.list.useQuery();
  const { data: diceHistory } = trpc.rpg.diceRolls.list.useQuery();
  const createRollMutation = trpc.rpg.diceRolls.create.useMutation();
  const { data: attributesData } = trpc.rpg.attributes.get.useQuery(
    { characterId: parseInt(selectedCharacterId) },
    { enabled: !!selectedCharacterId }
  );

  const { data: selectedCharDetails } = trpc.rpg.characters.get.useQuery(
    { id: parseInt(selectedCharacterId) },
    { enabled: !!selectedCharacterId }
  );

  const selectedChar = selectedCharDetails || characters?.find((c) => c.id === parseInt(selectedCharacterId));

  const handleRoll = async () => {
    if (rolling) return;
    setRolling(true);

    let i = 0;
    const iv = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * diceType) + 1);
      if (++i >= 10) {
        clearInterval(iv);

        const pureResults = Array.from({ length: numDice }, () =>
          Math.floor(Math.random() * diceType) + 1
        );

        const attrBonus =
          selectedAttribute !== "none" && characterAttributes
            ? characterAttributes[selectedAttribute as keyof typeof characterAttributes] || 0
            : 0;
        const totalUnitBonus = manualBonus + attrBonus;
        const detailedResults = pureResults.map((val) => val + totalUnitBonus);
        const total = detailedResults.reduce((a, b) => a + b, 0);

        const isCrit = numDice === 1 && diceType === 20 && pureResults[0] === 20;
        const isFail = numDice === 1 && diceType === 20 && pureResults[0] === 1;

        const roll = {
          numDice,
          diceType,
          pureResults,
          totalUnitBonus,
          total,
          attributeKey: selectedAttribute !== "none" ? selectedAttribute : undefined,
          characterId: selectedCharacterId ? parseInt(selectedCharacterId) : undefined,
          isCrit,
          isFail,
        };

        setLastRoll(roll);
        setDisplayNum(total);

        createRollMutation.mutate(roll, {
          onSuccess: () => {
            utils.rpg.diceRolls.list.invalidate();
          },
        });

        setRolling(false);
      }
    }, 55);
  };

  useEffect(() => {
    if (attributesData) {
      setCharacterAttributes({
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
  }, [attributesData]);

  const attrBonus =
    selectedAttribute !== "none" && characterAttributes
      ? characterAttributes[selectedAttribute as keyof typeof characterAttributes] || 0
      : 0;
  const totalBonus = manualBonus + attrBonus;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Character Selection at Top */}
      {selectedChar && (
        <Card className={`${getClassColor(selectedChar.classe).bg} border-2 ${getClassColor(selectedChar.classe).border}`}>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* Character Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-amber-500">{selectedChar.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-400">{selectedChar.classe} • Nível {selectedChar.nivel}</p>
                </div>
              </div>

              {/* Character Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">❤️ HP:</span>
                  <span className="font-bold text-red-400">{selectedChar.hp}/{selectedChar.hp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">⚡ {selectedChar.vigorType === 'vigor' ? 'Vigor' : 'Mana'}:</span>
                  <span className="font-bold text-blue-400">{selectedChar.vigor}/{selectedChar.vigor}</span>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="flex flex-wrap gap-1">
                {ATTRIBUTES.map((attr) => {
                  const value = characterAttributes?.[attr.key as keyof typeof characterAttributes] || 0;
                  return (
                    <span
                      key={attr.key}
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        value > 0
                          ? "bg-green-900/40 text-green-300"
                          : value < 0
                          ? "bg-red-900/40 text-red-300"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {attr.short} {value >= 0 ? "+" : ""}{value}
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dice Type Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-amber-500 font-serif text-base sm:text-lg">Tipo de Dado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DICE_TYPES.map((d) => (
              <Button
                key={d}
                onClick={() => setDiceType(d)}
                variant={diceType === d ? "default" : "outline"}
                className={`text-xs sm:text-sm flex-shrink-0 ${
                  diceType === d
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-900"
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"
                }`}
              >
                d{d}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Number of Dice and Bonus - Same Row */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs text-amber-500 font-serif">Nº Dados</CardTitle>
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between gap-1">
              <Button
                onClick={() => setNumDice(Math.max(1, numDice - 1))}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 flex-shrink-0 h-7 w-7 p-0"
              >
                −
              </Button>
              <span className="text-lg sm:text-xl font-bold text-amber-500 flex-1 text-center">{numDice}</span>
              <Button
                onClick={() => setNumDice(Math.min(20, numDice + 1))}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 flex-shrink-0 h-7 w-7 p-0"
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs text-amber-500 font-serif">Bônus</CardTitle>
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between gap-1">
              <Button
                onClick={() => setManualBonus(manualBonus - 1)}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 flex-shrink-0 h-7 w-7 p-0"
              >
                −
              </Button>
              <span
                className={`text-lg sm:text-xl font-bold flex-1 text-center ${
                  totalBonus > 0 ? "text-green-400" : totalBonus < 0 ? "text-red-400" : "text-slate-400"
                }`}
              >
                {totalBonus >= 0 ? "+" : ""}{totalBonus}
              </span>
              <Button
                onClick={() => setManualBonus(manualBonus + 1)}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 flex-shrink-0 h-7 w-7 p-0"
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attribute Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm text-amber-500 font-serif">Atributo (Bônus/Dado)</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-300">
              <SelectValue placeholder="Selecione um atributo" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="none">Nenhum</SelectItem>
              {ATTRIBUTES.map((attr) => (
                <SelectItem key={attr.key} value={attr.key}>
                  {attr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Character Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm text-amber-500 font-serif">Personagem</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-300">
              <SelectValue placeholder="Selecione um personagem" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {characters?.map((char) => (
                <SelectItem key={char.id} value={char.id.toString()}>
                  {char.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Roll Result Display */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6 pb-4">
          <div className="text-center space-y-4">
            {displayNum !== null && (
              <div className="text-5xl sm:text-6xl font-bold text-amber-500 font-serif">{displayNum}</div>
            )}
            <Button
              onClick={handleRoll}
              disabled={rolling || !selectedCharacterId}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-base sm:text-lg h-12"
            >
              {rolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rolando...
                </>
              ) : (
                "🎲 Rolar!"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills Section - Expandable */}
      {selectedCharDetails?.skills && selectedCharDetails.skills.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedSkills(!expandedSkills)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm text-amber-500 font-serif">⚡ Habilidades</CardTitle>
              {expandedSkills ? (
                <ChevronUp className="h-4 w-4 text-amber-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-amber-500" />
              )}
            </div>
          </CardHeader>
          {expandedSkills && (
            <CardContent className="pt-2">
              <div className="space-y-2">
                {selectedCharDetails.skills.map((skill: any) => (
                  <div key={skill.id} className="bg-slate-700 p-2 rounded text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-amber-400">{skill.name}</span>
                      <span className="text-slate-400 text-xs">{skill.type}</span>
                    </div>
                    {skill.description && (
                      <p className="text-slate-300 text-xs">{skill.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Dice History */}
      {diceHistory && diceHistory.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm text-amber-500 font-serif">Histórico de Rolagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {diceHistory.map((roll) => (
                <div key={roll.id} className="flex items-center gap-2 text-xs text-slate-400 bg-slate-700 p-2 rounded min-w-0">
                  <span className="font-mono flex-shrink-0">{roll.numDice}d{roll.diceType}</span>
                  <span className="flex-1 truncate">[{(roll.pureResults as number[]).join(", ")}]</span>
                  {roll.totalUnitBonus !== 0 && (
                    <span className={`flex-shrink-0 ${roll.totalUnitBonus > 0 ? "text-green-400" : "text-red-400"}`}>
                      {roll.totalUnitBonus >= 0 ? "+" : ""}{roll.totalUnitBonus}
                    </span>
                  )}
                  <span className="font-bold text-slate-100 flex-shrink-0">{roll.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
