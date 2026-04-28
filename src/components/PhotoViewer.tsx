import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getFotoLocal } from "@/lib/auditStorage";
import { api, getServerUrl } from "@/lib/serverApi";
import { ImageOff } from "lucide-react";

interface Props {
  fotoId: string | null;
  onClose: () => void;
}

export const PhotoViewer = ({ fotoId, onClose }: Props) => {
  const [src, setSrc] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!fotoId) {
      setSrc(null);
      setMissing(false);
      return;
    }
    setMissing(false);
    const local = getFotoLocal(fotoId);
    if (local) {
      setSrc(local);
      return;
    }
    if (getServerUrl()) {
      const url = api.fotoUrl(fotoId);
      // testa rapidamente
      const img = new Image();
      img.onload = () => setSrc(url);
      img.onerror = () => setMissing(true);
      img.src = url;
    } else {
      setMissing(true);
    }
  }, [fotoId]);

  return (
    <Dialog open={!!fotoId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Foto da auditoria</DialogTitle>
        </DialogHeader>
        <div className="bg-black aspect-square flex items-center justify-center">
          {src ? (
            <img src={src} alt="Foto da auditoria" className="w-full h-full object-contain" />
          ) : missing ? (
            <div className="text-center text-white p-4 space-y-2">
              <ImageOff className="h-8 w-8 mx-auto" />
              <p className="text-sm">
                Foto não disponível no celular. Conecte ao servidor para visualizar.
              </p>
            </div>
          ) : (
            <p className="text-white text-sm">Carregando...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
