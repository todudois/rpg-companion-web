import React, { createContext, useContext, useState, useEffect } from "react";

interface RPGContextType {
  activeCharacterId: number | null;
  setActiveCharacterId: (id: number | null) => void;
  activeRole: "unassigned" | "mestre" | "jogador";
  setActiveRole: (role: "unassigned" | "mestre" | "jogador") => void;
  activeMasterId: number | null;
  setActiveMasterId: (id: number | null) => void;
}

const RPGContext = createContext<RPGContextType | undefined>(undefined);

export function RPGProvider({ children }: { children: React.ReactNode }) {
  const [activeCharacterId, setActiveCharacterId] = useState<number | null>(() => {
    const saved = localStorage.getItem("rpg_activeCharacterId");
    return saved ? parseInt(saved) : null;
  });

  const [activeRole, setActiveRole] = useState<"unassigned" | "mestre" | "jogador">(() => {
    const saved = localStorage.getItem("rpg_activeRole");
    return (saved as any) || "unassigned";
  });

  const [activeMasterId, setActiveMasterId] = useState<number | null>(() => {
    const saved = localStorage.getItem("rpg_activeMasterId");
    return saved ? parseInt(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("rpg_activeCharacterId", activeCharacterId?.toString() || "");
  }, [activeCharacterId]);

  useEffect(() => {
    localStorage.setItem("rpg_activeRole", activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem("rpg_activeMasterId", activeMasterId?.toString() || "");
  }, [activeMasterId]);

  return (
    <RPGContext.Provider value={{ activeCharacterId, setActiveCharacterId, activeRole, setActiveRole, activeMasterId, setActiveMasterId }}>
      {children}
    </RPGContext.Provider>
  );
}

export function useRPG() {
  const context = useContext(RPGContext);
  if (!context) {
    throw new Error("useRPG must be used within RPGProvider");
  }
  return context;
}
