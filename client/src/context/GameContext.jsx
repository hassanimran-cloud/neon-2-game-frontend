import { createContext, useContext } from "react";
import { useGameSocket } from "../hooks/useGameSocket";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const value = useGameSocket();
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
