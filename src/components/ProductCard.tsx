import { useState } from "react";
import { Product } from "@/lib/auditStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, RotateCcw, PackageSearch } from "lucide-react";

interface Props {
  product: Product;
  auditor: string;
  onUpdate: (p: Product) => void;
  onRequireAuditor: () => void;
}

export const ProductCard = ({ product, auditor, onUpdate, onRequireAuditor }: Props) => {
  const [qtd, setQtd] = useState<string>(String(product.qtdEncontrada ?? product.quantidade));
  const [confirming, setConfirming] = useState(false);

  const markFound = () => {
    if (!auditor) return onRequireAuditor();
    const n = Number(qtd);
    onUpdate({
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
    onUpdate({
      ...product,
      status: "not_found",
      qtdEncontrada: undefined,
      auditor,
      data: new Date().toISOString(),
    });
  };

  const reset = () => {
    onUpdate({
      ...product,
      status: "pending",
      qtdEncontrada: undefined,
      auditor: undefined,
      data: undefined,
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
          <div className="flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-mono text-sm font-semibold">{product.codigo}</span>
          </div>
          <p className="text-sm mt-1 break-words">{product.descricao}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Qtd esperada: <span className="font-medium">{product.quantidade}</span>
          </p>
        </div>
        {statusBadge()}
      </div>

      {product.status !== "pending" && (
        <div className="text-xs text-muted-foreground border-t pt-2">
          {product.status === "found" && (
            <p>Encontrado: <span className="font-medium text-foreground">{product.qtdEncontrada}</span></p>
          )}
          <p>Por: <span className="font-medium text-foreground">{product.auditor}</span></p>
          <p>Em: {product.data && new Date(product.data).toLocaleString("pt-BR")}</p>
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

      {product.status !== "pending" && (
        <Button variant="ghost" size="sm" onClick={reset} className="w-full">
          <RotateCcw className="h-4 w-4" /> Refazer auditoria
        </Button>
      )}
    </div>
  );
};
