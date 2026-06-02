"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, X, RefreshCw, Volume2, VolumeX } from "lucide-react";

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerModal({
  open,
  onOpenChange,
  onScan,
}: BarcodeScannerModalProps) {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [scanCooldown, setScanCooldown] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<string>("");

  const scannerRef = useRef<any>(null);
  const containerId = "barcode-scanner-viewport";
  const isMounted = useRef<boolean>(true);
  const isTransitioning = useRef<boolean>(false);

  // Play synthetic beep on scan success
  const playBeep = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(950, ctx.currentTime); // Crisp A5# frequency
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Failed to play scanner beep:", e);
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
        if (scanner.isScanning) {
          isTransitioning.current = true;
          scanner.stop().then(() => {
            scanner.clear();
            isTransitioning.current = false;
          }).catch((err: any) => {
            console.error(err);
            isTransitioning.current = false;
          });
        }
        scannerRef.current = null;
      }
      setErrorMsg("");
      setLastScanned("");
      return;
    }

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        
        if (!isMounted.current) return;

        // Check if container element exists
        const el = document.getElementById(containerId);
        if (!el) {
          // Retry in next frame if container is not rendered yet
          if (isMounted.current) {
            setTimeout(startScanner, 100);
          }
          return;
        }

        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        activeScanner = scanner;

        // Get available cameras
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted.current) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          
          // Select default camera (prefer back/environment camera)
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("environment") ||
            d.label.toLowerCase().includes("rear")
          );
          const defaultCamId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(defaultCamId);
          
          // Start scanning
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
      if (activeScanner && activeScanner.isScanning) {
        isTransitioning.current = true;
        activeScanner.stop().then(() => {
          isTransitioning.current = false;
        }).catch((err: any) => {
          console.error(err);
          isTransitioning.current = false;
        });
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
            // Responsive QR box overlay
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size * 0.5 }; // wide for barcodes
          },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          const now = Date.now();
          // Cooldown of 2 seconds for the exact same barcode to prevent duplicate scans
          if (decodedText === lastCode && now - lastTime < 2000) {
            return;
          }
          
          lastCode = decodedText;
          lastTime = now;
          
          playBeep();
          setLastScanned(decodedText);
          onScan(decodedText);

          // Flash scanner effect
          setScanCooldown(true);
          setTimeout(() => {
            if (isMounted.current) setScanCooldown(false);
          }, 800);
        },
        () => {
          // Verbose scan error, safe to ignore
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/50 shadow-2xl rounded-3xl">
        <form className="p-6 flex flex-col items-center">
          <DialogHeader className="w-full text-center relative">
            <DialogTitle className="text-sm font-bold text-foreground/90 flex items-center justify-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Scan Barcode Produk
            </DialogTitle>
            <p className="text-[10px] text-muted-foreground/60">Posisikan barcode produk di dalam area kotak pemindai.</p>
          </DialogHeader>

          {/* Scanner Viewport Box */}
          <div className="relative w-full aspect-video sm:aspect-square bg-black border border-border/40 rounded-2xl overflow-hidden mt-5 shadow-inner flex items-center justify-center">
            
            {/* Native viewport div container for html5-qrcode */}
            <div id={containerId} className="w-full h-full object-cover [&>video]:object-cover" />

            {/* Glowing laser line & Scan frame overlay */}
            {!errorMsg && cameras.length > 0 && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Visual Scanner Area Box */}
                <div className={`w-[70%] h-[35%] border-2 border-primary/60 rounded-xl relative transition-all duration-300 ${
                  scanCooldown ? "bg-primary/20 scale-[1.03] border-emerald-400" : "bg-transparent"
                }`}>
                  {/* Corner styling */}
                  <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary -translate-x-[2px] -translate-y-[2px] rounded-tl-md" />
                  <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary translate-x-[2px] -translate-y-[2px] rounded-tr-md" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary -translate-x-[2px] translate-y-[2px] rounded-bl-md" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary translate-x-[2px] translate-y-[2px] rounded-br-md" />

                  {/* Animated laser line */}
                  <div className={`w-full h-[2px] bg-primary shadow-[0_0_10px_#ea580c] absolute left-0 ${
                    scanCooldown ? "hidden" : "animate-scanner-laser"
                  }`} />
                </div>
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
                    onOpenChange(true); // Retrigger useEffect by reloading
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

          {/* Scanned Feedback info */}
          {lastScanned && (
            <div className="w-full mt-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Terbaca</p>
              <p className="text-xs font-mono font-bold text-foreground/90 mt-1">{lastScanned}</p>
            </div>
          )}

          {/* Controls Footer */}
          <div className="w-full mt-5 flex items-center justify-between gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/40">
            {/* Camera Select dropdown */}
            {cameras.length > 1 ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="bg-transparent border-0 text-[10px] font-semibold text-muted-foreground/90 outline-none flex-1 truncate cursor-pointer"
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
                {cameras.length === 1 ? "1 Kamera Aktif" : "Menunggu Izin"}
              </div>
            )}

            {/* Mute button */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-foreground/[0.05] transition-all border border-border/20 text-muted-foreground/80"
              title={isMuted ? "Bunyikan Suara" : "Bisukan Suara"}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 px-4 rounded-lg bg-foreground/[0.04] hover:bg-foreground/[0.08] text-[10px] font-bold text-foreground/80 transition-all uppercase tracking-wider"
            >
              Tutup
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
