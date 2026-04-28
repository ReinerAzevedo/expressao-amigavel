import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export const BarcodeScanner = ({ open, onClose, onDetected }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const reader = new BrowserMultiFormatReader();
    let stopped = false;

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const back =
          devices.find((d) => /back|traseira|rear|environment/i.test(d.label)) ||
          devices[devices.length - 1];
        const controls = await reader.decodeFromVideoDevice(
          back?.deviceId,
          videoRef.current!,
          (result, err, ctrl) => {
            if (stopped) return;
            if (result) {
              ctrl.stop();
              onDetected(result.getText());
            }
          },
        );
        controlsRef.current = controls;
      } catch (e) {
        console.error(e);
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    })();

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetected]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> Ler código de barras
          </DialogTitle>
        </DialogHeader>
        <div className="relative bg-black aspect-square">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-primary rounded-lg pointer-events-none" />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-white bg-black/70">
              {error}
            </div>
          )}
        </div>
        <div className="p-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            <X className="h-4 w-4" /> Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
