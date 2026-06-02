"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, X, RefreshCw, Volume2, VolumeX, CheckCircle, AlertTriangle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  barcode?: string | null;
}

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
  products: Product[];
}

interface ScannedHistoryItem {
  id: string;
  name: string;
  price: number;
  barcode: string;
  timestamp: number;
  status: "success" | "error";
}

let globalScannerInstance: any = null;
let globalCleanupPromise: Promise<void> = Promise.resolve();

export function BarcodeScannerModal({
  open,
  onOpenChange,
  onScan,
  products,
}: BarcodeScannerModalProps) {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [scanCooldown, setScanCooldown] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<string>("");
  const [scannedHistory, setScannedHistory] = useState<ScannedHistoryItem[]>([]);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const scannerRef = useRef<any>(null);
  const containerId = "barcode-scanner-viewport";
  const isMounted = useRef<boolean>(true);
  const isTransitioning = useRef<boolean>(false);

  // Play synthetic success beep (crisp high-pitched chime)
  const playBeep = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Failed to play success beep:", e);
    }
  };

  // Play synthetic error buzz (low pitch warning buzz)
  const playErrorBuzz = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Failed to play error buzz:", e);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    let activeScanner: any = null;

    if (!open) {
      isMounted.current = false;
      // Clean up when modal closes
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        globalCleanupPromise = (async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
            scanner.clear();
          } catch (err: any) {
            console.error("Cleanup on close error:", err);
          } finally {
            if (globalScannerInstance === scanner) {
              globalScannerInstance = null;
            }
          }
        })();
      }
      setErrorMsg("");
      setLastScanned("");
      setScannedHistory([]);
      setIsClosing(false);
      return;
    }

    const startScanner = async () => {
      try {
        await globalCleanupPromise;
        const { Html5Qrcode } = await import("html5-qrcode");
        
        if (!isMounted.current) return;

        if (globalScannerInstance) {
          const oldScanner = globalScannerInstance;
          globalScannerInstance = null;
          try {
            if (oldScanner.isScanning) {
              await oldScanner.stop();
            }
            oldScanner.clear();
          } catch (e) {
            console.error("Error clearing stale global scanner:", e);
          }
        }

        const el = document.getElementById(containerId);
        if (!el) {
          if (isMounted.current) {
            setTimeout(startScanner, 100);
          }
          return;
        }

        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        globalScannerInstance = scanner;
        activeScanner = scanner;

        const devices = await Html5Qrcode.getCameras();
        if (!isMounted.current) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("environment") ||
            d.label.toLowerCase().includes("rear")
          );
          const defaultCamId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(defaultCamId);
          
          await startScanningWithId(scanner, defaultCamId);
        } else {
          setErrorMsg("Kamera tidak ditemukan. Pastikan izin kamera telah diberikan.");
        }
      } catch (err: any) {
        console.error("Scanner init error:", err);
        if (isMounted.current) {
          setErrorMsg(err.message || "Gagal menginisialisasi kamera.");
        }
      }
    };

    startScanner();

    return () => {
      isMounted.current = false;
      if (activeScanner) {
        scannerRef.current = null;
        globalCleanupPromise = (async () => {
          try {
            if (activeScanner.isScanning) {
              await activeScanner.stop();
            }
            activeScanner.clear();
          } catch (err: any) {
            console.error("Cleanup on unmount error:", err);
          } finally {
            if (globalScannerInstance === activeScanner) {
              globalScannerInstance = null;
            }
          }
        })();
      }
    };
  }, [open]);

  const startScanningWithId = async (scanner: any, cameraId: string) => {
    if (!isMounted.current) return;
    if (isTransitioning.current) {
      console.warn("Scanner is already transitioning, skipping start/stop request.");
      return;
    }

    isTransitioning.current = true;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      
      if (!isMounted.current) {
        isTransitioning.current = false;
        return;
      }
      
      let lastCode = "";
      let lastTime = 0;

      await scanner.start(
        cameraId,
        {
          fps: 15,
          qrbox: (width: number, height: number) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size * 0.45 }; // wide layout for barcodes
          },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          const now = Date.now();
          // Fast continuous scanning cooldown: 1000ms for exact same barcode, 0ms for different barcodes
          if (decodedText === lastCode && now - lastTime < 1000) {
            return;
          }
          
          lastCode = decodedText;
          lastTime = now;
          
          setLastScanned(decodedText);
          
          // Match against products list to log in real-time history
          const matched = products.find(p => p.barcode === decodedText);
          if (matched) {
            playBeep();
            setScannedHistory(prev => [
              {
                id: matched.id,
                name: matched.name,
                price: matched.price,
                barcode: decodedText,
                timestamp: now,
                status: "success"
              },
              ...prev
            ]);
            onScan(decodedText);
          } else {
            playErrorBuzz();
            setScannedHistory(prev => [
              {
                id: Math.random().toString(),
                name: "Produk Tidak Dikenal",
                price: 0,
                barcode: decodedText,
                timestamp: now,
                status: "error"
              },
              ...prev
            ]);
          }

          // Trigger screen scan flash effect
          setScanCooldown(true);
          setTimeout(() => {
            if (isMounted.current) setScanCooldown(false);
          }, 400);
        },
        () => {
          // Scanner read errors, safe to ignore
        }
      );
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      isTransitioning.current = false;
    }
  };

  const handleCameraChange = async (cameraId: string) => {
    setSelectedCameraId(cameraId);
    if (scannerRef.current) {
      try {
        await startScanningWithId(scannerRef.current, cameraId);
      } catch (err: any) {
        setErrorMsg("Gagal beralih kamera: " + err.message);
      }
    }
  };

  // Safe asynchronous close function to prevent unmount crashes
  const handleClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch (e) {
        console.error("Error stopping scanner during manual close:", e);
      } finally {
        globalScannerInstance = null;
      }
    }
    
    setIsClosing(false);
    onOpenChange(false);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(val, eventDetails) => {
        if (eventDetails.reason === "outside-press" || eventDetails.reason === "escape-key") {
          return;
        }
        if (!val) handleClose();
      }}
    >
      <DialogContent 
        className="sm:max-w-[450px] p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/50 shadow-2xl rounded-3xl"
      >
        <div className="p-6 flex flex-col items-center">
          <DialogHeader className="w-full text-center relative">
            <DialogTitle className="text-sm font-bold text-foreground/90 flex items-center justify-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Scan Barcode Berlanjut
            </DialogTitle>
            <p className="text-[10px] text-muted-foreground/60">Arahkan kamera ke barcode produk. Anda dapat melakukan scan berulang kali.</p>
          </DialogHeader>

          {/* Scanner Viewport Box */}
          <div className="relative w-full aspect-video bg-black border border-border/40 rounded-2xl overflow-hidden mt-4 shadow-inner flex items-center justify-center">
            
            <div id={containerId} className="w-full h-full object-cover [&>video]:object-cover" />

            {/* Glowing laser line & Scan frame overlay */}
            {!errorMsg && cameras.length > 0 && !isClosing && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className={`w-[75%] h-[40%] border-2 border-primary/50 rounded-xl relative transition-all duration-300 ${
                  scanCooldown ? "bg-primary/20 scale-[1.03] border-emerald-400" : "bg-transparent"
                }`}>
                  <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary -translate-x-[2px] -translate-y-[2px] rounded-tl-md" />
                  <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary translate-x-[2px] -translate-y-[2px] rounded-tr-md" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary -translate-x-[2px] translate-y-[2px] rounded-bl-md" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary translate-x-[2px] translate-y-[2px] rounded-br-md" />

                  <div className={`w-full h-[2px] bg-primary shadow-[0_0_10px_#ea580c] absolute left-0 ${
                    scanCooldown ? "hidden" : "animate-scanner-laser"
                  }`} />
                </div>
              </div>
            )}

            {/* Closing Screen */}
            {isClosing && (
              <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center z-10 gap-3">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground/60 font-semibold tracking-wider uppercase">Menutup Kamera...</p>
              </div>
            )}

            {/* Error Message Screen */}
            {errorMsg && (
              <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center p-6 text-center z-10">
                <X className="h-8 w-8 text-red-500 bg-red-500/10 p-1.5 rounded-full mb-3" />
                <p className="text-xs text-foreground/80 font-medium leading-relaxed">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    onOpenChange(true);
                  }}
                  className="mt-4 h-8 px-4 rounded-xl bg-muted border border-border text-[10px] font-semibold text-foreground/70 hover:bg-accent transition-all"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Loading / Camera requesting Screen */}
            {!errorMsg && cameras.length === 0 && (
              <div className="absolute inset-0 bg-muted/20 flex flex-col items-center justify-center z-10 gap-3">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <p className="text-[10px] text-muted-foreground/60 font-semibold tracking-wider uppercase">Mengakses Kamera...</p>
              </div>
            )}
          </div>

          {/* Real-time Scanned History List */}
          <div className="w-full mt-4 flex flex-col">
            <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1.5">Riwayat Scan Sesi Ini</span>
            <div className="w-full max-h-[110px] overflow-y-auto border border-border/40 rounded-xl bg-muted/20 divide-y divide-border/20 custom-scrollbar p-1.5 space-y-1">
              {scannedHistory.length === 0 ? (
                <div className="py-6 text-center text-[10px] text-muted-foreground/30 italic">
                  Arahkan ke barcode produk untuk mulai scan
                </div>
              ) : (
                scannedHistory.map((item) => (
                  <div key={item.timestamp + item.id} className="flex items-center justify-between p-2 rounded-lg bg-background/40 hover:bg-background/80 transition-colors animate-fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.status === "success" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${item.status === "success" ? "text-foreground/80" : "text-amber-500/80"}`}>
                          {item.name}
                        </p>
                        <p className="text-[8px] font-mono text-muted-foreground/50">{item.barcode}</p>
                      </div>
                    </div>
                    {item.status === "success" && (
                      <span className="text-[10px] font-bold text-foreground/75 tabular-nums pl-2">
                        Rp {item.price.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Controls Footer */}
          <div className="w-full mt-4 flex items-center justify-between gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/40">
            {/* Camera Select dropdown */}
            {cameras.length > 1 ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <select
                  value={selectedCameraId}
                  disabled={isClosing}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="bg-transparent border-0 text-[10px] font-semibold text-muted-foreground/90 outline-none flex-1 truncate cursor-pointer disabled:opacity-50"
                >
                  {cameras.map((cam) => (
                    <option key={cam.id} value={cam.id} className="bg-popover text-foreground text-xs">
                      {cam.label || `Kamera ${cameras.indexOf(cam) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider pl-1.5">
                {cameras.length === 1 ? "Kamera Aktif" : "Menunggu Izin"}
              </div>
            )}

            {/* Mute button */}
            <button
              type="button"
              disabled={isClosing}
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-foreground/[0.05] transition-all border border-border/20 text-muted-foreground/80 disabled:opacity-50"
              title={isMuted ? "Bunyikan Suara" : "Bisukan Suara"}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              disabled={isClosing}
              onClick={handleClose}
              className="h-8 px-4 rounded-lg bg-foreground/[0.04] hover:bg-foreground/[0.08] text-[10px] font-bold text-foreground/80 transition-all uppercase tracking-wider disabled:opacity-50"
            >
              Tutup
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
