import { useState } from "react";
import { Product, saveFotoLocal, newId } from "@/lib/auditStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, RotateCcw, PackageSearch, Store, Camera, Image as ImageIcon } from "lucide-react";
import { PhotoCapture } from "./PhotoCapture";
import { PhotoViewer } from "./PhotoViewer";
import { syncProduct, syncFoto } from "@/lib/syncService";
import { toast } from "sonner";

interface Props {
  product: Product;
  auditor: string;
  onUpdate: (p: Product) => void;
  onRequireAuditor: () => void;
}

export const ProductCard = ({ product, auditor, onUpdate, onRequireAuditor }: Props) => {
  const [qtd, setQtd] = useState<string>(String(product.qtdEncontrada ?? product.quantidade));
  const [confirming, setConfirming] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  const persist = async (p: Product) => {
    onUpdate(p);
    syncProduct(p);
  };

  const markFound = () => {
    if (!auditor) return onRequireAuditor();
    const n = Number(qtd);
    persist({
      ...product,
      status: "found",
      qtdEncontrada: isNaN(n) ? 0 : n,
      auditor,
      data: new Date().toISOString(),
    });
    setConfirming(false);
  };

  const markNotFound = () => {
    if (!auditor) return onRequireAuditor();
    persist({
      ...product,
      status: "not_found",
      qtdEncontrada: undefined,
      auditor,
      data: new Date().toISOString(),
      naAreaVenda: false,
      areaVendaAuditor: undefined,
      areaVendaData: undefined,
      fotoId: undefined,
    });
  };

  const requestAreaVenda = () => {
    if (!auditor) return onRequireAuditor();
    if (product.naAreaVenda) {
      // Remover (não exige foto)
      persist({
        ...product,
        naAreaVenda: false,
        areaVendaAuditor: undefined,
        areaVendaData: undefined,
        fotoId: undefined,
      });
    } else {
      // Exigir foto
      setPhotoOpen(true);
    }
  };

  const onPhotoCaptured = async (dataUrl: string, bytes: number) => {
    const id = newId();
    saveFotoLocal(id, dataUrl);
    setPhotoOpen(false);
    persist({
      ...product,
      naAreaVenda: true,
      areaVendaAuditor: auditor,
      areaVendaData: new Date().toISOString(),
      fotoId: id,
    });
    const ok = await syncFoto(id, dataUrl);
    toast.success(
      `Foto salva (${(bytes / 1024).toFixed(0)} KB)${ok ? " e enviada ao servidor" : " (apenas local)"}`,
    );
  };

  const reset = () => {
    persist({
      ...product,
      status: "pending",
      qtdEncontrada: undefined,
      auditor: undefined,
      data: undefined,
      naAreaVenda: false,
      areaVendaAuditor: undefined,
      areaVendaData: undefined,
      fotoId: undefined,
    });
    setConfirming(false);
  };

  const statusBadge = () => {
    if (product.status === "found")
      return <Badge className="bg-green-600 hover:bg-green-600">Encontrado</Badge>;
    if (product.status === "not_found")
      return <Badge variant="destructive">Não encontrado</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <PackageSearch className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-mono text-sm font-semibold">{product.codigo}</span>
            {product.codigoBarras && (
              <span className="font-mono text-xs text-muted-foreground">
                · {product.codigoBarras}
              </span>
            )}
          </div>
          <p className="text-sm mt-1 break-words">{product.descricao}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Qtd esperada: <span className="font-medium">{product.quantidade}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {statusBadge()}
          {product.naAreaVenda && (
            <Badge className="bg-blue-600 hover:bg-blue-600">
              <Store className="h-3 w-3" /> Na área
            </Badge>
          )}
        </div>
      </div>

      {product.status !== "pending" && (
        <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
          {product.status === "found" && (
            <p>Encontrado: <span className="font-medium text-foreground">{product.qtdEncontrada}</span></p>
          )}
          <p>Por: <span className="font-medium text-foreground">{product.auditor}</span></p>
          <p>Em: {product.data && new Date(product.data).toLocaleString("pt-BR")}</p>
          {product.naAreaVenda && (
            <div className="flex items-center justify-between gap-2 text-blue-700">
              <span>
                Na área por <span className="font-medium">{product.areaVendaAuditor}</span>
                {product.areaVendaData && ` em ${new Date(product.areaVendaData).toLocaleString("pt-BR")}`}
              </span>
              {product.fotoId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => setViewing(product.fotoId!)}
                >
                  <ImageIcon className="h-4 w-4" /> Ver foto
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {product.status === "pending" && !confirming && (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => setConfirming(true)} className="bg-green-600 hover:bg-green-700">
            <Check className="h-4 w-4" /> Encontrei
          </Button>
          <Button variant="destructive" onClick={markNotFound}>
            <X className="h-4 w-4" /> Não achei
          </Button>
        </div>
      )}

      {confirming && (
        <div className="space-y-2">
          <label className="text-xs font-medium">Quantidade encontrada</label>
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="numeric"
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
              autoFocus
            />
            <Button onClick={markFound} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4" /> Confirmar
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} className="w-full">
            Cancelar
          </Button>
        </div>
      )}

      {product.status === "found" && (
        <Button
          variant={product.naAreaVenda ? "secondary" : "default"}
          size="sm"
          onClick={requestAreaVenda}
          className={
            product.naAreaVenda
              ? "w-full"
              : "w-full bg-blue-600 hover:bg-blue-700 text-white"
          }
        >
          {product.naAreaVenda ? (
            <>
              <Store className="h-4 w-4" /> Remover da área de venda
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" /> Colocar na área (com foto)
            </>
          )}
        </Button>
      )}

      {product.status !== "pending" && (
        <Button variant="ghost" size="sm" onClick={reset} className="w-full">
          <RotateCcw className="h-4 w-4" /> Refazer auditoria
        </Button>
      )}

      <PhotoCapture
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onCaptured={onPhotoCaptured}
      />
      <PhotoViewer fotoId={viewing} onClose={() => setViewing(null)} />
    </div>
  );
};
