import React, { createContext, useContext, useRef } from "react";

interface CanvasCache {
  drawingsImageData: ImageData | null;
  imagesData: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;
    imageDataUrl: string;
  }>;
  timestamp: number;
}

interface CanvasCacheContextType {
  cache: CanvasCache | null;
  setCache: (cache: CanvasCache | null) => void;
  clearCache: () => void;
}

const CanvasCacheContext = createContext<CanvasCacheContextType | undefined>(undefined);

export const CanvasCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cacheRef = useRef<CanvasCache | null>(null);

  const setCache = (cache: CanvasCache | null) => {
    cacheRef.current = cache;
  };

  const clearCache = () => {
    cacheRef.current = null;
  };

  return (
    <CanvasCacheContext.Provider value={{ cache: cacheRef.current, setCache, clearCache }}>
      {children}
    </CanvasCacheContext.Provider>
  );
};

export const useCanvasCache = () => {
  const context = useContext(CanvasCacheContext);
  if (!context) {
    throw new Error("useCanvasCache must be used within CanvasCacheProvider");
  }
  return context;
};
