
import { createContext, useContext } from "react";
import { AgoraContextType } from "../types/agoraContext.types";

export const AgoraContext = createContext<AgoraContextType | undefined>(undefined);

export const useAgora = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error("useAgora must be used within an AgoraProvider");
  }
  return context;
};
