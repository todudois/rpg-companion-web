import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useRPG } from "@/contexts/RPGContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users, Crown, Sword, ChevronDown, ChevronUp } from "lucide-react";

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
}

export default function MasterScreenPage({ readOnly = false }: MasterScreenPageProps) {
  const { user } = useAuth();
  const { activeMasterId, activeRole } = useRPG();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const { data: savedCanvas, refetch } = trpc.rpg.masterCanvas.get.useQuery(
    { masterId: readOnly ? activeMasterId || undefined : undefined }
  );
  const { data: allUsers } = trpc.rpg.session.getUsers.useQuery(
    { lobbyId: activeMasterId || 0 },
    { enabled: !!activeMasterId }
  );
  const saveCanvasMutation = trpc.rpg.masterCanvas.save.useMutation();

  const [drawTool, setDrawTool] = useState<"pen" | "eraser" | "select">("pen");
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [showParticipants, setShowParticipants] = useState(true);
  const [drawableImages, setDrawableImages] = useState<DrawableImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [resizeMode, setResizeMode] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function to avoid too many requests
  const saveCanvasDebounced = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveCanvas();
    }, 500); // Wait 500ms after last action before saving
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
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
    const timeoutId = setTimeout(() => resizeCanvas(), 0);

    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize events
      clearTimeout(timeoutId);
      setTimeout(() => resizeCanvas(), 0);
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [savedCanvas, isLoading]);

  // Redraw canvas with images
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redraw background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all images
    drawableImages.forEach((img) => {
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
  }, [drawableImages, selectedImageId, readOnly]);

  // Jogadores atualizam o canvas a cada 2 segundos
  useEffect(() => {
    if (!readOnly) return;

    // Jogadores atualizam o canvas a cada 1 segundo para sincronizacao mais rapida
    const interval = setInterval(() => {
      refetch();
    }, 1000);

    return () => clearInterval(interval);
  }, [readOnly, refetch]);

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
      }
    } else {
      setIsDrawing(true);
      setLastPos(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent);

    if (drawTool === "select" && draggedImageId) {
      const img = drawableImages.find((i) => i.id === draggedImageId);
      if (!img) return;

      if (resizeMode === "drag") {
        const dx = pos.x - (lastPos?.x || pos.x);
        const dy = pos.y - (lastPos?.y || pos.y);
        setDrawableImages(
          drawableImages.map((i) =>
            i.id === draggedImageId ? { ...i, x: i.x + dx, y: i.y + dy } : i
          )
        );
      } else if (resizeMode === "resize") {
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

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (drawTool === "eraser") {
        ctx.clearRect(lastPos.x - brushSize / 2, lastPos.y - brushSize / 2, brushSize, brushSize);
      } else {
        ctx.strokeStyle = drawColor;
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }

      setLastPos(pos);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDraggedImageId(null);
    setResizeMode(null);
    setLastPos(null);
    // Auto-save canvas after drawing
    saveCanvasDebounced();
  };

  const handleClearCanvas = () => {
    if (!confirm("Tem certeza que deseja limpar o canvas?")) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDrawableImages([]);
    setSelectedImageId(null);
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
        };
        setDrawableImages([...drawableImages, newImage]);
        setSelectedImageId(newImage.id);
        setDrawTool("select");
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
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.drawImage(canvas, 0, 0);

      drawableImages.forEach((img) => {
        tempCtx.drawImage(img.img, img.x, img.y, img.width, img.height);
      });

      const canvasData = tempCanvas.toDataURL("image/png");
      await saveCanvasMutation.mutateAsync({
        canvasData,
      });
      // Only show toast if it's a manual save (not auto-save)
      if (!saveTimeoutRef.current) {
        toast.success("Canvas salvo com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar canvas");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 flex flex-col h-full">
      {/* Controls Card */}
      <Card className="bg-slate-800 border-slate-700 flex-shrink-0">
        <CardContent className="pt-4">
          {!readOnly ? (
            <div className="space-y-3 sm:space-y-4">
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
                      ? "bg-amber-500 hover:bg-amber-600 text-slate-900"
                      : "border border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Borracha
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
                  <button
                  onClick={() => {
                    setDrawableImages(drawableImages.filter(img => img.id !== selectedImageId));
                    setSelectedImageId(null);
                    toast.success("Imagem deletada!");
                    // Auto-save after deleting image
                    saveCanvasDebounced();
                  }}
                    className="px-3 py-2 rounded text-sm font-medium border border-red-600 text-red-400 hover:bg-red-900 transition-colors flex-shrink-0"
                  >
                    🗑️ Deletar Imagem
                  </button>
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
                      const ctx = canvas?.getContext("2d");
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
        <Card className="w-full lg:w-64 bg-slate-800 border-slate-700 flex flex-col">
          <CardContent className="pt-4 flex flex-col h-full overflow-hidden">
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
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{participant.userName || "Desconhecido"}</p>
                          <p className="text-xs text-slate-300 truncate">
                            {participant.role === "mestre" && "👑 Mestre"}
                            {participant.role === "jogador" && participant.characterName && `🛡️ ${participant.characterName}`}
                            {participant.role === "jogador" && !participant.characterName && "🛡️ Jogador"}
                            {participant.role === "espectador" && "👁️ Espectador"}
                            {participant.role === "indefinido" && "❓ Indefinido"}
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
