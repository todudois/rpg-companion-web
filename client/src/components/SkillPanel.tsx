import { useState } from "react";
import type { Skill } from "./SkillEditor";

const SKILL_TYPES = {
  passiva: { icon: "🛡️", color: "#60a5fa", label: "PASSIVA" },
  ativa: { icon: "⚡", color: "#f59e0b", label: "ATIVA" },
  ataque: { icon: "⚔️", color: "#ef4444", label: "ATAQUE" },
  especial: { icon: "✨", color: "#a855f7", label: "ESPECIAL" },
};

interface SkillPanelProps {
  skills: Skill[];
}

export function SkillPanel({ skills }: SkillPanelProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!skills.length) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-5xl mb-3">⚡</div>
        <p className="text-sm">Nenhuma habilidade</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {skills.map((skill) => {
        const skillType = SKILL_TYPES[skill.type];
        const isExpanded = expandedId === skill.id;

        return (
          <div
            key={skill.id}
            onClick={() => setExpandedId(isExpanded ? null : skill.id)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-3 cursor-pointer transition-colors hover:border-slate-600"
            style={{
              borderColor: isExpanded ? skillType.color : undefined,
              borderWidth: isExpanded ? "2px" : "1px",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{skillType.icon}</span>
              <span className="font-bold flex-1 text-white">{skill.name}</span>
              <span
                className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{
                  backgroundColor: "#0f172a",
                  color: skillType.color,
                }}
              >
                {skillType.label}
              </span>
              <span className="text-slate-500 text-xs">
                {isExpanded ? "▲" : "▼"}
              </span>
            </div>

            {(skill.damage || skill.cost || skill.cooldown) && (
              <div className="flex gap-3 mt-2 flex-wrap text-xs">
                {skill.damage && (
                  <span className="text-red-400">⚔️ {skill.damage}</span>
                )}
                {skill.cost && (
                  <span className="text-blue-400">💧 {skill.cost}</span>
                )}
                {skill.cooldown && (
                  <span className="text-slate-400">⏱️ {skill.cooldown}</span>
                )}
              </div>
            )}

            {isExpanded && skill.description && (
              <div
                className="mt-3 p-2 rounded-lg text-xs text-slate-400 whitespace-pre-line border-l-2"
                style={{
                  backgroundColor: "#0f172a",
                  borderColor: skillType.color,
                }}
              >
                {skill.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
