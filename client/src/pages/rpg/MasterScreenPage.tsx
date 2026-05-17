import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useRPG } from "@/contexts/RPGContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users, Crown, Sword, ChevronDown, ChevronUp, RotateCcw, RotateCw } from "lucide-react";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#ffffff", "#64748b"];

interface MasterScreenPageProps {
  readOnly?: boolean;
}

interface DrawableImage {
  id: string;
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  url?: string; // Data URL or S3 URL for persistence
}

interface CanvasState {
  canvasData: string;
  images: DrawableImage[];
}

export default function MasterScreenPage({ readOnly = false }: MasterScreenPageProps) {
  const { user } = useAuth();
  const { activeMasterId, activeRole, activeLobbyId } = useRPG();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const { data: savedCanvas, refetch } = trpc.rpg.masterCanvas.get.useQuery(
    { masterId: readOnly ? activeMasterId || undefined : undefined, lobbyId: activeLobbyId || undefined },
    { enabled: !!activeLobbyId && (readOnly ? !!activeMasterId : true) }
  );
  const { data: allUsers } = trpc.rpg.session.getUsers.useQuery(
    { lobbyId: activeLobbyId! },
    { enabled: !!activeLobbyId }
  );
  const saveCanvasMutation = trpc.rpg.masterCanvas.save.useMutation();

  const [drawTool, setDrawTool] = useState<"pen" | "eraser" | "select" | "rectangle" | "circle" | "line">("pen");
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [showParticipants, setShowParticipants] = useState(true);
  const [drawableImages, setDrawableImages] = useState<DrawableImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [resizeMode, setResizeMode] = useState<string | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hadDrawingRef = useRef<boolean>(false);
  const isMovingImageRef = useRef<boolean>(false);
  const drawingsCanvasRef = useRef<HTMLCanvasElement | null>(null); // Separate canvas for drawings only (pen/eraser)
  const cleanDrawingsRef = useRef<ImageData | null>(null); // Bitmap dos desenhos (sem imagens)
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save state to history
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasData = canvas.toDataURL("image/png");
    const newState: CanvasState = {
      canvasData,
      images: drawableImages
    };

    // Remove any states after current index (if user made changes after undo)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    restoreState(history[newIndex]);
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    restoreState(history[newIndex]);
  };

  // Restore canvas to a previous state
  const restoreState = (state: CanvasState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      setDrawableImages(state.images);
    };
    img.src = state.canvasData;
  };

  // Debounced history save
  const saveToHistoryDebounced = () => {
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }
    historyTimeoutRef.current = setTimeout(() => {
      saveToHistory();
    }, 300);
  };

  // Helper function to draw geometric shapes
  const drawGeometricShape = (ctx: CanvasRenderingContext2D, tool: string, start: { x: number; y: number } | null, end: { x: number; y: number }, color: string, size: number) => {
    if (!start) return;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    
    if (tool === "rectangle") {
      const width = end.x - start.x;
      const height = end.y - start.y;
      ctx.strokeRect(start.x, start.y, width, height);
    } else if (tool === "circle") {
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  };

  // Debounced save function to avoid too many requests
  const saveCanvasDebounced = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Always schedule save - handleSaveCanvas will check if there's content
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveCanvas();
    }, 500); // Wait 500ms after last action before saving
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      // Use clientWidth/clientHeight instead of getBoundingClientRect for more reliable sizing
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Only resize if dimensions actually changed
      if (canvas.width === width && canvas.height === height && !isLoading) {
        return;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Initialize drawings canvas if not exists
      if (!drawingsCanvasRef.current) {
        drawingsCanvasRef.current = document.createElement('canvas');
        drawingsCanvasRef.current.width = width;
        drawingsCanvasRef.current.height = height;
      } else {
        drawingsCanvasRef.current.width = width;
        drawingsCanvasRef.current.height = height;
      }
      
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (savedCanvas?.canvasData && isLoading) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          setIsLoading(false);
        };
        img.onerror = () => {
          setIsLoading(false);
        };
        img.src = savedCanvas.canvasData;
      } else if (isLoading) {
        setIsLoading(false);
      }
    };

    // Initial resize with a small delay to ensure DOM is fully rendered
    resizeTimeoutRef.current = setTimeout(() => resizeCanvas(), 0);

    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize events properly
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => resizeCanvas(), 50);
    });
    resizeObserver.observe(container);

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [isLoading, readOnly]);

  // Redraw canvas with images and saved canvas data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // If we're moving/resizing, use requestAnimationFrame for smooth animation
    if (isMovingImageRef.current && drawingsCanvasRef.current) {
      const animationFrameId = requestAnimationFrame(() => {
        // Clear canvas
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Restore drawings from drawingsCanvas
        const drawingsData = drawingsCanvasRef.current!.getContext("2d", { alpha: true })?.getImageData(0, 0, canvas.width, canvas.height);
        if (drawingsData) {
          ctx.putImageData(drawingsData, 0, 0);
        }
        
        // Redraw all images at their current positions
        const sortedImages = [...drawableImages].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        sortedImages.forEach((img) => {
          ctx.drawImage(img.img, img.x, img.y, img.width, img.height);

          // Draw selection box if selected
          if (img.id === selectedImageId && !readOnly) {
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2;
            ctx.strokeRect(img.x, img.y, img.width, img.height);

            // Draw resize handle
            const handleSize = 10;
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(img.x + img.width - handleSize, img.y + img.height - handleSize, handleSize, handleSize);
          }
        });
      });

      return () => cancelAnimationFrame(animationFrameId);
    }

    // Normal redraw (not moving) - full canvas refresh
    const drawContent = () => {
      // Clear and redraw: background + images + selection
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw images on top
      const sortedImages = [...drawableImages].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      sortedImages.forEach((img) => {
        ctx.drawImage(img.img, img.x, img.y, img.width, img.height);

        // Draw selection box if selected
        if (img.id === selectedImageId && !readOnly) {
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2;
          ctx.strokeRect(img.x, img.y, img.width, img.height);

          // Draw resize handle
          const handleSize = 10;
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(img.x + img.width - handleSize, img.y + img.height - handleSize, handleSize, handleSize);
        }
      });
      
      // Copy current canvas to drawingsCanvas for use during movement
      if (drawingsCanvasRef.current) {
        const drawCtx = drawingsCanvasRef.current.getContext("2d", { alpha: true });
        if (drawCtx) {
          // Copy the entire canvas (with drawings and images)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          drawCtx.putImageData(imageData, 0, 0);
          cleanDrawingsRef.current = imageData;
        }
      }
    };

    drawContent();
  }, [drawableImages, selectedImageId, readOnly, savedCanvas?.canvasData, isMovingImageRef]);

  // Load initial canvas data for players only
  useEffect(() => {
    if (!readOnly || !savedCanvas?.canvasData) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      // Draw images on top of the saved canvas
      const sortedImages = [...drawableImages].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      sortedImages.forEach((img) => {
        ctx.drawImage(img.img, img.x, img.y, img.width, img.height);
      });
    };
    img.src = savedCanvas.canvasData;
  }, [readOnly, savedCanvas?.canvasData, drawableImages]);

  // Load images from savedCanvas.imagesData when canvas is fetched
  useEffect(() => {
    if (!savedCanvas?.imagesData) return;
    
    try {
      const imagesMetadata = JSON.parse(savedCanvas.imagesData);
      const loadedImages: DrawableImage[] = [];
      let loadedCount = 0;
      
      imagesMetadata.forEach((metadata: any) => {
        if (metadata.url) {
          const img = new Image();
          img.onload = () => {
            loadedImages.push({
              id: metadata.id,
              img,
              x: metadata.x,
              y: metadata.y,
              width: metadata.width,
              height: metadata.height,
              zIndex: metadata.zIndex || 0,
              url: metadata.url,
            });
            loadedCount++;
            
            if (loadedCount === imagesMetadata.length) {
              setDrawableImages(loadedImages);
            }
          };
          img.onerror = () => {
            loadedCount++;
            if (loadedCount === imagesMetadata.length) {
              setDrawableImages(loadedImages);
            }
          };
          img.src = metadata.url;
        }
      });
      
      if (imagesMetadata.length === 0) {
        setDrawableImages([]);
      }
    } catch (error) {
      console.error("Failed to parse imagesData:", error);
    }
  }, [savedCanvas?.imagesData]);

  // Jogadores atualizam o canvas a cada 2 segundos
  useEffect(() => {
    if (!readOnly || !activeLobbyId) return;

    // Jogadores atualizam o canvas a cada 1 segundo para sincronizacao mais rapida
    const interval = setInterval(() => {
      refetch();
    }, 1000);

    return () => clearInterval(interval);
  }, [readOnly, refetch, activeLobbyId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const getPos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
    };
  };

  const getImageAtPos = (x: number, y: number): string | null => {
    for (let i = drawableImages.length - 1; i >= 0; i--) {
      const img = drawableImages[i];
      if (x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height) {
        return img.id;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent);

    if (drawTool === "select") {
      const imageId = getImageAtPos(pos.x, pos.y);
      if (imageId) {
        setSelectedImageId(imageId);
        setDraggedImageId(imageId);
        
        // Check if clicking on resize handle
        const img = drawableImages.find((i) => i.id === imageId);
        if (img) {
          const handleSize = 10;
          if (
            pos.x >= img.x + img.width - handleSize &&
            pos.x <= img.x + img.width &&
            pos.y >= img.y + img.height - handleSize &&
            pos.y <= img.y + img.height
          ) {
            setResizeMode("resize");
          } else {
            setResizeMode("drag");
          }
        }
      } else {
        setSelectedImageId(null);
        // Save canvas when deselecting image
        saveCanvasDebounced();
      }
    } else {
      setIsDrawing(true);
      hadDrawingRef.current = true; // Mark that drawing started
      setLastPos(pos);
      setStartPos(pos); // Store initial position for geometric shapes
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent);

    if (drawTool === "select" && draggedImageId) {
      const img = drawableImages.find((i) => i.id === draggedImageId);
      if (!img) return;

      if (resizeMode === "drag") {
        isMovingImageRef.current = true;
        const dx = pos.x - (lastPos?.x || pos.x);
        const dy = pos.y - (lastPos?.y || pos.y);
        setDrawableImages(
          drawableImages.map((i) =>
            i.id === draggedImageId ? { ...i, x: i.x + dx, y: i.y + dy } : i
          )
        );
      } else if (resizeMode === "resize") {
        isMovingImageRef.current = true;
        const newWidth = Math.max(20, pos.x - img.x);
        const newHeight = Math.max(20, pos.y - img.y);
        setDrawableImages(
          drawableImages.map((i) =>
            i.id === draggedImageId ? { ...i, width: newWidth, height: newHeight } : i
          )
        );
      }
      setLastPos(pos);
      return;
    } else if (isDrawing && lastPos) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      // For geometric shapes, redraw the canvas to clear previous preview
      if (["rectangle", "circle", "line"].includes(drawTool)) {
        // Clear canvas and redraw from saved state
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Redraw saved canvas if available
        if (savedCanvas?.canvasData) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            // Redraw images and preview
            const sortedImages = [...drawableImages].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
            sortedImages.forEach((drawImg) => {
              ctx.drawImage(drawImg.img, drawImg.x, drawImg.y, drawImg.width, drawImg.height);
            });
            drawGeometricShape(ctx, drawTool, startPos, pos, drawColor, brushSize);
          };
          img.src = savedCanvas.canvasData;
        } else {
          // If no saved canvas, just redraw images and preview
          const sortedImages = [...drawableImages].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
          sortedImages.forEach((drawImg) => {
            ctx.drawImage(drawImg.img, drawImg.x, drawImg.y, drawImg.width, drawImg.height);
          });
          drawGeometricShape(ctx, drawTool, startPos, pos, drawColor, brushSize);
        }
      } else {
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (drawTool === "eraser") {
          // Use destination-out to create a proper eraser effect
          const prevComposite = ctx.globalCompositeOperation;
          ctx.globalCompositeOperation = "destination-out";
          ctx.strokeStyle = "rgba(0,0,0,1)";
          ctx.beginPath();
          ctx.moveTo(lastPos.x, lastPos.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          ctx.globalCompositeOperation = prevComposite;
          
          // Also draw on drawings canvas
          if (drawingsCanvasRef.current) {
            const drawCtx = drawingsCanvasRef.current.getContext("2d", { alpha: true });
            if (drawCtx) {
              const prevComposite2 = drawCtx.globalCompositeOperation;
              drawCtx.globalCompositeOperation = "destination-out";
              drawCtx.strokeStyle = "rgba(0,0,0,1)";
              drawCtx.lineWidth = brushSize;
              drawCtx.lineCap = "round";
              drawCtx.lineJoin = "round";
              drawCtx.beginPath();
              drawCtx.moveTo(lastPos.x, lastPos.y);
              drawCtx.lineTo(pos.x, pos.y);
              drawCtx.stroke();
              drawCtx.globalCompositeOperation = prevComposite2;
            }
          }
        } else if (drawTool === "pen") {
          ctx.strokeStyle = drawColor;
          ctx.beginPath();
          ctx.moveTo(lastPos.x, lastPos.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          
          // Also draw on drawings canvas
          if (drawingsCanvasRef.current) {
            const drawCtx = drawingsCanvasRef.current.getContext("2d", { alpha: true });
            if (drawCtx) {
              drawCtx.strokeStyle = drawColor;
              drawCtx.lineWidth = brushSize;
              drawCtx.lineCap = "round";
              drawCtx.lineJoin = "round";
              drawCtx.beginPath();
              drawCtx.moveTo(lastPos.x, lastPos.y);
              drawCtx.lineTo(pos.x, pos.y);
              drawCtx.stroke();
            }
          }
        }
      }

      setLastPos(pos);
    }
  };

  const handleMouseUp = () => {
    isMovingImageRef.current = false;
    setIsDrawing(false);
    setDraggedImageId(null);
    setResizeMode(null);
    setLastPos(null);
    setStartPos(null);
    // Auto-save canvas after drawing
    if (hadDrawingRef.current) {
      saveCanvasDebounced();
      saveToHistoryDebounced();
      hadDrawingRef.current = false; // Reset for next drawing
    }
  };

  const handleClearCanvas = () => {
    if (!confirm("Tem certeza que deseja limpar o canvas?")) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

          const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;
        ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDrawableImages([]);
    setSelectedImageId(null);
    // Save to history and sync with players
    saveToHistory();
    saveCanvasDebounced();
  };

  const handleLoadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const centerX = Math.max(50, canvas.width / 2 - 100);
        const centerY = Math.max(50, canvas.height / 2 - 100);
        
          const newImage: DrawableImage = {
          id: Date.now().toString(),
          img,
          x: centerX,
          y: centerY,
          width: Math.min(200, img.width),
          height: Math.min(200, img.height),
          zIndex: Math.max(...drawableImages.map(i => i.zIndex || 0), 0) + 1,
          url: e.target?.result as string, // Store data URL for persistence
        };
        setDrawableImages([...drawableImages, newImage]);
        setSelectedImageId(newImage.id);
        setDrawTool("select");
        // Auto-save after adding image
        hadDrawingRef.current = true;
        saveCanvasDebounced();
        saveToHistoryDebounced();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    if (imageFileRef.current) {
      imageFileRef.current.value = "";
    }
  };

  const handleSaveCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d", { alpha: true });
      if (!tempCtx) return;

      tempCtx.drawImage(canvas, 0, 0);

      drawableImages.forEach((img) => {
        tempCtx.drawImage(img.img, img.x, img.y, img.width, img.height);
      });

      const canvasData = tempCanvas.toDataURL("image/png");
      
      // Serialize image metadata
      const imagesData = JSON.stringify(
        drawableImages.map((img) => ({
          id: img.id,
          x: img.x,
          y: img.y,
          width: img.width,
          height: img.height,
          zIndex: img.zIndex || 0,
          url: img.url,
        }))
      );
      
      await saveCanvasMutation.mutateAsync({
        canvasData,
        imagesData: imagesData.length > 2 ? imagesData : undefined,
        lobbyId: activeLobbyId || 0,
      });
      // Only show toast if it's a manual save (not auto-save)
      if (!saveTimeoutRef.current) {
        toast.success("Canvas salvo com sucesso!");
      }
    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : error?.message || "Erro ao salvar canvas";
      toast.error(String(errorMessage));
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 flex flex-col h-full">
      {/* Controls Card */}
      <Card className="bg-slate-800 border-slate-700 flex-shrink-0">
        <CardContent className="pt-4">
          {!readOnly ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Undo/Redo Row */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="px-3 py-2 rounded text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  title="Desfazer (Ctrl+Z)"
                >
                  <RotateCcw className="w-4 h-4 inline mr-1" />
                  Desfazer
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="px-3 py-2 rounded text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  title="Refazer (Ctrl+Y)"
                >
                  <RotateCw className="w-4 h-4 inline mr-1" />
                  Refazer
                </button>
              </div>

              {/* Tools Row */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDrawTool("pen")}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex-shrink-0 ${
                    drawTool === "pen"
                      ? "bg-amber-500 hover:bg-amber-600 text-slate-900"
                      : "border border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Caneta
                </button>
                <button
                  onClick={() => setDrawTool("eraser")}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex-shrink-0 ${
                    drawTool === "eraser"
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "border border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  🧹 Borracha
                </button>
                <button
                  onClick={() => setDrawTool("rectangle")}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex-shrink-0 ${
                    drawTool === "rectangle"
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : "border border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  ▭ Retângulo
                </button>
                <button
                  onClick={() => setDrawTool("circle")}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex-shrink-0 ${
                    drawTool === "circle"
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : "border border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  ● Círculo
                </button>
                <button
                  onClick={() => setDrawTool("line")}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex-shrink-0 ${
                    drawTool === "line"
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : "border border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  / Linha
                </button>
                <button
                  onClick={() => setDrawTool("select")}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex-shrink-0 ${
                    drawTool === "select"
                      ? "bg-amber-500 hover:bg-amber-600 text-slate-900"
                      : "border border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Selecionar
                </button>
              </div>

              {/* Colors */}
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setDrawColor(color);
                      setDrawTool("pen");
                    }}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0"
                    style={{
                      backgroundColor: color,
                      borderColor: drawColor === color ? "white" : "#475569",
                    }}
                  />
                ))}
              </div>

              {/* Brush Size */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm text-slate-400 flex-shrink-0">Tamanho:</span>
                <Input
                  type="range"
                  min="2"
                  max="24"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-20 sm:w-24 bg-slate-700 border-slate-600 flex-shrink-0"
                />
                <span className="text-xs sm:text-sm text-slate-400 w-6 flex-shrink-0">{brushSize}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => imageFileRef.current?.click()}
                  className="px-3 py-2 rounded text-sm font-medium border border-blue-600 text-blue-400 hover:bg-blue-900 transition-colors flex-shrink-0"
                >
                  🖼️ Adicionar Imagem
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-3 py-2 rounded text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors flex-shrink-0"
                >
                  Carregar
                </button>
                <button
                  onClick={handleClearCanvas}
                  className="px-3 py-2 rounded text-sm font-medium border border-red-600 text-red-400 hover:bg-red-900 transition-colors flex-shrink-0"
                >
                  Limpar
                </button>
                {selectedImageId && (
                  <>
                    <button
                      onClick={() => {
                        setDrawableImages(drawableImages.map(img => 
                          img.id === selectedImageId 
                            ? { ...img, zIndex: Math.max(...drawableImages.map(i => i.zIndex || 0)) + 1 }
                            : img
                        ));
                        saveToHistory();
                        saveCanvasDebounced();
                      }}
                      className="px-3 py-2 rounded text-sm font-medium border border-blue-600 text-blue-400 hover:bg-blue-900 transition-colors flex-shrink-0"
                      title="Trazer para frente"
                    >
                      ⬆️ Frente
                    </button>
                    <button
                      onClick={() => {
                        setDrawableImages(drawableImages.map(img => 
                          img.id === selectedImageId 
                            ? { ...img, zIndex: Math.min(...drawableImages.map(i => i.zIndex || 0)) - 1 }
                            : img
                        ));
                        saveToHistory();
                        saveCanvasDebounced();
                      }}
                      className="px-3 py-2 rounded text-sm font-medium border border-blue-600 text-blue-400 hover:bg-blue-900 transition-colors flex-shrink-0"
                      title="Enviar para trás"
                    >
                      ⬇️ Trás
                    </button>
                    <button
                      onClick={() => {
                        setDrawableImages(drawableImages.filter(img => img.id !== selectedImageId));
                        setSelectedImageId(null);
                        toast.success("Imagem deletada!");
                        // Auto-save after deleting image
                        saveCanvasDebounced();
                        // Save to history
                        saveToHistory();
                      }}
                      className="px-3 py-2 rounded text-sm font-medium border border-red-600 text-red-400 hover:bg-red-900 transition-colors flex-shrink-0"
                    >
                      🗑️ Deletar Imagem
                    </button>
                  </>
                )}
                <button
                  onClick={handleSaveCanvas}
                  disabled={saveCanvasMutation.isPending}
                  className="px-3 py-2 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {saveCanvasMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 inline mr-2" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </button>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const ctx = canvas?.getContext("2d", { alpha: true });
                      if (ctx && canvas) {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        // Auto-save after loading image
                        saveCanvasDebounced();
                      }
                    };
                    img.src = event.target?.result as string;
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <input
                ref={imageFileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleLoadImage}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 flex-wrap">
              <span className="text-xs sm:text-sm">
                🔒 Visualização (Atualiza a cada 2s)
              </span>
              <button
                onClick={() => refetch()}
                className="px-3 py-2 rounded text-xs sm:text-sm border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors flex-shrink-0"
              >
                Atualizar
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Canvas and Participants Container */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 sm:gap-4">
        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 h-full bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden relative"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
              <Loader2 className="animate-spin w-8 h-8 text-amber-500" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className={`w-full h-full ${readOnly ? "cursor-default" : "cursor-crosshair"} touch-none`}
            style={{ display: "block" }}
          />
        </div>

        {/* Participants Panel - Collapsible on Mobile */}
        <Card className="w-full lg:w-64 bg-slate-800 border-slate-700 flex flex-col max-h-full">
          <CardContent className="pt-4 flex flex-col h-full overflow-hidden max-h-full">
            {/* Header with toggle button */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                <h3 className="font-semibold text-slate-100 text-sm sm:text-base">Participantes</h3>
              </div>
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="lg:hidden p-1 hover:bg-slate-700 rounded flex-shrink-0"
              >
                {showParticipants ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Participants List */}
            {showParticipants && (
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {allUsers && allUsers.length > 0 ? (
                  allUsers.map((participant) => (
                    <div
                      key={participant.userId}
                      className={`p-2 rounded border text-xs sm:text-sm ${
                        participant.role === "mestre"
                          ? "bg-red-900 border-red-700"
                          : participant.role === "jogador"
                          ? "bg-blue-900 border-blue-700"
                          : "bg-purple-900 border-purple-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Character Avatar */}
                        {participant.role === "jogador" && participant.characterImageUrl ? (
                          <img
                            src={participant.characterImageUrl}
                            alt={participant.characterName || "Personagem"}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded border border-slate-400 object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded border border-slate-400 bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">
                              {participant.role === "mestre" && "👑"}
                              {participant.role === "jogador" && "🛡️"}
                              {participant.role === "espectador" && "👁️"}
                              {participant.role === "indefinido" && "❓"}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{participant.userName || "Desconhecido"}</p>
                          <p className="text-xs text-slate-300 truncate">
                            {participant.role === "mestre" && "Mestre"}
                            {participant.role === "jogador" && participant.characterName && participant.characterName}
                            {participant.role === "jogador" && !participant.characterName && "Jogador"}
                            {participant.role === "espectador" && "Espectador"}
                            {participant.role === "indefinido" && "Indefinido"}
                          </p>
                        </div>
                        {participant.role === "mestre" && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />}
                        {participant.role === "jogador" && <Sword className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Nenhum participante</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
