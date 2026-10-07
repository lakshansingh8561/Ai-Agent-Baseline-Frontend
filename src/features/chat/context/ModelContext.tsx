import React, { createContext, useContext, useState } from "react";
import { AVAILABLE_MODELS, type AIModel } from "../types/models.ts";

interface ModelContextType {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  selectModelById: (id: string) => void;
}

const STORAGE_KEY = "lumina_selected_model_id";

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedModel, setSelectedModelState] = useState<AIModel>(() => {
    try {
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) {
        const found = AVAILABLE_MODELS.find((m) => m.id === storedId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return AVAILABLE_MODELS[0];
  });

  const setSelectedModel = (model: AIModel) => {
    setSelectedModelState(model);
    try {
      localStorage.setItem(STORAGE_KEY, model.id);
    } catch {
      // ignore
    }
  };

  const selectModelById = (id: string) => {
    const found = AVAILABLE_MODELS.find((m) => m.id === id);
    if (found) {
      setSelectedModel(found);
    }
  };

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel, selectModelById }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = (): ModelContextType => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
};
