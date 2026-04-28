import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Server, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getServerUrl, setServerUrl, ping } from "@/lib/serverApi";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ServerSettings = ({ open, onClose }: Props) => {
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"unknown" | "ok" | "fail">("unknown");

  useEffect(() => {
    if (open) {
      setUrl(getServerUrl());
      setStatus("unknown");
    }
  }, [open]);

  const test = async () => {
    setTesting(true);
    setStatus("unknown");
    const ok = await ping(url);
    setStatus(ok ? "ok" : "fail");
    setTesting(false);
  };

  const save = async () => {
    setServerUrl(url);
    toast.success(url ? "Servidor configurado" : "Servidor desconectado");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" /> Servidor local
          </DialogTitle>
          <DialogDescription>
            Endereço do PC Windows (mesma rede Wi-Fi). Ex: <code>http://192.168.1.10:4000</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="http://192.168.1.10:4000"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
          />

          <Button variant="outline" onClick={test} disabled={!url || testing} className="w-full">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Testar conexão"}
          </Button>

          {status === "ok" && (
            <p className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Servidor conectado!
            </p>
          )}
          {status === "fail" && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4" /> Não foi possível conectar. Confira IP, porta e Wi-Fi.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </div>

          <p className="text-xs text-muted-foreground border-t pt-3">
            Sem servidor configurado, o app continua funcionando só no celular,
            mas o histórico não acumula entre auditorias e fotos podem ser perdidas
            se o celular ficar sem espaço.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
