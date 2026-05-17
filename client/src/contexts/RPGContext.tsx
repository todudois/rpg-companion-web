import React, { createContext, useContext, useState, useEffect } from "react";

interface RPGContextType {
  activeCharacterId: number | null;
  setActiveCharacterId: (id: number | null) => void;
  activeRole: "unassigned" | "mestre" | "jogador" | "espectador" | "indefinido";
  setActiveRole: (role: "unassigned" | "mestre" | "jogador" | "espectador" | "indefinido") => void;
  activeMasterId: number | null;
  setActiveMasterId: (id: number | null) => void;
  activeLobbyId: number | null;
  setActiveLobbyId: (id: number | null) => void;
  isLobbyCreator: boolean;
  setIsLobbyCreator: (isCreator: boolean) => void;
}

const RPGContext = createContext<RPGContextType | undefined>(undefined);

export function RPGProvider({ children }: { children: React.ReactNode }) {
  const [activeCharacterId, setActiveCharacterId] = useState<number | null>(() => {
    const saved = localStorage.getItem("rpg_activeCharacterId");
    return saved ? parseInt(saved) : null;
  });

  const [activeRole, setActiveRole] = useState<"unassigned" | "mestre" | "jogador" | "espectador" | "indefinido">(() => {
    const saved = localStorage.getItem("rpg_activeRole");
    return (saved as any) || "unassigned";
  });

  const [activeMasterId, setActiveMasterId] = useState<number | null>(() => {
    const saved = localStorage.getItem("rpg_activeMasterId");
    return saved ? parseInt(saved) : null;
  });

  const [activeLobbyId, setActiveLobbyId] = useState<number | null>(() => {
    const saved = localStorage.getItem("rpg_activeLobbyId");
    return saved ? parseInt(saved) : null;
  });

  const [isLobbyCreator, setIsLobbyCreator] = useState<boolean>(() => {
    const saved = localStorage.getItem("rpg_isLobbyCreator");
    return saved === "true";
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

  useEffect(() => {
    localStorage.setItem("rpg_activeLobbyId", activeLobbyId?.toString() || "");
  }, [activeLobbyId]);

  useEffect(() => {
    localStorage.setItem("rpg_isLobbyCreator", isLobbyCreator.toString());
  }, [isLobbyCreator]);

  return (
    <RPGContext.Provider value={{ activeCharacterId, setActiveCharacterId, activeRole, setActiveRole, activeMasterId, setActiveMasterId, activeLobbyId, setActiveLobbyId, isLobbyCreator, setIsLobbyCreator }}>
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
