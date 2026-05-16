import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useRPG } from "@/contexts/RPGContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users, Crown, Sword } from "lucide-react";

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
    { masterId: activeMasterId || user?.id || 0 },
    { enabled: !!(activeMasterId || user?.id) }
  );
  const saveCanvasMutation = trpc.rpg.masterCanvas.save.useMutation();

  const [drawTool, setDrawTool] = useState<"pen" | "eraser">("pen");
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
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
      } else {
        setIsLoading(false);
      }
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
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

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDrawing(true);
    setLastPos(getPos(e.nativeEvent as any));
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    e.preventDefault();
    if (!isDrawing || !lastPos) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e.nativeEvent as any);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = drawTool === "eraser" ? "#111827" : drawColor;
    ctx.lineWidth = drawTool === "eraser" ? brushSize * 6 : brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    setLastPos(pos);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas!.width, canvas!.height);
  };

  const handleSaveCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasData = canvas.toDataURL("image/png");
    saveCanvasMutation.mutate(
      { canvasData },
      {
        onSuccess: () => {
          toast.success("Canvas salvo com sucesso!");
          setLastRefresh(Date.now());
        },
        onError: () => {
          toast.error("Erro ao salvar canvas");
        },
      }
    );
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
        if (!ctx || !canvas) return;

        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            {!readOnly ? (
              <>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setDrawTool("pen")}
                    variant={drawTool === "pen" ? "default" : "outline"}
                    className={drawTool === "pen" ? "bg-amber-500 hover:bg-amber-600 text-slate-900" : "border-slate-600 text-slate-300"}
                  >
                    Caneta
                  </Button>
                  <Button
                    onClick={() => setDrawTool("eraser")}
                    variant={drawTool === "eraser" ? "default" : "outline"}
                    className={drawTool === "eraser" ? "bg-amber-500 hover:bg-amber-600 text-slate-900" : "border-slate-600 text-slate-300"}
                  >
                    Borracha
                  </Button>
                </div>

                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setDrawColor(color);
                        setDrawTool("pen");
                      }}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: drawColor === color ? "white" : "#475569",
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Tam:</span>
                  <Input
                    type="range"
                    min="2"
                    max="24"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-20 bg-slate-700 border-slate-600"
                  />
                  <span className="text-sm text-slate-400 w-6">{brushSize}</span>
                </div>

                <div className="ml-auto flex gap-2">
                  <Button
                    onClick={() => fileRef.current?.click()}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    Carregar Imagem
                  </Button>
                  <Button
                    onClick={handleClearCanvas}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900"
                  >
                    Limpar
                  </Button>
                  <Button
                    onClick={handleSaveCanvas}
                    disabled={saveCanvasMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saveCanvasMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleLoadImage}
                />
              </>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-sm">
                  🔒 Modo visualização (Atualiza a cada 2 segundos)
                </span>
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300"
                >
                  Atualizar Agora
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Canvas com Painel Lateral */}
      <div className="flex gap-4 h-[calc(100vh-400px)] min-h-96">
        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden relative"
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

        {/* Participants Panel */}
        <Card className="w-64 bg-slate-800 border-slate-700 flex flex-col">
          <CardContent className="pt-4 flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-100">Participantes</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {allUsers && allUsers.length > 0 ? (
                allUsers.map((participant) => (
                  <div
                    key={participant.userId}
                    className={`p-2 rounded border text-sm ${
                      participant.role === "mestre"
                        ? "bg-red-900 border-red-700"
                        : "bg-blue-900 border-blue-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {participant.role === "mestre" ? (
                        <Crown className="w-4 h-4 text-red-400" />
                      ) : (
                        <Sword className="w-4 h-4 text-blue-400" />
                      )}
                      <span className="font-semibold text-slate-100 truncate">
                        {participant.userName}
                        {participant.userId === user?.id && " (Você)"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 ml-6">
                      {participant.role === "mestre"
                        ? "👑 Mestre"
                        : `⚔️ ${participant.characterName || "Sem personagem"}`}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs">Nenhum participante conectado.</p>
              )}
            </div>

            {/* Status Info */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  <span className="font-semibold text-slate-300">Seu papel:</span>
                </p>
                <p className={`px-2 py-1 rounded text-center font-semibold ${
                  activeRole === "mestre"
                    ? "bg-red-900 text-red-200"
                    : "bg-blue-900 text-blue-200"
                }`}>
                  {activeRole === "mestre" ? "👑 MESTRE" : "⚔️ JOGADOR"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {readOnly && (
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="pt-4 text-sm text-slate-300">
            <p>
              <span className="font-semibold text-blue-400">👁️ Visualização em Tempo Real:</span> Você está vendo o mapa do Mestre. A tela se atualiza automaticamente a cada 2 segundos ou você pode clicar em "Atualizar Agora" para ver as mudanças imediatamente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
