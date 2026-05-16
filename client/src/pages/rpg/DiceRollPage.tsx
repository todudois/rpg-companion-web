import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
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
  const utils = trpc.useUtils();
  const { data: characters } = trpc.rpg.characters.list.useQuery();
  const { data: diceHistory } = trpc.rpg.diceRolls.list.useQuery({ limit: 50 });
  const createRollMutation = trpc.rpg.diceRolls.create.useMutation();

  const [numDice, setNumDice] = useState(1);
  const [diceType, setDiceType] = useState(20);
  const [manualBonus, setManualBonus] = useState(0);
  const [selectedAttribute, setSelectedAttribute] = useState<string>("none");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [rolling, setRolling] = useState(false);
  const [displayNum, setDisplayNum] = useState<number | null>(null);
  const [lastRoll, setLastRoll] = useState<any>(null);
  const [characterAttributes, setCharacterAttributes] = useState<any>(null);

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
    if (selectedChar) {
      setCharacterAttributes({
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
  }, [selectedChar]);

  const attrBonus =
    selectedAttribute !== "none" && characterAttributes
      ? characterAttributes[selectedAttribute as keyof typeof characterAttributes] || 0
      : 0;
  const totalBonus = manualBonus + attrBonus;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-amber-500 font-serif">Tipo de Dado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DICE_TYPES.map((d) => (
              <Button
                key={d}
                onClick={() => setDiceType(d)}
                variant={diceType === d ? "default" : "outline"}
                className={diceType === d ? "bg-amber-500 hover:bg-amber-600 text-slate-900" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
              >
                d{d}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-amber-500 font-serif">Nº de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => setNumDice(Math.max(1, numDice - 1))}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                −
              </Button>
              <span className="text-3xl font-bold text-amber-500">{numDice}</span>
              <Button
                onClick={() => setNumDice(Math.min(20, numDice + 1))}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-amber-500 font-serif">Bônus Individual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => setManualBonus(manualBonus - 1)}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                −
              </Button>
              <span className={`text-3xl font-bold ${totalBonus > 0 ? "text-green-400" : totalBonus < 0 ? "text-red-400" : "text-slate-400"}`}>
                {totalBonus >= 0 ? "+" : ""}{totalBonus}
              </span>
              <Button
                onClick={() => setManualBonus(manualBonus + 1)}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {characters && characters.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-amber-500 font-serif">Personagem</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Selecione um personagem" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id.toString()}>
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-amber-500 font-serif">Atributo</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Nenhum atributo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="none">Nenhum</SelectItem>
                  {ATTRIBUTES.map((attr) => (
                    <SelectItem key={attr.key} value={attr.key}>
                      {attr.short}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6 text-center">
          <div
            className="text-6xl font-bold font-serif mb-4 min-h-20 flex items-center justify-center"
            style={{
              color: lastRoll?.isCrit ? "#fbbf24" : lastRoll?.isFail ? "#ef4444" : "#f1f5f9",
              textShadow: lastRoll?.isCrit ? "0 0 24px #fbbf24" : "none",
            }}
          >
            {displayNum !== null ? displayNum : "−"}
          </div>
          {lastRoll && (
            <div className="text-sm text-slate-400 mb-4">
              {lastRoll.isCrit && <p className="text-amber-400 font-bold">⭐ CRÍTICO NATURAL! ⭐</p>}
              {lastRoll.isFail && <p className="text-red-400 font-bold">💀 FALHA CRÍTICA!</p>}
              <p>Dados: [{lastRoll.pureResults.join(", ")}]</p>
            </div>
          )}
          <Button
            onClick={handleRoll}
            disabled={rolling}
            size="lg"
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-lg"
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

      {diceHistory && diceHistory.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-amber-500 font-serif">Histórico de Rolagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {diceHistory.map((roll) => (
                <div key={roll.id} className="flex items-center gap-2 text-xs text-slate-400 bg-slate-700 p-2 rounded">
                  <span className="font-mono">{roll.numDice}d{roll.diceType}</span>
                  <span className="flex-1">[{(roll.pureResults as number[]).join(", ")}]</span>
                  <span className="font-bold text-slate-100">{roll.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
