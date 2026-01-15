import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, PencilBrush, Rect, IText, FabricImage, Object as FabricObject } from "fabric";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Pen,
  Square,
  Type,
  Image,
  Trash2,
  Download,
  Undo,
  Redo,
  MousePointer,
  StickyNote,
  Palette,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";

// Predefined colors for the palette
const COLORS = [
  "#000000", // Black
  "#ffffff", // White
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
];

// Sticky note colors
const STICKY_COLORS = [
  "#fef08a", // Yellow
  "#fed7aa", // Orange
  "#fecaca", // Red
  "#bbf7d0", // Green
  "#bfdbfe", // Blue
  "#e9d5ff", // Purple
  "#fce7f3", // Pink
];

type Tool = "select" | "pen" | "rectangle" | "text" | "sticky" | "image";

const Whiteboard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushWidth, setBrushWidth] = useState(3);
  const [stickyColor, setStickyColor] = useState("#fef08a");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isLoadingHistory = useRef(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(600, container.clientHeight);

    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    // Save initial state
    saveToHistory();

    // Handle paste events
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await addImageFromFile(file);
          }
        }
      }
    };

    // Handle drop events
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer?.files;
      if (!files) return;

      for (const file of files) {
        if (file.type.startsWith("image/")) {
          await addImageFromFile(file);
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add event listeners
    document.addEventListener("paste", handlePaste);
    container.addEventListener("drop", handleDrop);
    container.addEventListener("dragover", handleDragOver);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !fabricCanvasRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      fabricCanvasRef.current.setWidth(newWidth);
      fabricCanvasRef.current.renderAll();
    };

    window.addEventListener("resize", handleResize);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      // Delete selected objects
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObjects = canvas.getActiveObjects();
        activeObjects.forEach((obj) => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
        saveToHistory();
      }

      // Undo (Ctrl/Cmd + Z)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo (Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y)
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Listen for object modifications
    canvas.on("object:modified", saveToHistory);
    canvas.on("object:added", () => {
      if (!isLoadingHistory.current) {
        saveToHistory();
      }
    });
    canvas.on("object:removed", () => {
      if (!isLoadingHistory.current) {
        saveToHistory();
      }
    });

    return () => {
      document.removeEventListener("paste", handlePaste);
      container.removeEventListener("drop", handleDrop);
      container.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
      canvas.dispose();
    };
  }, []);

  // Update brush settings when color or width changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }
  }, [brushColor, brushWidth]);

  // Update drawing mode based on active tool
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === "pen";
    canvas.selection = activeTool === "select";

    if (activeTool === "pen") {
      const brush = new PencilBrush(canvas);
      brush.color = brushColor;
      brush.width = brushWidth;
      canvas.freeDrawingBrush = brush;
    }
  }, [activeTool, brushColor, brushWidth]);

  const saveToHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || isLoadingHistory.current) return;

    const json = JSON.stringify(canvas.toJSON());

    // Remove any states after current index (for redo)
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);

    // Add new state
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;

    // Limit history size
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;

    isLoadingHistory.current = true;
    historyIndexRef.current--;
    const state = historyRef.current[historyIndexRef.current];

    canvas.loadFromJSON(JSON.parse(state), () => {
      canvas.renderAll();
      isLoadingHistory.current = false;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, []);

  const redo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;

    isLoadingHistory.current = true;
    historyIndexRef.current++;
    const state = historyRef.current[historyIndexRef.current];

    canvas.loadFromJSON(JSON.parse(state), () => {
      canvas.renderAll();
      isLoadingHistory.current = false;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, []);

  const addImageFromFile = async (file: File) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        const imgElement = document.createElement('img');
        imgElement.src = dataUrl;
        
        imgElement.onload = async () => {
          const fabricImage = new FabricImage(imgElement, {
            left: canvas.width! / 2 - imgElement.width / 4,
            top: canvas.height! / 2 - imgElement.height / 4,
            scaleX: 0.5,
            scaleY: 0.5,
          });
          canvas.add(fabricImage);
          canvas.setActiveObject(fabricImage);
          canvas.renderAll();
          resolve();
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const addStickyNote = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Create sticky note background
    const sticky = new Rect({
      left: 100 + Math.random() * 200,
      top: 100 + Math.random() * 200,
      width: 200,
      height: 200,
      fill: stickyColor,
      rx: 5,
      ry: 5,
      shadow: {
        color: "rgba(0,0,0,0.2)",
        blur: 10,
        offsetX: 3,
        offsetY: 3,
      } as any,
    });

    // Add text to sticky note
    const text = new IText(t("whiteboard.stickyPlaceholder") || "Click to edit...", {
      left: sticky.left! + 15,
      top: sticky.top! + 15,
      width: 170,
      fontSize: 16,
      fontFamily: "sans-serif",
      fill: "#333333",
    });

    canvas.add(sticky);
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addRectangle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const rect = new Rect({
      left: 100 + Math.random() * 200,
      top: 100 + Math.random() * 200,
      width: 100,
      height: 100,
      fill: "transparent",
      stroke: brushColor,
      strokeWidth: 2,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    setActiveTool("select");
  };

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const text = new IText(t("whiteboard.textPlaceholder") || "Click to edit text", {
      left: 100 + Math.random() * 200,
      top: 100 + Math.random() * 200,
      fontSize: 24,
      fontFamily: "sans-serif",
      fill: brushColor,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setActiveTool("select");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addImageFromFile(file);
    }
    e.target.value = "";
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    saveToHistory();
  };

  const clearCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();
    saveToHistory();

    toast({
      title: t("whiteboard.cleared") || "Canvas Cleared",
      description: t("whiteboard.clearedDesc") || "All objects have been removed.",
    });
  };

  const downloadCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement("a");
    link.download = `bamas-whiteboard-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    toast({
      title: t("whiteboard.downloaded") || "Whiteboard Saved",
      description: t("whiteboard.downloadedDesc") || "Your whiteboard has been downloaded as an image.",
    });
  };

  const saveAsJSON = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.download = `bamas-whiteboard-${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();

    toast({
      title: t("whiteboard.saved") || "Project Saved",
      description: t("whiteboard.savedDesc") || "Your whiteboard project has been saved.",
    });
  };

  const loadFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      try {
        isLoadingHistory.current = true;
        canvas.loadFromJSON(JSON.parse(json), () => {
          canvas.renderAll();
          isLoadingHistory.current = false;
          saveToHistory();

          toast({
            title: t("whiteboard.loaded") || "Project Loaded",
            description: t("whiteboard.loadedDesc") || "Your whiteboard project has been restored.",
          });
        });
      } catch (error) {
        toast({
          title: t("whiteboard.loadError") || "Load Error",
          description: t("whiteboard.loadErrorDesc") || "Failed to load the project file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const zoomIn = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const zoom = canvas.getZoom() * 1.2;
    canvas.setZoom(Math.min(zoom, 5));
    canvas.renderAll();
  };

  const zoomOut = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const zoom = canvas.getZoom() / 1.2;
    canvas.setZoom(Math.max(zoom, 0.2));
    canvas.renderAll();
  };

  const resetZoom = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.setZoom(1);
    canvas.renderAll();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pen className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("whiteboard.title") || "Collaborative Whiteboard"}</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Save/Load */}
          <Button variant="outline" size="sm" onClick={saveAsJSON} className="rounded-full">
            <Save className="h-4 w-4 mr-1" />
            {t("whiteboard.save") || "Save"}
          </Button>
          <label>
            <Button variant="outline" size="sm" className="rounded-full cursor-pointer" asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" />
                {t("whiteboard.load") || "Load"}
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={loadFromJSON}
            />
          </label>
          <Button variant="outline" size="sm" onClick={downloadCanvas} className="rounded-full">
            <Download className="h-4 w-4 mr-1" />
            {t("whiteboard.download") || "Download"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tools */}
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <Toggle
                pressed={activeTool === "select"}
                onPressedChange={() => setActiveTool("select")}
                size="sm"
                className="rounded-full"
                title={t("whiteboard.tools.select") || "Select (V)"}
              >
                <MousePointer className="h-4 w-4" />
              </Toggle>
              <Toggle
                pressed={activeTool === "pen"}
                onPressedChange={() => setActiveTool("pen")}
                size="sm"
                className="rounded-full"
                title={t("whiteboard.tools.pen") || "Pen (P)"}
              >
                <Pen className="h-4 w-4" />
              </Toggle>
              <Button
                variant="ghost"
                size="sm"
                onClick={addRectangle}
                className="rounded-full"
                title={t("whiteboard.tools.rectangle") || "Rectangle"}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={addText}
                className="rounded-full"
                title={t("whiteboard.tools.text") || "Text (T)"}
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={addStickyNote}
                className="rounded-full"
                title={t("whiteboard.tools.sticky") || "Sticky Note"}
              >
                <StickyNote className="h-4 w-4" />
              </Button>
              <label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full cursor-pointer"
                  title={t("whiteboard.tools.image") || "Add Image"}
                  asChild
                >
                  <span>
                    <Image className="h-4 w-4" />
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2"
                  title={t("whiteboard.tools.color") || "Color"}
                >
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: brushColor }}
                  />
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        brushColor === color ? "border-primary ring-2 ring-primary/50" : "border-muted"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setBrushColor(color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Sticky Note Color */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2"
                  title={t("whiteboard.tools.stickyColor") || "Sticky Note Color"}
                >
                  <div
                    className="h-4 w-4 rounded border"
                    style={{ backgroundColor: stickyColor }}
                  />
                  <StickyNote className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <div className="grid grid-cols-4 gap-2">
                  {STICKY_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`h-8 w-8 rounded border-2 transition-transform hover:scale-110 ${
                        stickyColor === color ? "border-primary ring-2 ring-primary/50" : "border-muted"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setStickyColor(color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Brush Width */}
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-muted-foreground w-6">{brushWidth}px</span>
              <Slider
                value={[brushWidth]}
                onValueChange={([value]) => setBrushWidth(value)}
                min={1}
                max={20}
                step={1}
                className="w-24"
              />
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="rounded-full"
                title={t("whiteboard.tools.undo") || "Undo (Ctrl+Z)"}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="rounded-full"
                title={t("whiteboard.tools.redo") || "Redo (Ctrl+Y)"}
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteSelected}
                className="rounded-full"
                title={t("whiteboard.tools.delete") || "Delete (Del)"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                className="rounded-full"
                title={t("whiteboard.tools.zoomOut") || "Zoom Out"}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="rounded-full"
                title={t("whiteboard.tools.resetZoom") || "Reset Zoom"}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                className="rounded-full"
                title={t("whiteboard.tools.zoomIn") || "Zoom In"}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1" />

            {/* Clear */}
            <Button
              variant="destructive"
              size="sm"
              onClick={clearCanvas}
              className="rounded-full"
            >
              {t("whiteboard.clear") || "Clear All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="relative bg-white rounded-b-lg overflow-hidden border-t"
            style={{ minHeight: "600px" }}
          >
            <canvas ref={canvasRef} />
          </div>
        </CardContent>
      </Card>

      {/* Shortcuts Legend */}
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium">{t("whiteboard.shortcuts") || "Shortcuts:"}</span>
            <span><kbd className="px-1.5 py-0.5 bg-background rounded text-[10px]">Ctrl+Z</kbd> {t("whiteboard.shortcut.undo") || "Undo"}</span>
            <span><kbd className="px-1.5 py-0.5 bg-background rounded text-[10px]">Ctrl+Y</kbd> {t("whiteboard.shortcut.redo") || "Redo"}</span>
            <span><kbd className="px-1.5 py-0.5 bg-background rounded text-[10px]">Del</kbd> {t("whiteboard.shortcut.delete") || "Delete"}</span>
            <span><kbd className="px-1.5 py-0.5 bg-background rounded text-[10px]">Ctrl+V</kbd> {t("whiteboard.shortcut.paste") || "Paste Image"}</span>
            <span>{t("whiteboard.shortcut.drag") || "Drag & Drop images supported"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Whiteboard;
