import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function MasterScreenPage({ readOnly = false }: MasterScreenPageProps) {
  const { user } = useAuth();
  const { activeMasterId, activeRole } = useRPG();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: savedCanvas, refetch } = trpc.rpg.masterCanvas.get.useQuery(
    { masterId: readOnly ? activeMasterId || undefined : undefined }
  );
  const { data: allUsers } = trpc.rpg.session.getUsers.useQuery(
    { lobbyId: activeMasterId || 0 },
    { enabled: !!activeMasterId }
  );
  const saveCanvasMutation = trpc.rpg.masterCanvas.save.useMutation();

  const [drawTool, setDrawTool] = useState<"pen" | "eraser">("pen");
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [showParticipants, setShowParticipants] = useState(true);

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

  // Jogadores atualizam o canvas a cada 2 segundos
  useEffect(() => {
    if (!readOnly) return;

    const interval = setInterval(() => {
      refetch();
    }, 2000);

    return () => clearInterval(interval);
  }, [readOnly, refetch]);

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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    setIsDrawing(true);
    setLastPos(getPos(e.nativeEvent));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const pos = getPos(e.nativeEvent);
    if (!lastPos) {
      setLastPos(pos);
      return;
    }

    if (drawTool === "pen") {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (drawTool === "eraser") {
      ctx.clearRect(pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize);
    }

    setLastPos(pos);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  const handleSaveCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const canvasData = canvas.toDataURL("image/png");
      await saveCanvasMutation.mutateAsync({
        canvasData,
      });
      toast.success("Canvas salvo com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar canvas");
    }
  };

  const handleClearCanvas = () => {
    if (!confirm("Tem certeza que deseja limpar o canvas?")) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleLoadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
                        {participant.role === "mestre" && (
                          <Crown className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-4 text-xs">Nenhum participante</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
