import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useRPG } from "@/contexts/RPGContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

  const { activeMasterId } = useRPG();
  const utils = trpc.useUtils();
  const { data: characters } = trpc.rpg.characters.list.useQuery();
  const { data: diceHistory } = trpc.rpg.diceRolls.list.useQuery();
  const createRollMutation = trpc.rpg.diceRolls.create.useMutation();
  const { data: attributesData } = trpc.rpg.attributes.get.useQuery(
    { characterId: parseInt(selectedCharacterId) },
    { enabled: !!selectedCharacterId }
  );

  const selectedChar = characters?.find((c) => c.id === parseInt(selectedCharacterId));

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
      {/* Dice Type Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3 sm:pb-4">
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

      {/* Number of Dice and Bonus - Stack on mobile, grid on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm text-amber-500 font-serif">Nº de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <Button
                onClick={() => setNumDice(Math.max(1, numDice - 1))}
                variant="outline"
                className="border-slate-600 text-slate-300 text-sm sm:text-base flex-shrink-0"
              >
                −
              </Button>
              <span className="text-2xl sm:text-3xl font-bold text-amber-500 w-12 text-center">{numDice}</span>
              <Button
                onClick={() => setNumDice(Math.min(20, numDice + 1))}
                variant="outline"
                className="border-slate-600 text-slate-300 text-sm sm:text-base flex-shrink-0"
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm text-amber-500 font-serif">Bônus Individual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <Button
                onClick={() => setManualBonus(manualBonus - 1)}
                variant="outline"
                className="border-slate-600 text-slate-300 text-sm sm:text-base flex-shrink-0"
              >
                −
              </Button>
              <span
                className={`text-2xl sm:text-3xl font-bold w-12 text-center ${
                  totalBonus > 0 ? "text-green-400" : totalBonus < 0 ? "text-red-400" : "text-slate-400"
                }`}
              >
                {totalBonus >= 0 ? "+" : ""}{totalBonus}
              </span>
              <Button
                onClick={() => setManualBonus(manualBonus + 1)}
                variant="outline"
                className="border-slate-600 text-slate-300 text-sm sm:text-base flex-shrink-0"
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Character and Attribute Selection */}
      {characters && characters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm text-amber-500 font-serif">Personagem</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Selecione um personagem" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id.toString()} className="text-xs sm:text-sm">
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm text-amber-500 font-serif">Atributo</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Nenhum atributo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="none" className="text-xs sm:text-sm">Nenhum</SelectItem>
                  {ATTRIBUTES.map((attr) => (
                    <SelectItem key={attr.key} value={attr.key} className="text-xs sm:text-sm">
                      {attr.short}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dice Roll Display and Button */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-4 sm:pt-6 text-center">
          <div
            className="text-4xl sm:text-6xl font-bold font-serif mb-3 sm:mb-4 min-h-16 sm:min-h-20 flex items-center justify-center"
            style={{
              color: lastRoll?.isCrit ? "#fbbf24" : lastRoll?.isFail ? "#ef4444" : "#f1f5f9",
              textShadow: lastRoll?.isCrit ? "0 0 24px #fbbf24" : "none",
            }}
          >
            {displayNum !== null ? displayNum : "−"}
          </div>
          {lastRoll && (
            <div className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
              {lastRoll.isCrit && <p className="text-amber-400 font-bold">⭐ CRÍTICO NATURAL! ⭐</p>}
              {lastRoll.isFail && <p className="text-red-400 font-bold">💀 FALHA CRÍTICA!</p>}
              <p className="truncate">Dados: [{lastRoll.pureResults.join(", ")}]</p>
              {lastRoll.totalUnitBonus !== 0 && (
                <p className={lastRoll.totalUnitBonus > 0 ? "text-green-400" : "text-red-400"}>
                  Bônus: {lastRoll.totalUnitBonus >= 0 ? "+" : ""}{lastRoll.totalUnitBonus}
                </p>
              )}
            </div>
          )}
          <Button
            onClick={handleRoll}
            disabled={rolling}
            size="lg"
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-sm sm:text-lg"
          >
            {rolling ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                Rolando...
              </>
            ) : (
              "🎲 Rolar!"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Dice History */}
      {diceHistory && diceHistory.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm text-amber-500 font-serif">Histórico de Rolagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
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
