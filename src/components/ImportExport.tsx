import { useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Upload, Download, Trash2 } from "lucide-react";
import { Product, Sessao, newId } from "@/lib/auditStorage";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { syncSessao, syncAll } from "@/lib/syncService";
import { getServerUrl } from "@/lib/serverApi";

interface Props {
  products: Product[];
  onImport: (products: Product[], sessao: Sessao) => void;
  onClear: () => void;
  sessao: Sessao | null;
}

const pickField = (row: Record<string, unknown>, candidates: string[]) => {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const k = keys.find((k) => k.toLowerCase().trim() === c.toLowerCase());
    if (k) return row[k];
  }
  return undefined;
};

export const ImportExport = ({ products, onImport, onClear, sessao }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      if (!rows.length) {
        toast.error("Planilha vazia");
        return;
      }

      const sessaoId = newId();
      const novaSessao: Sessao = {
        id: sessaoId,
        nome: file.name.replace(/\.xlsx?$/i, ""),
        criado_em: new Date().toISOString(),
        total: rows.length,
      };

      const imported: Product[] = rows
        .map((row, i) => {
          const codigo = String(pickField(row, ["codigo", "código", "code", "cod"]) ?? "").trim();
          const descricao = String(
            pickField(row, ["descricao", "descrição", "description", "desc", "produto"]) ?? "",
          ).trim();
          const qtdRaw = pickField(row, ["quantidade", "qtd", "qty", "quantity"]);
          const quantidade = Number(qtdRaw) || 0;
          const codigoBarras =
            String(
              pickField(row, [
                "codigo de barras",
                "código de barras",
                "ean",
                "barcode",
                "gtin",
                "codbarras",
              ]) ?? "",
            ).trim() || undefined;
          return {
            id: `${sessaoId}-${codigo || i}-${i}`,
            sessaoId,
            codigo,
            codigoBarras,
            descricao,
            quantidade,
            status: "pending" as const,
          };
        })
        .filter((p) => p.codigo || p.descricao);

      onImport(imported, novaSessao);
      toast.success(`${imported.length} produtos importados (sessão ${novaSessao.nome})`);

      // Envia ao servidor (se configurado)
      if (getServerUrl()) {
        await syncSessao(novaSessao);
        try {
          await syncAll(novaSessao, imported);
          toast.success("Sessão sincronizada com o servidor");
        } catch (e) {
          console.warn(e);
          toast.error("Não foi possível sincronizar com o servidor");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ler o arquivo");
    }
  };

  const exportXlsx = () => {
    if (!products.length) {
      toast.error("Nada para exportar");
      return;
    }
    const data = products.map((p) => ({
      Código: p.codigo,
      "Código de Barras": p.codigoBarras ?? "",
      Descrição: p.descricao,
      "Qtd Esperada": p.quantidade,
      Status:
        p.status === "found" ? "Encontrado" : p.status === "not_found" ? "Não encontrado" : "Pendente",
      "Qtd Encontrada": p.qtdEncontrada ?? "",
      Auditor: p.auditor ?? "",
      Data: p.data ? new Date(p.data).toLocaleString("pt-BR") : "",
      "Na Área de Venda": p.naAreaVenda ? "Sim" : "Não",
      "Área Venda Por": p.areaVendaAuditor ?? "",
      "Área Venda Em": p.areaVendaData ? new Date(p.areaVendaData).toLocaleString("pt-BR") : "",
      "Tem Foto": p.fotoId ? "Sim" : "Não",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
    const nome = sessao?.nome || "auditoria";
    XLSX.writeFile(wb, `${nome}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()} className="flex-col h-auto py-3">
        <Upload className="h-5 w-5 mb-1" />
        <span className="text-xs">Importar</span>
      </Button>
      <Button variant="outline" onClick={exportXlsx} className="flex-col h-auto py-3">
        <Download className="h-5 w-5 mb-1" />
        <span className="text-xs">Exportar</span>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="flex-col h-auto py-3 text-destructive hover:text-destructive">
            <Trash2 className="h-5 w-5 mb-1" />
            <span className="text-xs">Limpar</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar sessão atual?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove os produtos da auditoria atual no celular. O histórico no servidor é preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onClear}>Limpar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
