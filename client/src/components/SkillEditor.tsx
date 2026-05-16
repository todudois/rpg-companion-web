import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Skill {
  id: number;
  name: string;
  type: "passiva" | "ativa" | "ataque" | "especial";
  cost?: string;
  damage?: string;
  cooldown?: string;
  description?: string;
}

const SKILL_TYPES = {
  passiva: { icon: "🛡️", color: "#60a5fa", label: "Passiva" },
  ativa: { icon: "⚡", color: "#f59e0b", label: "Ativa" },
  ataque: { icon: "⚔️", color: "#ef4444", label: "Ataque" },
  especial: { icon: "✨", color: "#a855f7", label: "Especial" },
};

interface SkillEditorProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
  isReadOnly?: boolean;
}

export function SkillEditor({
  skills = [],
  onChange,
  isReadOnly = false,
}: SkillEditorProps) {
  const addSkill = () => {
    const newSkill: Skill = {
      id: Math.random(),
      name: "",
      type: "ativa",
      cost: "",
      damage: "",
      cooldown: "",
      description: "",
    };
    onChange([...skills, newSkill]);
  };

  const updateSkill = (id: number, field: keyof Skill, value: any) => {
    onChange(
      skills.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const deleteSkill = (id: number) => {
    onChange(skills.filter((s) => s.id !== id));
  };

  if (isReadOnly && !skills.length) {
    return (
      <div className="text-center py-8 text-slate-400">
        <div className="text-4xl mb-2">⚡</div>
        <p className="text-sm">Nenhuma habilidade</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-amber-400 text-sm font-bold">
          ⚡ Habilidades ({skills.length})
        </label>
        {!isReadOnly && (
          <Button
            size="sm"
            variant="outline"
            onClick={addSkill}
            className="text-blue-400 border-blue-900 hover:bg-blue-950"
          >
            + Add
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2"
          >
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-slate-400 font-bold block mb-1">
                  NOME
                </label>
                <Input
                  placeholder="Nome da habilidade"
                  value={skill.name}
                  onChange={(e) => updateSkill(skill.id, "name", e.target.value)}
                  disabled={isReadOnly}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="w-24">
                <label className="text-xs text-slate-400 font-bold block mb-1">
                  TIPO
                </label>
                <Select
                  value={skill.type}
                  onValueChange={(value) =>
                    updateSkill(
                      skill.id,
                      "type",
                      value as "passiva" | "ativa" | "ataque" | "especial"
                    )
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SKILL_TYPES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isReadOnly && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteSkill(skill.id)}
                  className="text-red-400 hover:bg-red-950"
                >
                  ×
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">
                  CUSTO
                </label>
                <Input
                  placeholder="60 Vigor"
                  value={skill.cost || ""}
                  onChange={(e) => updateSkill(skill.id, "cost", e.target.value)}
                  disabled={isReadOnly}
                  className="bg-slate-800 border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">
                  DANO
                </label>
                <Input
                  placeholder="2d6+2"
                  value={skill.damage || ""}
                  onChange={(e) =>
                    updateSkill(skill.id, "damage", e.target.value)
                  }
                  disabled={isReadOnly}
                  className="bg-slate-800 border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">
                  RECARGA
                </label>
                <Input
                  placeholder="3 turnos"
                  value={skill.cooldown || ""}
                  onChange={(e) =>
                    updateSkill(skill.id, "cooldown", e.target.value)
                  }
                  disabled={isReadOnly}
                  className="bg-slate-800 border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">
                DESCRIÇÃO
              </label>
              <Textarea
                placeholder="Descrição da habilidade..."
                value={skill.description || ""}
                onChange={(e) =>
                  updateSkill(skill.id, "description", e.target.value)
                }
                disabled={isReadOnly}
                className="bg-slate-800 border-slate-700 text-white text-xs min-h-12 resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      {!skills.length && !isReadOnly && (
        <div className="text-center text-slate-500 text-xs py-4">
          Nenhuma habilidade. Clique em "+ Add" para criar uma.
        </div>
      )}
    </div>
  );
}
