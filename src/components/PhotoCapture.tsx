import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, RefreshCw, Check } from "lucide-react";
import { compressImage } from "@/lib/imageCompress";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onCaptured: (dataUrl: string, bytes: number) => void;
}

export const PhotoCapture = ({ open, onClose, onCaptured }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      stopStream();
      setPreview(null);
      return;
    }
    setError(null);
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error(e);
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    })();
    return stopStream;
  }, [open]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const snap = async () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    const raw = c.toDataURL("image/jpeg", 0.92);
    setBusy(true);
    try {
      const { dataUrl } = await compressImage(raw, 800, 0.7);
      setPreview(dataUrl);
      stopStream();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao processar foto");
    } finally {
      setBusy(false);
    }
  };

  const retake = async () => {
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("Câmera indisponível");
    }
  };

  const confirm = async () => {
    if (!preview) return;
    const bytes = Math.floor(((preview.length - 23) * 3) / 4);
    onCaptured(preview, bytes);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> Foto da área de venda
          </DialogTitle>
        </DialogHeader>
        <div className="relative bg-black aspect-square">
          {preview ? (
            <img src={preview} alt="Pré-visualização" className="w-full h-full object-cover" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-white bg-black/70">
              {error}
            </div>
          )}
        </div>
        <div className="p-4 grid grid-cols-2 gap-2">
          {preview ? (
            <>
              <Button variant="outline" onClick={retake}>
                <RefreshCw className="h-4 w-4" /> Refazer
              </Button>
              <Button onClick={confirm} className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4" /> Confirmar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={snap} disabled={busy || !!error}>
                <Camera className="h-4 w-4" /> {busy ? "Processando..." : "Capturar"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
